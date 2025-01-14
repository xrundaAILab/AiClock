#include <Servo.h>

Servo servoX;  // 水平方向舵机
Servo servoY;  // 垂直方向舵机

void setup() {
  servoX.attach(9);  // 连接到9号引脚
  servoY.attach(10); // 连接到10号引脚
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    // 读取串口数据并更新舵机位置
    String data = Serial.readStringUntil('\n');
    int comma = data.indexOf(',');
    int x = data.substring(0, comma).toInt();
    int y = data.substring(comma + 1).toInt();
    
    servoX.write(x);
    servoY.write(y);
  }
} 