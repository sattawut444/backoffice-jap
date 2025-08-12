# ระบบ Hotel ID

## การทำงานของระบบ

### 1. การเก็บ Hotel ID จากการ Login
- เมื่อ login สำเร็จ ระบบจะเก็บข้อมูล user พร้อม hotel_id และ hotel_name
- ข้อมูลจะถูกเก็บไว้ใน cookie พร้อมกับ JWT token
- ข้อมูล user จะมีโครงสร้างดังนี้:
```javascript
{
  email: "admin@hotelpro.com",
  name: "Admin User",
  role: "admin",
  hotel_id: 1,
  hotel_name: "Hotel Regina Kawaguchiko"
}
```

### 2. การใช้ Hotel ID ในหน้า Dashboard
- หน้า dashboard จะตรวจสอบ hotel_id จากข้อมูล user
- หากไม่มี hotel_id จะแสดงข้อความแจ้งเตือนและปุ่มไปหน้า login
- API call จะใช้ hotel_id ในการเรียกข้อมูล:
```javascript
fetch(`http://localhost:3003/api/hotels/backoffice/room/${user.hotel_id}`)
```

### 3. การแสดงชื่อโรงแรม
- ชื่อโรงแรมจะแสดงใน header ของหน้า dashboard
- ใช้ข้อมูลจาก `user.hotel_name`
- หากไม่มีข้อมูลจะแสดง "Hotel Management"

## โครงสร้างไฟล์ที่แก้ไข

### `src/app/page.js` (Dashboard)
- เพิ่ม import `useAuth` จาก AuthProvider
- ใช้ `user` state เพื่อเข้าถึงข้อมูล user
- ตรวจสอบ hotel_id ก่อนเรียก API
- แสดงชื่อโรงแรมใน header
- เพิ่ม error handling สำหรับกรณีไม่มี hotel_id

### `src/app/login/page.js`
- เพิ่ม hotel_id และ hotel_name ใน demo user data
- รองรับการเก็บข้อมูลจาก API response จริง

## การทำงานของ API

### API Endpoint
```
GET http://localhost:3003/api/hotels/backoffice/room/:hotel_id
```

### Request Headers
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer ' + token // หากต้องการ
}
```

### Response Format
```javascript
{
  "success": true,
  "data": [
    {
      "id": 1,
      "room_code": "001",
      "room_name": "Standard Room",
      "room_type": "Standard",
      "facilities": "WiFi, TV, AC",
      "detail": "Comfortable room with city view",
      "price": "100",
      "number_beds": 2,
      "number_guests": 2,
      "all_room": 10,
      "remaining_rooms": 5,
      "status": 1
    }
  ]
}
```

## การจัดการ Error

### กรณีไม่มี Hotel ID
- แสดงข้อความ "Hotel ID not found. Please login again."
- มีปุ่ม "Go to Login" เพื่อกลับไปหน้า login

### กรณี API Error
- แสดงข้อความ "Failed to load data. Please try again later."
- มีปุ่ม "Try Again" เพื่อลองเรียก API อีกครั้ง
- ใช้ mock data เป็น fallback

## Demo Data

### Login Credentials
- **Email**: admin@hotelpro.com
- **Password**: 123456

### Demo User Data
```javascript
{
  email: "admin@hotelpro.com",
  name: "Admin User",
  role: "admin",
  hotel_id: 1,
  hotel_name: "Hotel Regina Kawaguchiko"
}
```

## หมายเหตุ
- ระบบจะตรวจสอบ hotel_id ทุกครั้งที่โหลดหน้า dashboard
- หากไม่มี hotel_id จะ redirect ไปหน้า login
- ชื่อโรงแรมจะแสดงใน header ตามข้อมูลที่ login
- API endpoint จะใช้ hotel_id ในการดึงข้อมูลเฉพาะโรงแรมนั้นๆ 