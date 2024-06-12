#if !defined(ESP32)
  #error This code is intended to run only on the ESP32 boards! Please check your Tools->Board setting.
#endif

#define _WEBSOCKETS_LOGLEVEL_     2

#include <WiFi.h>
#include <WiFiMulti.h>
#include <WiFiClientSecure.h>
#include <WebSocketsClient_Generic.h>
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
const float depthOfContainer = 7.5;

const int IRpin = 34;          // аналоговый пин для подключения выхода Vo сенсора
int value1;                    // для хранения аналогового значения  

HTTPClient http;
Servo myServo;

const char* ntpServer = "pool.ntp.org";
const long  gmtOffset_sec = 2 * 60 * 60;
const int   daylightOffset_sec = 3600;

struct tm startTimeInfo;

WiFiMulti         WiFiMulti;
WebSocketsClient  webSocket;
const char* deviceId = "deviceId:esp32-1"; // Set your device ID here

#define USE_SSL         true

#if USE_SSL
  #define WS_SERVER           "fishfeeder-824j.onrender.com"
  #define WS_PORT             443
#else
  #define WS_SERVER           "192.168.2.86"
  #define WS_PORT             8080
#endif

void hexdump(const void *mem, const uint32_t& len, const uint8_t& cols = 16)
{
  const uint8_t* src = (const uint8_t*) mem;

  Serial.printf("\n[HEXDUMP] Address: 0x%08X len: 0x%X (%d)", (ptrdiff_t)src, len, len);

  for (uint32_t i = 0; i < len; i++)
  {
    if (i % cols == 0)
    {
      Serial.printf("\n[0x%08X] 0x%08X: ", (ptrdiff_t)src, i);
    }

    Serial.printf("%02X ", *src);
    src++;
  }

  Serial.printf("\n");
}

bool alreadyConnected = false;
unsigned long lastTime = 0;
const long interval = 1000;  // Interval at which to send message (milliseconds)
int currentValue = 5;  // Initial value to send

void webSocketEvent(const WStype_t& type, uint8_t * payload, const size_t& length)
{
  switch (type)
  {
    case WStype_DISCONNECTED:
      if (alreadyConnected)
      {
        Serial.println("[WSc] Disconnected!");
        alreadyConnected = false;
      }
      break;

    case WStype_CONNECTED:
    {
      alreadyConnected = true;

      Serial.print("[WSc] Connected to url: ");
      Serial.println((char *) payload);

      // send message to server when Connected
      webSocket.sendTXT(deviceId);
    }
    break;

    case WStype_TEXT:
      Serial.printf("[WSc] get text: %s\n", payload);
      char part1[20]; 
      char part2[20];
      splitString((char*)payload, '-', part1, part2);
        // Печать значений part1 и part2 для отладки
  Serial.print("part1: ");
  Serial.println(part1);
  Serial.print("part2: ");
  Serial.println(part2);
      if(strcmp(part1, "web: feedNow") == 0){
        Serial.print("feeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeed - - - ");
        FeedNow(atoi(part2));
      }
      break;

    case WStype_BIN:
      Serial.printf("[WSc] get binary length: %u\n", length);
      hexdump(payload, length);
      break;

    case WStype_PING:
      Serial.printf("[WSc] get ping\n");
      break;

    case WStype_PONG:
      Serial.printf("[WSc] get pong\n");
      break;

    case WStype_ERROR:
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_FIN:
      break;

    default:
      break;
  }
}

float irRead() {
  int averaging = 0;             
 
  for (int i=0; i<5; i++) {
    value1 = analogRead(IRpin);
    averaging = averaging + value1;
    delay(55);      
  }
  value1 = averaging / 5;      

   float volts = value1 * 0.0048828125;

 float distance=32*pow(volts,-1.10);

 distance = distance > depthOfContainer ? depthOfContainer : distance;

  return distance;              
} 

int FeedNow(int portionSize){
  
        // servo
        myServo.attach(15);
        myServo.write(0); 
        int portion = portionSize * 600;
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


bool sendMessageToServer() {
  if (webSocket.isConnected()) {
    String message = String(100 - (int)(irRead() / depthOfContainer * 100));
    webSocket.sendTXT(message);
    Serial.println(message);
    return true;
  } else {
    Serial.println("WebSocket is not connected.");
    return false;

  }
}

void splitString(const char* str, char delimiter, char* part1, char* part2) {
    char temp[strlen(str) + 1];
    strcpy(temp, str);
    
    char delim[2] = {delimiter, '\0'};
    char* token = strtok(temp, delim);
    if (token != nullptr) {
        strcpy(part1, token);
        token = strtok(nullptr, delim);
        if (token != nullptr) {
            strcpy(part2, token);
        } else {
            part2[0] = '\0'; // Если второй токен не найден, сделать part2 пустой строкой
        }
    } else {
        part1[0] = '\0'; // Если первый токен не найден, сделать part1 пустой строкой
        part2[0] = '\0'; // И part2 тоже
    }
}

void setup() {
  Serial.begin(115200);

  WiFiMulti.addAP(ssid, password);
  while (WiFiMulti.run() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("WiFi connected");

  //init and get the time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
  getLocalTime(&startTimeInfo);

  
#if USE_SSL
  webSocket.beginSSL(WS_SERVER, WS_PORT);
#else
  webSocket.begin(WS_SERVER, WS_PORT, "/");
#endif

  webSocket.onEvent(webSocketEvent);

  webSocket.setReconnectInterval(5000);

  webSocket.enableHeartbeat(15000, 3000, 2);

  Serial.print("Connected to WebSockets Server @ IP address: ");
  Serial.println(WS_SERVER);

}

void loop() {




  if (WiFiMulti.run() == WL_CONNECTED) {

          do{
webSocket.loop();
  }
  while(!sendMessageToServer());
      

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

          //write to file
          writeFile(SPIFFS, "/data.json", docFromServer.c_str());
        }

      } else {
      Serial.println("Error: Connection failed");
      }

    }
    http.end();

  if(SPIFFS.exists("/data.json")){
    String docFromESP = readFile(SPIFFS, "/data.json");
    JsonDocument jsonFromESP;
    deserializeJson(jsonFromESP, docFromESP);


    struct tm timeinfo;
    if(!getLocalTime(&timeinfo)){
      Serial.println("Failed to obtain time");
    }

    int hours = timeinfo.tm_hour;
    int minutes = timeinfo.tm_min;
    int seconds = timeinfo.tm_sec;

    long timestamp1 = mktime(&startTimeInfo);
    long timestamp2 = mktime(&timeinfo);

    long timeDiffInSeconds = timestamp2 - timestamp1;
    int daysDifference = timeDiffInSeconds / 86400;

    if((int)jsonFromESP["repeat"] > 0){

    if(daysDifference % (int)jsonFromESP["repeat"] == 0 && minutes == 0 && seconds == 0 && seconds == 1 && seconds == 2){
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


  
  delay(1000);
}

