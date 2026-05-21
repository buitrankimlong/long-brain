---
tags: [project, he-thong-thuy-canh-iot]
status: dang-lam
started: 2026-05-20
stack: [Arduino, ESP32, WiFi, OneWire, DallasTemperature, WebServer, Telegram Bot API]
github: https://github.com/buitrankimlong/Projects/tree/main/05-web-apps/he-thong-thuy-canh
updated: 2026-05-20
---

# He-Thong-Thuy-Canh-IoT

## Mo ta
Hệ thống nuôi trồng thủy canh IoT: ESP32 đọc cảm biến (nhiệt độ, TDS, mực nước), điều khiển 3 bơm (chính + dosing A/B), web UI test, alert Telegram.

## Stack
- Arduino
- ESP32
- WiFi
- OneWire
- DallasTemperature
- WebServer
- Telegram Bot API

## Quyet dinh quan trong
1) ESP32 WebServer cho test UI (bấm nút test từng linh kiện). 2) Telegram alerts cho monitoring từ xa. 3) 3 relay outputs: K1 bơm chính, K2 dosing A, K3 dosing B. 4) DS18B20 cho nhiệt độ nước, TDS sensor cho dinh dưỡng, Float sensor cho mực nước.

## Bai hoc rut ra
ESP32 cần WiFiClientSecure.setInsecure() cho HTTPS Telegram API. Relay logic ngược: LOW = ON, HIGH = OFF. DallasTemperature cần requestTemperatures() trước getTempCByIndex().

## Source Code

hydroponic_tower.ino:
```cpp
#include &lt;WiFi.h&gt;
#include &lt;WebServer.h&gt;
#include &lt;HTTPClient.h&gt;
#include &lt;OneWire.h&gt;
#include &lt;DallasTemperature.h&gt;

#define PUMP_MAIN_PIN 26
#define DOSING_A_PIN  27
#define DOSING_B_PIN  14
#define DS18B20_PIN   4
#define TDS_PIN       34
#define FLOAT_PIN     35
#define RELAY_ON LOW
#define RELAY_OFF HIGH

WebServer server(80);
OneWire oneWire(DS18B20_PIN);
DallasTemperature tempSensor(&amp;oneWire);

bool tgSend(const String&amp; text) {
  WiFiClientSecure client; client.setInsecure();
  HTTPClient http;
  http.begin(client, String("https://api.telegram.org/bot") + TG_TOKEN + "/sendMessage");
  http.addHeader("Content-Type", "application/json");
  String body = "{\"chat_id\":\"" + String(TG_CHAT_ID) + "\",\"text\":\"" + text + "\"}";
  return (http.POST(body) == 200);
}

void handleTestTemp() {
  tempSensor.requestTemperatures();
  float t = tempSensor.getTempCByIndex(0);
  // ... display on web + send Telegram
}
```

## GitHub
https://github.com/buitrankimlong/Projects/tree/main/05-web-apps/he-thong-thuy-canh

## Lien ket
-> [[30 Du An]] | [[32 Bai Hoc Duc Ket]]
