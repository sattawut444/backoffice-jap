# การส่งข้อมูลจาก Login ไปยัง Dashboard

## การทำงานของระบบ

### 1. การ Login และเก็บข้อมูล
เมื่อผู้ใช้ login ระบบจะ:

1. **ส่งข้อมูลไปยัง API:**
```javascript
POST http://localhost:3003/api/hotels/backoffice/login
{
  "email": "admin@hotelpro.com",
  "password": "123456"
}
```

2. **รับข้อมูลกลับจาก API:**
```javascript
// กรณีที่ API ส่งข้อมูลครบ
{
  "token": "jwt-token-here",
  "user": {
    "email": "admin@hotelpro.com",
    "name": "Admin User",
    "role": "admin",
    "hotel_id": 1,
    "hotel_name": "Hotel Regina Kawaguchiko"
  }
}

// หรือกรณีที่ API ส่งข้อมูลแยก
{
  "token": "jwt-token-here",
  "hotel_id": 1,
  "hotel_name": "Hotel Regina Kawaguchiko",
  "name": "Admin User",
  "role": "admin"
}
```

3. **เก็บข้อมูลใน Cookie:**
```javascript
// เก็บข้อมูล user พร้อม hotel_id และ hotel_name
setCookie('authToken', token, 7);
setCookie('user', encodeURIComponent(JSON.stringify(userData)), 7);
```

### 2. การใช้ข้อมูลในหน้า Dashboard
หน้า dashboard จะ:

1. **อ่านข้อมูลจาก Cookie:**
```javascript
const { user } = useAuth();
// user จะมี hotel_id และ hotel_name
```

2. **ตรวจสอบ hotel_id:**
```javascript
if (!user || !user.hotel_id) {
  // แสดงข้อความแจ้งเตือน
  return <ErrorComponent />;
}
```

3. **เรียก API ด้วย hotel_id:**
```javascript
const response = await fetch(`http://localhost:3003/api/hotels/backoffice/room/${user.hotel_id}`);
```

4. **แสดงข้อมูลในหน้า:**
```javascript
// แสดง Hotel ID ใน header
<span className="font-medium">Hotel ID:</span> {user?.hotel_id || 'N/A'}

// แสดงชื่อโรงแรม
<span>{user?.hotel_name || 'Hotel Management'}</span>
```

## โครงสร้างข้อมูล

### ข้อมูลที่เก็บใน Cookie
```javascript
{
  email: "admin@hotelpro.com",
  name: "Admin User",
  role: "admin",
  hotel_id: 1,           // ← ใช้ใน API call
  hotel_name: "Hotel Regina Kawaguchiko"  // ← แสดงในหน้า
}
```

### API Endpoints ที่ใช้
```javascript
// Login
POST http://localhost:3003/api/hotels/backoffice/login

// Get Rooms (ใช้ hotel_id)
GET http://localhost:3003/api/hotels/backoffice/room/:hotel_id
```

## การจัดการ Error

### กรณีที่ API Login ไม่ทำงาน
```javascript
// ใช้ demo data
const demoUser = {
  email: formData.email,
  name: 'Admin User',
  role: 'admin',
  hotel_id: 1, // demo hotel_id
  hotel_name: 'Hotel Regina Kawaguchiko' // demo hotel_name
};
```

### กรณีที่ไม่มี hotel_id
```javascript
// แสดงข้อความแจ้งเตือน
"Hotel ID not found. Please login again."
```

## การ Debug

### Console Logs
```javascript
// ในหน้า login
console.log('Login response:', result);

// ในหน้า dashboard
console.log('Using hotel_id:', user.hotel_id);
console.log('User data:', user);
console.log('API Response:', result);
```

## การทดสอบ

### 1. Login ด้วยข้อมูล Demo
- **Email:** admin@hotelpro.com
- **Password:** 123456

### 2. ตรวจสอบข้อมูลใน Browser
1. เปิด Developer Tools (F12)
2. ไปที่ Application > Cookies
3. ดูข้อมูล `user` cookie

### 3. ตรวจสอบ API Call
1. เปิด Network tab ใน Developer Tools
2. Login แล้วดู API call ไปยัง `/room/:hotel_id`

## หมายเหตุสำคัญ

1. **hotel_id ต้องมาจาก API response** - ไม่ควรกำหนดเองในโค้ด
2. **ข้อมูลจะถูกเก็บใน cookie** - ปลอดภัยกว่า localStorage
3. **มีการตรวจสอบ hotel_id** - ป้องกันการเรียก API โดยไม่มี hotel_id
4. **รองรับ demo mode** - ทำงานได้แม้ API ไม่พร้อม

## การแก้ไขปัญหา

### หาก hotel_id ไม่ถูกส่งมา
1. ตรวจสอบ API response ใน console
2. แก้ไข backend ให้ส่ง hotel_id กลับมา
3. หรือแก้ไข frontend ให้รองรับรูปแบบข้อมูลที่ API ส่งมา

### หาก API ไม่ทำงาน
1. ระบบจะใช้ demo data
2. hotel_id จะเป็น 1
3. hotel_name จะเป็น "Hotel Regina Kawaguchiko" 