#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include "FS.h"
#include "SPIFFS.h"

const char* ssid = "Lanet8"; // WiFi SSID
const char* password = "20010227"; // WiFi password
const char* serverURL = "https://fishfeeder-824j.onrender.com/config"; // URL of server
#define FORMAT_SPIFFS_IF_FAILED true
const char* FILE_NAME = "/data.json";

HTTPClient http;
Servo myServo;

void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");

}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    http.begin(serverURL);

    int httpCode = http.GET();

    // rotate servo
    if (httpCode > 0) {
      if (httpCode == HTTP_CODE_OK) {
        // get JSON from server
        String docFromServer = http.getString();

        if(!SPIFFS.begin(FORMAT_SPIFFS_IF_FAILED)){
          Serial.println("SPIFFS Mount Failed");
          return;
        }

        if (!SPIFFS.exists("/data.json")){
          writeFile(SPIFFS, "/data.json", docFromServer.c_str());
        }




        String docFromESP = readFile(SPIFFS, "/data.json");
        if(docFromServer != docFromESP){
          JsonDocument jsonFromServer, jsonFromESP;
          deserializeJson(jsonFromServer, docFromServer);
          deserializeJson(jsonFromESP, docFromESP);

          //FeedNow
          if(jsonFromESP["feedNow"] != jsonFromServer["feedNow"]){
              jsonFromESP["feedNow"] = FeedNow();
              jsonFromServer["feedNow"] = FeedNow();
          }

          //portion size
          if(jsonFromESP["quantity"] != jsonFromServer["quantity"]){
            jsonFromESP["quantity"] = jsonFromServer["quantity"];
          }

          //repeat
          if(jsonFromESP["repeat"] != jsonFromServer["repeat"]){
            jsonFromESP["repeat"] = jsonFromServer["repeat"];
          }

          // interval
          if(jsonFromESP["interval"] != jsonFromServer["interval"]){
            jsonFromESP["interval"] = jsonFromServer["interval"];
          }

          // procent
          if(jsonFromServer["procent"] != jsonFromESP["procent"]){
            jsonFromServer["procent"] = jsonFromESP["procent"];
          }

          //send to server
          serializeJson(jsonFromServer, docFromServer);
          serializeJson(jsonFromESP, docFromESP);
          http.addHeader("Content-Type", "application/json");
          int httpCode = http.POST(docFromServer);

          if (httpCode > 0) {
            if (httpCode == HTTP_CODE_OK) {
              Serial.println("JSON file sent successfully");
            } else {
          Serial.print("Error: HTTP code ");
          Serial.println(httpCode);
            }
          }

          //write to file
          writeFile(SPIFFS, "/data.json", docFromESP.c_str());
        }

      } else {
      Serial.println("Error: Connection failed");
      }

    http.end();
    delay(10000);
    }
  }

  Serial.println("In the end read file: ");
  readFile(SPIFFS, "/data.json");
}

int FeedNow(){
  
        // servo
        myServo.attach(15);
        myServo.write(0); 
        delay(1000); 
        myServo.detach();

        Serial.println("FeedNow");

        return 0;
}

void listDir(fs::FS &fs, const char *dirname, uint8_t levels) {
  Serial.printf("Listing directory: %s\r\n", dirname);

  File root = fs.open(dirname);
  if (!root) {
    Serial.println("- failed to open directory");
    return;
  }
  if (!root.isDirectory()) {
    Serial.println(" - not a directory");
    return;
  }

  File file = root.openNextFile();
  while (file) {
    if (file.isDirectory()) {
      Serial.print("  DIR : ");
      Serial.println(file.name());
      if (levels) {
        listDir(fs, file.path(), levels - 1);
      }
    } else {
      Serial.print("  FILE: ");
      Serial.print(file.name());
      Serial.print("\tSIZE: ");
      Serial.println(file.size());
    }
    file = root.openNextFile();
  }
}


String readFile(fs::FS &fs, const char *path) {
  Serial.printf("Reading file: %s\r\n", path);
  File file = fs.open(path);

  if (!file || file.isDirectory()) {
    Serial.println("- failed to open file for reading");
    return ""; // Return an empty string on error
  }

  String content = "";
  while (file.available()) {
    content += char(file.read());
  }
  file.close();

  Serial.println("- read from file:");
  Serial.println(content);
  return content;
}

void writeFile(fs::FS &fs, const char *path, const char *message) {
  Serial.printf("Writing file: %s\r\n", path);

  File file = fs.open(path, FILE_WRITE);
  if (!file) {
    Serial.println("- failed to open file for writing");
    return;
  }
  if (file.print(message)) {
    Serial.println("- file written");
  } else {
    Serial.println("- write failed");
  }
  file.close();
}

