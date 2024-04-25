#include <ESP32Servo.h> // Подключаем библиотеку

Servo servo; // Объявляем объект servo

// void setup() {
//   // put your setup code here, to run once:
//   servo.attach(15); // Прикрепляем сервопривод к пину 15
// }

// void loop() {
//   // put your main code here, to run repeatedly:

//   servo.write(360); 
// }

const int IRpin = 15;          // аналоговый пин для подключения выхода Vo сенсора
int value1;                    // для хранения аналогового значения
 
void setup() {
  Serial.begin(9600);  
  servo.attach(2);          // Запуск последовательного порта
  }
 
void loop() {
  Serial.println(irRead(), DEC);
 // получаем сглаженное значение  и переводим в напряжение
 float volts = analogRead(IRpin)*0.0048828125;
 // и в расстояние в см 
 float distance=32*pow(volts,-1.10);
 Serial.print(distance); 
 if(distance > 10.1)    {
  servo.write(90);
 }   else {
    servo.write(0); // Повернути сервопривод у вихідне положення
  }
 delay(500);                    
}
 
// Усреднение нескольких значений для сглаживания
int irRead() {
  int averaging = 0;             //  переменная для суммирования данных
 
  // Получение 5 значений
  for (int i=0; i<5; i++) {
    value1 = analogRead(IRpin);
    averaging = averaging + value1;
    delay(55);      // Ожидание 55 ms перед каждым чтением
  }
  value1 = averaging / 5;      // усреднить значения
  return(value1);              
} 