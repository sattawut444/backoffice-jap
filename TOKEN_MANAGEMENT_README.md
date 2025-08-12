# ระบบตรวจสอบ Token ในคุกกี้

## ฟีเจอร์หลัก

### 🔍 **การตรวจสอบ Token**
- ตรวจสอบ token ในคุกกี้ทุกครั้งที่เข้าเว็บ
- ถ้าไม่มี token ให้ redirect ไปหน้า Login
- แสดง loading screen ขณะตรวจสอบ

### 💾 **การเก็บข้อมูล**
- เก็บ token และข้อมูล user ในคุกกี้ 1 วัน
- ไม่ลบข้อมูลอัตโนมัติเมื่อออกจากเว็บ
- ข้อมูลจะเก็บไว้จนกว่าจะ logout หรือหมดอายุ

## การทำงานของระบบ

### 📥 **เมื่อเข้าเว็บ**
1. ตรวจสอบ token ในคุกกี้
2. ถ้ามี token และข้อมูล user:
   - Set authentication state เป็น true
   - ดึงข้อมูล profile จาก API
   - แสดงหน้า dashboard
3. ถ้าไม่มี token:
   - Set authentication state เป็น false
   - Redirect ไปหน้า Login

### 🔐 **การ Login**
1. เก็บ token และข้อมูล user ในคุกกี้ (1 วัน)
2. Set authentication state
3. ดึงข้อมูล profile จาก API
4. Redirect ไปหน้า dashboard

### 🚪 **การ Logout**
1. ลบข้อมูลจากคุกกี้
2. Set authentication state เป็น false
3. Redirect ไปหน้า Login

## ฟังก์ชันหลัก

### checkTokenInCookies()
```javascript
const checkTokenInCookies = () => {
  const token = getCookie('authToken');
  const userData = getCookie('user');
  
  if (token && userData) {
    // ตรวจสอบและ set authentication state
    return true;
  } else {
    // ไม่มี token หรือข้อมูลไม่ถูกต้อง
    return false;
  }
};
```

### การตรวจสอบ
- ตรวจสอบ `authToken` ในคุกกี้
- ตรวจสอบ `user` ในคุกกี้
- Parse ข้อมูล user และตรวจสอบความถูกต้อง
- Set authentication state ตามผลลัพธ์

## การตั้งค่า Cookies

### ระยะเวลาการเก็บข้อมูล
- **Token**: 1 วัน
- **User Data**: 1 วัน

### ข้อมูลที่เก็บ
- `authToken`: Token สำหรับ authentication
- `user`: ข้อมูลผู้ใช้ (encoded JSON)

## ผลลัพธ์

### ✅ **ความปลอดภัย**
- ตรวจสอบ token ทุกครั้งที่เข้าเว็บ
- Redirect ไปหน้า Login เมื่อไม่มี token
- ข้อมูลเก็บในคุกกี้ที่ปลอดภัย

### ✅ **ประสบการณ์ผู้ใช้**
- ตรวจสอบ token อัตโนมัติ
- Loading screen ขณะตรวจสอบ
- ไม่ต้อง login ใหม่ทุกครั้ง

### ✅ **การทำงาน**
- ระบบทำงานอัตโนมัติ
- ข้อมูลเก็บไว้ 1 วัน
- เหมาะสำหรับการใช้งานปกติ

## หมายเหตุ

- ระบบจะตรวจสอบ token ในคุกกี้เท่านั้น
- ไม่ลบข้อมูลอัตโนมัติเมื่อออกจากเว็บ
- ข้อมูลจะเก็บไว้จนกว่าจะ logout หรือหมดอายุ (1 วัน)
- เหมาะสำหรับการใช้งานที่ต้องการให้ login ค้างไว้ 