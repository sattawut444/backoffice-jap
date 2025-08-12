# การทำงานกับ API Login Response

## API Response Format

### ข้อมูลที่ API ส่งกลับมา
```json
{
    "status": true,
    "message": "Password is valid!",
    "hotel_id": 4,
    "tokenJWT": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InNhdHRhd3V0NDQ0QGdtYWlsLmNvbSIsInBhc3N3b3JkIjoiJDJ5JDEwJE14R3RicFg2ZFB3Sy9tN1R6eEY0L3V3aFpVRjlVcnhMNzI1VlRKWU9TUnM1T2lKdHhLdGdpIiwiaWF0IjoxNzUyNDY3ODkyLCJleHAiOjE3NTUwNTk4OTJ9.-poKZMJNQv2dxV8Jj3P0tr5zlUPCtOOJVLunFIODU1k"
}
```

### ข้อมูลที่ระบบสร้างขึ้น
```javascript
const userData = {
  email: formData.email,           // จาก form
  name: 'Admin User',              // กำหนดเอง
  role: 'admin',                   // กำหนดเอง
  hotel_id: result.hotel_id,       // จาก API (4)
  hotel_name: `Hotel ID: ${result.hotel_id}`  // สร้างจาก hotel_id
};
```

## การทำงานของระบบ

### 1. การตรวจสอบ API Response
```javascript
// ตรวจสอบว่ามี tokenJWT และ hotel_id หรือไม่
if (result.tokenJWT && result.hotel_id) {
  // สร้างข้อมูล user จาก API response
  const userData = {
    email: formData.email,
    name: 'Admin User',
    role: 'admin',
    hotel_id: result.hotel_id,        // ← ใช้ hotel_id จาก API
    hotel_name: `Hotel ID: ${result.hotel_id}`  // ← สร้างชื่อโรงแรม
  };
  
  // เก็บข้อมูลใน cookie
  const success = login(formData.email, formData.password, result.tokenJWT, userData);
}
```

### 2. การใช้ข้อมูลในหน้า Dashboard
```javascript
// อ่านข้อมูลจาก cookie
const { user } = useAuth();

// ใช้ hotel_id ในการเรียก API
const response = await fetch(`http://localhost:3003/api/hotels/backoffice/room/${user.hotel_id}`);
// จะเรียก: http://localhost:3003/api/hotels/backoffice/room/4
```

### 3. การแสดงผลในหน้า Dashboard
```javascript
// แสดง Hotel ID
<span className="font-medium">Hotel ID:</span> {user?.hotel_id || 'N/A'}
// จะแสดง: Hotel ID: 4

// แสดงชื่อโรงแรม
<span>{user?.hotel_name || 'Hotel Management'}</span>
// จะแสดง: Hotel ID: 4
```

## โครงสร้างข้อมูลที่เก็บใน Cookie

### ข้อมูลที่เก็บหลังจาก Login สำเร็จ
```javascript
{
  email: "sattawut444@gmail.com",
  name: "Admin User",
  role: "admin",
  hotel_id: 4,                    // ← จาก API response
  hotel_name: "Hotel ID: 4"       // ← สร้างจาก hotel_id
}
```

## การ Debug

### Console Logs
```javascript
// ในหน้า login
console.log('Login response:', result);
// จะแสดง:
// {
//   status: true,
//   message: "Password is valid!",
//   hotel_id: 4,
//   tokenJWT: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
// }

// ในหน้า dashboard
console.log('Using hotel_id:', user.hotel_id);
// จะแสดง: Using hotel_id: 4

console.log('User data:', user);
// จะแสดง:
// {
//   email: "sattawut444@gmail.com",
//   name: "Admin User",
//   role: "admin",
//   hotel_id: 4,
//   hotel_name: "Hotel ID: 4"
// }
```

## API Endpoints ที่ใช้

### 1. Login API
```javascript
POST http://localhost:3003/api/hotels/backoffice/login
{
  "email": "sattawut444@gmail.com",
  "password": "123456"
}
```

### 2. Get Rooms API (ใช้ hotel_id)
```javascript
GET http://localhost:3003/api/hotels/backoffice/room/4
// ใช้ hotel_id = 4 จาก login response
```

## การทดสอบ

### 1. Login ด้วยข้อมูลจริง
- **Email:** sattawut444@gmail.com
- **Password:** 123456

### 2. ตรวจสอบข้อมูลใน Browser
1. เปิด Developer Tools (F12)
2. ไปที่ Application > Cookies
3. ดูข้อมูล `user` cookie จะมี hotel_id: 4

### 3. ตรวจสอบ API Call
1. เปิด Network tab ใน Developer Tools
2. Login แล้วดู API call ไปยัง `/room/4`

## การปรับปรุงที่อาจต้องการ

### 1. เพิ่มชื่อโรงแรมจริง
หากต้องการชื่อโรงแรมจริง แทนที่จะเป็น "Hotel ID: 4":

```javascript
// ต้องแก้ไข API ให้ส่ง hotel_name กลับมา
{
  "status": true,
  "message": "Password is valid!",
  "hotel_id": 4,
  "hotel_name": "Hotel Regina Kawaguchiko",  // ← เพิ่มข้อมูลนี้
  "tokenJWT": "..."
}
```

### 2. เพิ่มข้อมูล user อื่นๆ
หากต้องการข้อมูล user เพิ่มเติม:

```javascript
// ต้องแก้ไข API ให้ส่งข้อมูล user กลับมา
{
  "status": true,
  "message": "Password is valid!",
  "hotel_id": 4,
  "hotel_name": "Hotel Regina Kawaguchiko",
  "user_name": "Admin User",
  "user_role": "admin",
  "tokenJWT": "..."
}
```

## หมายเหตุสำคัญ

1. **hotel_id = 4** จะถูกใช้ในการเรียก API `/room/4`
2. **tokenJWT** จะถูกเก็บไว้ใน cookie สำหรับการ authentication
3. **ข้อมูล user** จะถูกสร้างขึ้นจาก API response
4. **ชื่อโรงแรม** จะเป็น "Hotel ID: 4" จนกว่าจะมีข้อมูลจริงจาก API 