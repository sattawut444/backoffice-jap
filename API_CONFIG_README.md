# API Configuration และ Environment Variables

## การตั้งค่า Environment Variables

### 1. สร้างไฟล์ `.env.local` ในโฟลเดอร์ root
```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:3003
NEXT_PUBLIC_API_TIMEOUT=10000

# Database Configuration (if needed)
# DATABASE_URL=your_database_url_here

# Authentication Configuration (if needed)
# JWT_SECRET=your_jwt_secret_here

# Environment
NODE_ENV=development
```

### 2. Environment Variables ที่ใช้
- `NEXT_PUBLIC_API_BASE_URL`: URL ของ API server (default: http://localhost:3003)
- `NEXT_PUBLIC_API_TIMEOUT`: Timeout สำหรับ API requests ใน milliseconds (default: 10000)
- `NODE_ENV`: Environment (development/production)

## การใช้งาน API Config

### 1. Import config functions
```javascript
import { apiGet, apiPost, apiPut, apiDelete, API_ENDPOINTS } from '../utils/config';
```

### 2. ตัวอย่างการใช้งาน

#### GET Request
```javascript
// เดิม
const response = await fetch(`http://localhost:3003/api/hotels/backoffice/order/${user.hotel_id}`);

// ใหม่
const response = await apiGet(API_ENDPOINTS.HOTEL_ORDERS(user.hotel_id));
```

#### POST Request
```javascript
// เดิม
const response = await fetch('http://localhost:3003/api/hotels/backoffice/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

// ใหม่
const response = await apiPost(API_ENDPOINTS.LOGIN, { email, password });
```

#### PUT Request
```javascript
// เดิม
const response = await fetch('http://localhost:3003/api/hotels/backoffice/UpdateStatusConfirm', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: orderId, status_confirm: newStatus })
});

// ใหม่
const response = await apiPut(API_ENDPOINTS.UPDATE_ORDER_STATUS, {
  id: orderId,
  status_confirm: newStatus
});
```

#### DELETE Request
```javascript
// เดิม
const response = await fetch(`http://localhost:3003/api/hotels/backoffice/DeleteRoomType/${id}`, {
  method: 'DELETE'
});

// ใหม่
const response = await apiDelete(API_ENDPOINTS.DELETE_ROOM_TYPE(id));
```

## API Endpoints ที่มีอยู่

### Authentication
- `API_ENDPOINTS.LOGIN`: `/api/auth/login`

### Hotels
- `API_ENDPOINTS.HOTEL_ORDERS(hotelId)`: `/api/hotels/backoffice/order/${hotelId}`
- `API_ENDPOINTS.HOTEL_CONFIRMED_ORDERS(hotelId)`: `/api/hotels/backoffice/orderconfirm/${hotelId}`
- `API_ENDPOINTS.HOTEL_CANCELLED_ORDERS(hotelId)`: `/api/hotels/backoffice/ordercancelled/${hotelId}`
- `API_ENDPOINTS.UPDATE_ORDER_STATUS`: `/api/hotels/backoffice/UpdateStatusConfirm`
- `API_ENDPOINTS.ROOM_TYPES(hotelId)`: `/api/hotels/backoffice/roomtype/${hotelId}`
- `API_ENDPOINTS.UPDATE_ROOM_TYPE`: `/api/hotels/backoffice/UpdateRoomType`
- `API_ENDPOINTS.DELETE_ROOM_TYPE(id)`: `/api/hotels/backoffice/DeleteRoomType/${id}`

### Museums
- `API_ENDPOINTS.MUSEUM_ORDERS(museumId)`: `/api/museums/backoffice/order/${museumId}`
- `API_ENDPOINTS.MUSEUM_CONFIRMED_ORDERS(museumId)`: `/api/museums/backoffice/orderconfirm/${museumId}`
- `API_ENDPOINTS.MUSEUM_CANCELLED_ORDERS(museumId)`: `/api/museums/backoffice/ordercancelled/${museumId}`
- `API_ENDPOINTS.MUSEUM_ROOM_TYPES(museumId)`: `/api/museums/backoffice/roomtype/${museumId}`
- `API_ENDPOINTS.UPDATE_MUSEUM_ROOM_TYPE`: `/api/museums/backoffice/UpdateRoomType`
- `API_ENDPOINTS.DELETE_MUSEUM_ROOM_TYPE(id)`: `/api/museums/backoffice/DeleteRoomType/${id}`

## ข้อดีของการใช้ Config

### 1. **Centralized Configuration**
- จัดการ API base URL และ timeout ในที่เดียว
- ง่ายต่อการเปลี่ยน environment (development/production)

### 2. **Consistent Error Handling**
- Timeout handling อัตโนมัติ
- Error handling ที่สอดคล้องกันทุกหน้า

### 3. **Type Safety**
- API endpoints ถูกกำหนดไว้ล่วงหน้า
- ลดข้อผิดพลาดในการพิมพ์ URL

### 4. **Maintainability**
- ง่ายต่อการเพิ่ม/แก้ไข API endpoints
- Code ที่อ่านง่ายและเข้าใจง่าย

## การ Deploy

### Development
```bash
# ใช้ .env.local
npm run dev
```

### Production
```bash
# ตั้งค่า environment variables ใน production server
NEXT_PUBLIC_API_BASE_URL=https://your-api-server.com
NEXT_PUBLIC_API_TIMEOUT=15000
NODE_ENV=production
```

## การ Debug

### ตรวจสอบ Config
```javascript
import { API_CONFIG } from '../utils/config';
console.log('API Base URL:', API_CONFIG.BASE_URL);
console.log('API Timeout:', API_CONFIG.TIMEOUT);
```

### ตรวจสอบ Environment Variables
```javascript
console.log('API Base URL from env:', process.env.NEXT_PUBLIC_API_BASE_URL);
console.log('API Timeout from env:', process.env.NEXT_PUBLIC_API_TIMEOUT);
```

## การเพิ่ม API Endpoint ใหม่

### 1. เพิ่มใน API_ENDPOINTS
```javascript
export const API_ENDPOINTS = {
  // ... existing endpoints
  NEW_ENDPOINT: (param) => `/api/new/endpoint/${param}`,
};
```

### 2. ใช้งานในหน้า
```javascript
const response = await apiGet(API_ENDPOINTS.NEW_ENDPOINT(param));
``` 