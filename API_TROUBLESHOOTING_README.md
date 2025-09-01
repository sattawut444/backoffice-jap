# API Troubleshooting Guide

## ปัญหาที่พบบ่อย: ข้อมูลไม่เข้า API

### 1. ตรวจสอบ Console Log
เปิด Developer Tools (F12) และดู Console tab เพื่อตรวจสอบ:

#### ✅ Log ที่ควรเห็นเมื่อสแกนสำเร็จ:
```
🎉 SUCCESS: Found QR code!
✅ QR Data processed successfully: {...}
🚀 Sending data to API... {attractionListId: 2, orderTravelerId: 5014, users_applications_id: 123}
📡 Sending scan data to API... {attractionListId: 2, orderTravelerId: 5014, users_applications_id: 123}
📤 Request body: {attraction_list_id: 2, order_traveler_id: 5014, users_applications_id: 123}
🌐 API URL: http://localhost:3003/api/attraction/backoffice/scandatastatus
```

#### ❌ Log ที่แสดงปัญหา:
```
⚠️ Missing required data for API call: {attractionListId: null, orderTravelerId: null}
❌ Missing required data: {attractionListId: null, orderTravelerId: null}
⚠️ No users_applications_id found in user data
```

### 2. ตรวจสอบ Network Tab
ใน Developer Tools > Network tab:

1. สแกน QR Code
2. ดู request ที่ส่งไปยัง API
3. ตรวจสอบ:
   - Request URL: `http://localhost:3003/api/attraction/backoffice/scandatastatus`
   - Request Method: `POST`
   - Request Headers: `Content-Type: application/json`
   - Request Payload: ข้อมูลที่ส่ง

### 3. ใช้ปุ่ม Test API
คลิกปุ่ม "Test API" เพื่อทดสอบการเชื่อมต่อ:

- ส่งข้อมูลทดสอบไปยัง API
- ตรวจสอบ response
- แสดงข้อความ error หากมีปัญหา

### 4. ตรวจสอบข้อมูล QR Code

#### ✅ QR Code ที่ถูกต้อง:
```json
{
  "attraction_list_id": 2,
  "order_traveler_id": 5014
}
```

#### ❌ QR Code ที่มีปัญหา:
```
Hello World
https://example.com
```

### 5. ตรวจสอบข้อมูลผู้ใช้
ตรวจสอบว่า `user.users_applications_id` มีค่าหรือไม่:

```javascript
console.log('User data:', user);
console.log('Users applications ID:', user?.users_applications_id);
```

### 6. ตรวจสอบ API Server

#### ตรวจสอบว่า API server เปิดอยู่:
```bash
# ตรวจสอบ port 3003
netstat -an | grep 3003

# หรือใช้ curl ทดสอบ
curl -X POST http://localhost:3003/api/attraction/backoffice/scandatastatus \
  -H "Content-Type: application/json" \
  -d '{"attraction_list_id": 999, "order_traveler_id": 999, "users_applications_id": 999}'
```

#### ตรวจสอบ CORS settings:
หาก API server ไม่มี CORS settings ที่ถูกต้อง อาจเกิด error:
```
Access to fetch at 'http://localhost:3003/api/attraction/backoffice/scandatastatus' from origin 'http://localhost:3000' has been blocked by CORS policy
```

### 7. แก้ไขปัญหา CORS

#### ใน API server (Node.js/Express):
```javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

#### หรือใช้ proxy ใน Next.js:
```javascript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/attraction/:path*',
        destination: 'http://localhost:3003/api/attraction/:path*',
      },
    ];
  },
};
```

### 8. ตรวจสอบ API Endpoint

#### ตรวจสอบ URL ที่ถูกต้อง:
- ✅ `http://localhost:3003/api/attraction/backoffice/scandatastatus`
- ❌ `http://localhost:3003/api/attraction/scandatastatus`
- ❌ `http://localhost:3003/api/attraction/backoffice/scan-data-status`

#### ตรวจสอบ HTTP Method:
- ✅ `POST`
- ❌ `GET`, `PUT`, `DELETE`

### 9. ตรวจสอบ Request Body

#### ข้อมูลที่ถูกต้อง:
```json
{
  "attraction_list_id": 2,
  "order_traveler_id": 5014,
  "users_applications_id": 123
}
```

#### ข้อมูลที่ผิด:
```json
{
  "attractionListId": 2,
  "orderTravelerId": 5014,
  "usersApplicationsId": 123
}
```

### 10. การ Debug เพิ่มเติม

#### เพิ่ม logging ใน API server:
```javascript
app.post('/api/attraction/backoffice/scandatastatus', (req, res) => {
  console.log('Received request:', req.body);
  console.log('Headers:', req.headers);
  
  // Process request...
  
  res.json({ success: true, data: req.body });
});
```

#### ตรวจสอบ Environment Variables:
```javascript
console.log('API_BASE_URL:', process.env.API_BASE_URL);
console.log('NEXT_PUBLIC_API_BASE_URL:', process.env.NEXT_PUBLIC_API_BASE_URL);
```

### 11. ขั้นตอนการแก้ไขปัญหา

1. **เปิด Developer Tools** (F12)
2. **สแกน QR Code** ที่มีข้อมูลถูกต้อง
3. **ตรวจสอบ Console Log** ว่าข้อมูลถูก parse หรือไม่
4. **ตรวจสอบ Network Tab** ว่า request ถูกส่งหรือไม่
5. **ใช้ปุ่ม Test API** เพื่อทดสอบการเชื่อมต่อ
6. **ตรวจสอบ API Server** ว่าเปิดอยู่และทำงานปกติ
7. **ตรวจสอบ CORS settings** หากมีปัญหา
8. **ตรวจสอบ API Endpoint** และ HTTP Method

### 12. ตัวอย่าง QR Code สำหรับทดสอบ

#### QR Code ทดสอบ:
```json
{
  "attraction_list_id": 999,
  "order_traveler_id": 999
}
```

#### หรือใช้ข้อความธรรมดา:
```
attraction_list_id: 999
order_traveler_id: 999
```

### 13. การติดต่อ Support

หากยังแก้ไขปัญหาไม่ได้ กรุณาเตรียมข้อมูลต่อไปนี้:

1. Console Log ทั้งหมด
2. Network Tab screenshots
3. QR Code ที่ใช้ทดสอบ
4. Error messages ที่ได้รับ
5. Browser และ OS version
6. API server logs

## หมายเหตุ

- ระบบจะแสดงสถานะการส่งข้อมูลใน header
- ใช้ปุ่ม "Test API" เพื่อทดสอบการเชื่อมต่อ
- ตรวจสอบ Console Log เพื่อดูข้อมูล debug
- หากมีปัญหา CORS ให้ตรวจสอบ API server settings

