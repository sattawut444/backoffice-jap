# Scan QR Code with API Integration

## ภาพรวม
หน้า Scan QR Code ได้รับการอัปเดตให้สามารถส่งข้อมูลการสแกนไปยัง API endpoint โดยอัตโนมัติ เมื่อสแกน QR Code สำเร็จ

## คุณสมบัติใหม่

### 1. การส่งข้อมูลไปยัง API อัตโนมัติ
- เมื่อสแกน QR Code สำเร็จ ระบบจะวิเคราะห์ข้อมูลและส่งไปยัง API โดยอัตโนมัติ
- API Endpoint: `http://localhost:3003/api/attraction/backoffice/scandatastatus`
- Method: `POST`
- Content-Type: `application/json`

### 2. โครงสร้างข้อมูลที่ส่ง
```json
{
  "attraction_list_id": 2,
  "order_traveler_id": 5014,
  "users_applications_id": 123
}
```

### 3. การวิเคราะห์ข้อมูล QR Code
ระบบจะพยายามดึงข้อมูล `attraction_list_id` และ `order_traveler_id` จาก QR Code ในรูปแบบต่างๆ:

#### รูปแบบที่ 1: JSON
```json
{
  "attraction_list_id": 2,
  "order_traveler_id": 5014
}
```

#### รูปแบบที่ 2: Pattern Matching
```
attraction_list_id: 2
order_traveler_id: 5014
```

#### รูปแบบที่ 3: ข้อความธรรมดา
```
attraction_list_id 2 order_traveler_id 5014
```

## การทำงาน

### 1. ขั้นตอนการสแกน
1. ผู้ใช้เปิดกล้องและเริ่มสแกน
2. ระบบตรวจจับ QR Code
3. วิเคราะห์ข้อมูลที่ได้จาก QR Code
4. ดึง `attraction_list_id` และ `order_traveler_id`
5. เพิ่ม `users_applications_id` จากข้อมูลผู้ใช้
6. ส่งข้อมูลไปยัง API โดยอัตโนมัติ
7. แสดงผลลัพธ์การส่งข้อมูล

### 2. การจัดการ Response
- **สำเร็จ (200)**: แสดงข้อความ "✅ ส่งข้อมูลไปยัง API สำเร็จ"
- **ไม่สำเร็จ (4xx/5xx)**: แสดงข้อความ error พร้อม status code
- **Network Error**: แสดงข้อความ error พร้อมรายละเอียด

### 3. การแจ้งเตือน
- แจ้งเตือนในเบราว์เซอร์ (Browser Notification)
- แสดงข้อความในหน้าเว็บ
- แสดง alert พร้อมรายละเอียด

## การแสดงผล

### 1. ส่วน Header
- แสดงสถานะการส่งข้อมูลไปยัง API
- สีเขียว: สำเร็จ ✅
- สีแดง: ไม่สำเร็จ ❌
- สีน้ำเงิน: กำลังดำเนินการ

### 2. ส่วน Scan Results
- แสดงข้อมูลที่สแกนได้
- แสดง `attraction_list_id` และ `order_traveler_id` (ถ้ามี)
- แสดง `users_applications_id` จากข้อมูลผู้ใช้
- แสดงสถานะการส่งข้อมูลไปยัง API

### 3. ปุ่มเพิ่มเติม
- **Copy**: คัดลอกข้อมูลไปยังคลิปบอร์ด
- **Download**: ดาวน์โหลดข้อมูล
- **Resend to API**: ส่งข้อมูลไปยัง API อีกครั้ง

## การทดสอบ

### 1. ทดสอบการสแกน QR Code
1. สร้าง QR Code ที่มีข้อมูล `attraction_list_id` และ `order_traveler_id`
2. สแกน QR Code ด้วยหน้าเว็บ
3. ตรวจสอบว่าข้อมูลถูกส่งไปยัง API หรือไม่
4. ตรวจสอบว่า `users_applications_id` ถูกส่งไปด้วยหรือไม่

### 2. ทดสอบ API Response
1. ตรวจสอบ Network tab ใน Developer Tools
2. ดู request ที่ส่งไปยัง API
3. ตรวจสอบ response ที่ได้รับกลับมา

### 3. ทดสอบ Error Handling
1. ปิด API server
2. สแกน QR Code
3. ตรวจสอบการแสดง error message

## ตัวอย่าง QR Code

### ตัวอย่างที่ 1: JSON Format
```json
{
  "attraction_list_id": 2,
  "order_traveler_id": 5014
}
```

### ตัวอย่างที่ 2: Text Format
```
attraction_list_id: 2
order_traveler_id: 5014
```

### ตัวอย่างที่ 3: Simple Text
```
attraction_list_id 2 order_traveler_id 5014
```

## การแก้ไขปัญหา

### 1. API ไม่ตอบสนอง
- ตรวจสอบว่า API server เปิดอยู่หรือไม่
- ตรวจสอบ URL และ port ที่ถูกต้อง
- ตรวจสอบ CORS settings

### 2. ข้อมูลไม่ถูกส่ง
- ตรวจสอบว่า QR Code มีข้อมูลที่ถูกต้องหรือไม่
- ตรวจสอบ console log สำหรับ error messages
- ตรวจสอบ Network tab ใน Developer Tools

### 3. การแสดงผลผิดปกติ
- ตรวจสอบ browser compatibility
- ตรวจสอบ JavaScript errors ใน console
- ลอง refresh หน้าเว็บ

## การปรับแต่ง

### 1. เปลี่ยน API Endpoint
แก้ไขในฟังก์ชัน `sendScanDataToAPI`:

```javascript
const response = await fetch('YOUR_NEW_API_ENDPOINT', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    attraction_list_id: attractionListId,
    order_traveler_id: orderTravelerId
  })
});
```

### 2. เพิ่มฟิลด์ข้อมูล
แก้ไขในฟังก์ชัน `sendScanDataToAPI`:

```javascript
body: JSON.stringify({
  attraction_list_id: attractionListId,
  order_traveler_id: orderTravelerId,
  additional_field: 'additional_value'
})
```

### 3. เปลี่ยนการแสดงผล
แก้ไขในส่วน JSX ที่แสดงผลข้อมูล

## หมายเหตุ

- ระบบจะส่งข้อมูลไปยัง API โดยอัตโนมัติเมื่อสแกนสำเร็จ
- หากไม่มีข้อมูล `attraction_list_id` หรือ `order_traveler_id` ระบบจะไม่ส่งข้อมูลไปยัง API
- `users_applications_id` จะถูกดึงจากข้อมูลผู้ใช้ที่ login อยู่ในระบบ
- ผู้ใช้สามารถส่งข้อมูลซ้ำได้โดยคลิกปุ่ม "Resend to API"
- ระบบรองรับการแสดงผลแบบ responsive สำหรับอุปกรณ์ทุกขนาด
- มีการจัดการ error และ timeout เพื่อความเสถียรของระบบ
