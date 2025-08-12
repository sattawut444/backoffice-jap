# ระบบ Authentication

## การทำงานของระบบ

### 1. การ Login
- เมื่อผู้ใช้กรอกข้อมูลและกดปุ่ม "เข้าสู่ระบบ"
- ระบบจะส่งข้อมูลไปยัง API endpoint: `http://localhost:3003/api/hotels/backoffice/login`
- หาก login สำเร็จ ระบบจะได้รับ JWT token และข้อมูล user กลับมา
- ระบบจะเก็บ JWT token และข้อมูล user ไว้ใน cookie

### 2. การเก็บข้อมูลใน Cookie
- **authToken**: เก็บ JWT token (หมดอายุใน 7 วัน)
- **user**: เก็บข้อมูล user ในรูปแบบ JSON (หมดอายุใน 7 วัน)
- ใช้ `SameSite=Strict` เพื่อความปลอดภัย

### 3. การตรวจสอบ Authentication
- ระบบจะตรวจสอบ cookie ทุกครั้งที่โหลดหน้า
- หากมี token และข้อมูล user ที่ถูกต้อง จะถือว่า login แล้ว
- หากไม่มี token หรือข้อมูลไม่ถูกต้อง จะ redirect ไปหน้า login

### 4. การ Logout
- ลบ cookie ทั้งหมดที่เกี่ยวข้องกับ authentication
- redirect ไปหน้า login

## โครงสร้างไฟล์

### `src/app/components/AuthProvider.js`
- จัดการ state ของ authentication
- ตรวจสอบ cookie เมื่อโหลดหน้า
- จัดการ redirect ตามสถานะ authentication

### `src/app/utils/cookies.js`
- ฟังก์ชันสำหรับจัดการ cookie
- `setCookie()`: ตั้งค่า cookie
- `getCookie()`: อ่านค่า cookie
- `removeCookie()`: ลบ cookie
- `hasCookie()`: ตรวจสอบว่ามี cookie หรือไม่

### `src/app/login/page.js`
- หน้า login form
- ส่งข้อมูลไปยัง API
- เรียกใช้ `login()` function จาก AuthProvider

## การใช้งาน

### การ Login
```javascript
const { login } = useAuth();
const success = login(email, password, token, userData);
```

### การตรวจสอบสถานะ
```javascript
const { isAuthenticated, user } = useAuth();
```

### การ Logout
```javascript
const { logout } = useAuth();
logout();
```

## ข้อมูล Demo
- **Email**: admin@hotelpro.com
- **Password**: 123456

## หมายเหตุ
- หาก API ไม่ทำงาน ระบบจะใช้ demo token และข้อมูล user
- Cookie จะหมดอายุใน 7 วัน
- ใช้ `SameSite=Strict` เพื่อป้องกัน CSRF attack 