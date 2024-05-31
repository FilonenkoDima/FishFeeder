#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include "FS.h"
#include "SPIFFS.h"
#include "time.h"

//https://dl.espressif.com/dl/package_esp32_index.json

const char* ssid = "Lanet8"; // WiFi SSID
const char* password = "20010227"; // WiFi password
const char* serverURL = "https://fishfeeder-824j.onrender.com/config"; // URL of server
#define FORMAT_SPIFFS_IF_FAILED true
const char* FILE_NAME = "/data.json";
const float depthOfContainer = 15.0;

const int IRpin = 34;          // аналоговый пин для подключения выхода Vo сенсора
int value1;                    // для хранения аналогового значения  

HTTPClient http;
Servo myServo;

const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 2 * 60 * 60;
const int   daylightOffset_sec = 3600;

struct tm startTimeInfo;



// Усреднение нескольких значений для сглаживания
float irRead() {
  int averaging = 0;             //  переменная для суммирования данных
 
  // Получение 5 значений
  for (int i=0; i<5; i++) {
    value1 = analogRead(IRpin);
    averaging = averaging + value1;
    delay(55);      // Ожидание 55 ms перед каждым чтением
  }
  value1 = averaging / 5;      // усреднить значения

   float volts = value1 * 0.0048828125;
 // и в расстояние в см 
 float distance=32*pow(volts,-1.10);

 distance = distance > depthOfContainer ? depthOfContainer : distance;

  return distance;              
} 

int FeedNow(int portionSize){
  
        // servo
        myServo.attach(15);
        myServo.write(0); 
        int portion = portionSize * 100;
        delay(portion); 
        myServo.detach();

        Serial.println("FeedNow");

        return 0;
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


void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");

  //init and get the time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  getLocalTime(&startTimeInfo);

  //disconnect WiFi as it's no longer needed
  //WiFi.disconnect(true);
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    http.begin(serverURL);

    int httpCode = http.GET();

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

          //portion size
          if(jsonFromESP["quantity"] != jsonFromServer["quantity"]){
            jsonFromESP["quantity"] = jsonFromServer["quantity"];
          }

          //FeedNow
          if(jsonFromESP["feedNow"] != jsonFromServer["feedNow"]){
              jsonFromESP["feedNow"] = FeedNow(jsonFromESP["quantity"]);
              jsonFromServer["feedNow"] = FeedNow(jsonFromESP["quantity"]);
          }


          //repeat
          if(jsonFromESP["repeat"] != jsonFromServer["repeat"]){
            jsonFromESP["repeat"] = jsonFromServer["repeat"];
            struct tm timeinfo1;
            if(!getLocalTime(&timeinfo1)){
              Serial.println("Failed to obtain time");
            }
            startTimeInfo = timeinfo1;
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

    }
    http.end();

  }
  if(SPIFFS.exists("/data.json")){
    String docFromESP = readFile(SPIFFS, "/data.json");
    JsonDocument jsonFromESP;
    deserializeJson(jsonFromESP, docFromESP);

    Serial.println((int)(irRead() / depthOfContainer * 100));

    if(jsonFromESP["procent"] != (int)(irRead() / depthOfContainer * 100)){

      jsonFromESP["procent"] = (int)(irRead() / depthOfContainer * 100);
      serializeJson(jsonFromESP, docFromESP);

      //write to file
      writeFile(SPIFFS, "/data.json", docFromESP.c_str());
    }

    
    serializeJson(jsonFromESP, docFromESP);

    //write to file
    writeFile(SPIFFS, "/data.json", docFromESP.c_str());

    struct tm timeinfo;
    if(!getLocalTime(&timeinfo)){
      Serial.println("Failed to obtain time");
    }

    int hours = timeinfo.tm_hour;
    int minutes = timeinfo.tm_min;

    long timestamp1 = mktime(&startTimeInfo);
    long timestamp2 = mktime(&timeinfo);

    long timeDiffInSeconds = timestamp2 - timestamp1;
    int daysDifference = timeDiffInSeconds / 86400;

    if((int)jsonFromESP["repeat"] > 0){

    if(daysDifference % (int)jsonFromESP["repeat"] == 0 && minutes == 0){
      bool feed = false;

    // Iterate over the "interval" array
    for (int i = 0; i < jsonFromESP["interval"].size(); ++i) {
      int interval = jsonFromESP["interval"][i];
      if (interval == hours) {
        feed = true;
        break; // Stop iterating if the value is found
      }
    }

      // Якщо "feed" true, годуємо рибок
      if (feed) {
        FeedNow(jsonFromESP["quantity"]);
      }
    }      
    }
  }


  
  delay(60 * 1000);
}


