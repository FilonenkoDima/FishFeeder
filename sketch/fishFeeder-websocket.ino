#if !defined(ESP32)
  #error This code is intended to run only on the ESP32 boards! Please check your Tools->Board setting.
#endif

#define _WEBSOCKETS_LOGLEVEL_     2

#include <WiFi.h>
#include <WiFiMulti.h>
#include <WiFiClientSecure.h>

#include <WebSocketsClient_Generic.h>

WiFiMulti         WiFiMulti;
WebSocketsClient  webSocket;
const char* deviceId = "deviceId:esp32-1"; // Set your device ID here

#define USE_SSL         true

#if USE_SSL
  #define WS_SERVER           "fishfeeder-69of.onrender.com"
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

void setup()
{
  Serial.begin(115200);
  while (!Serial);

  delay(200);

  Serial.print("\nStarting ESP32_WebSocketClient on ");
  Serial.println(ARDUINO_BOARD);
  Serial.println(WEBSOCKETS_GENERIC_VERSION);

  Serial.setDebugOutput(true);

  WiFiMulti.addAP("sofiia5g", "sofiia123");

  while (WiFiMulti.run() != WL_CONNECTED)
  {
    Serial.print(".");
    delay(100);
  }

  Serial.println();

  Serial.print("WebSockets Client started @ IP address: ");
  Serial.println(WiFi.localIP());

  Serial.print("Connecting to WebSockets Server @ ");
  Serial.println(WS_SERVER);

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

void sendMessageToServer() {
  if (webSocket.isConnected()) {
    String message = String(currentValue);
    webSocket.sendTXT(message);
    Serial.println(message);

    // Increment the value or reset if over 100
    currentValue += 5;
    if (currentValue > 100) {
      currentValue = 5;
    }
  } else {
    Serial.println("WebSocket is not connected.");
  }
}

void loop()
{
  webSocket.loop();
  unsigned long currentTime = millis();
  if (currentTime - lastTime >= interval) {
    lastTime = currentTime;
    sendMessageToServer();
  }
}
