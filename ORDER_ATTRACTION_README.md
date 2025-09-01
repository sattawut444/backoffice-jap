# Order Attraction Page

## ภาพรวม
หน้า Order Attraction เป็นหน้าสำหรับจัดการและติดตามการจองและสำรองที่นั่งสำหรับสถานที่ท่องเที่ยวต่างๆ เช่น พิพิธภัณฑ์ สวนสนุก สวนสัตว์ และพิพิธภัณฑ์สัตว์น้ำ

## คุณสมบัติหลัก

### 1. การแสดงรายการ Order
- แสดงรายการ order ทั้งหมดของสถานที่ท่องเที่ยว
- แสดงข้อมูลสำคัญ: Order ID, ชื่อลูกค้า, ประเภทสถานที่, วันที่, เวลา, จำนวนคน, ราคา, สถานะ
- รองรับการแสดงผลแบบ responsive

### 2. ระบบค้นหาและกรอง
- ค้นหาตาม Order ID
- ค้นหาตามชื่อลูกค้า
- กรองตามสถานะ (Pending, Confirmed, Cancelled)
- กรองตามประเภทสถานที่ท่องเที่ยว (Museum, Theme Park, Zoo, Aquarium)

### 3. การจัดการ Order
- **View**: ดูรายละเอียด order ในรูปแบบ modal
- **Confirm**: ยืนยัน order ที่มีสถานะ pending
- **Cancel**: ยกเลิก order ที่มีสถานะ pending

### 4. การแสดงสถานะ
- **Pending**: สีเหลือง - รอการยืนยัน
- **Confirmed**: สีเขียว - ยืนยันแล้ว
- **Cancelled**: สีแดง - ยกเลิกแล้ว

### 5. การแสดงประเภทสถานที่
- **Museum**: สีน้ำเงิน
- **Theme Park**: สีม่วง
- **Zoo**: สีเขียว
- **Aquarium**: สีฟ้า

## โครงสร้างไฟล์

```
src/app/order-attraction/
└── page.js          # หน้าหลัก Order Attraction
```

## การใช้งาน

### การเข้าถึง
1. เข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์
2. คลิกที่ "Attraction Orders" ในเมนูด้านซ้าย
3. ระบบจะแสดงรายการ order ทั้งหมด

### การค้นหา
1. ใส่คำค้นหาในช่องต่างๆ
2. เลือกสถานะหรือประเภทสถานที่ที่ต้องการ
3. คลิกปุ่ม "Search"

### การจัดการ Order
1. **ดูรายละเอียด**: คลิกปุ่ม "View" ในแถวที่ต้องการ
2. **ยืนยัน Order**: คลิกปุ่ม "Confirm" สำหรับ order ที่มีสถานะ pending
3. **ยกเลิก Order**: คลิกปุ่ม "Cancel" สำหรับ order ที่มีสถานะ pending

## API Endpoints

### 1. ดึงข้อมูล Order
```
GET /api/hotels/backoffice/attraction-order/{hotel_id}
```

### 2. ยืนยัน Order
```
PUT /api/hotels/backoffice/attraction-order/confirm/{order_id}
```

### 3. ยกเลิก Order
```
PUT /api/hotels/backoffice/attraction-order/cancel/{order_id}
```

## โครงสร้างข้อมูล Order

```javascript
{
  id: 1,
  order_id: 'ATR001',
  customer_name: 'John Doe',
  attraction_name: 'Museum Tour',
  attraction_type: 'museum',
  date: '2024-01-15',
  time: '10:00',
  number_of_people: 4,
  total_price: 1200,
  status: 'pending',
  phone: '0812345678',
  email: 'john@example.com'
}
```

## การจัดการ Error

### 1. API Timeout
- ระบบจะแสดงข้อความ "Request timeout. Please try again."
- มีปุ่ม "Try Again" สำหรับลองใหม่

### 2. API Error
- ระบบจะแสดงข้อความ "Failed to fetch attraction orders. Please try again later."
- มีปุ่ม "Try Again" สำหรับลองใหม่

### 3. Demo Data
- หาก API endpoint ไม่พบ ระบบจะใช้ demo data แทน
- แสดงข้อมูลตัวอย่างสำหรับการทดสอบ

## การปรับแต่ง

### 1. เพิ่มประเภทสถานที่ใหม่
แก้ไขฟังก์ชัน `getAttractionTypeColor` ในไฟล์ `page.js`:

```javascript
const getAttractionTypeColor = (type) => {
  switch (type) {
    case 'museum':
      return 'bg-blue-100 text-blue-800';
    case 'theme_park':
      return 'bg-purple-100 text-purple-800';
    case 'zoo':
      return 'bg-green-100 text-green-800';
    case 'aquarium':
      return 'bg-cyan-100 text-cyan-800';
    case 'new_type':  // เพิ่มประเภทใหม่
      return 'bg-orange-100 text-orange-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
```

### 2. เพิ่มฟิลด์ค้นหาใหม่
เพิ่ม state และ input field ในส่วน Search and Filters:

```javascript
const [searchNewField, setSearchNewField] = useState('');

// เพิ่มใน JSX
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    New Field
  </label>
  <input
    type="text"
    value={searchNewField}
    onChange={(e) => setSearchNewField(e.target.value)}
    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
    placeholder="Search by New Field"
  />
</div>
```

## การทดสอบ

### 1. ทดสอบการแสดงผล
- ตรวจสอบว่าข้อมูลแสดงผลถูกต้อง
- ตรวจสอบการแสดงผลแบบ responsive

### 2. ทดสอบการค้นหา
- ทดสอบการค้นหาด้วย Order ID
- ทดสอบการค้นหาด้วยชื่อลูกค้า
- ทดสอบการกรองตามสถานะ
- ทดสอบการกรองตามประเภทสถานที่

### 3. ทดสอบการจัดการ Order
- ทดสอบการดูรายละเอียด order
- ทดสอบการยืนยัน order
- ทดสอบการยกเลิก order

### 4. ทดสอบการจัดการ Error
- ทดสอบเมื่อ API ไม่ตอบสนอง
- ทดสอบเมื่อ API ส่งข้อมูลผิดรูปแบบ

## หมายเหตุ

- หน้า Order Attraction ใช้ ProtectedRoute เพื่อป้องกันการเข้าถึงโดยไม่ได้รับอนุญาต
- ระบบรองรับการแสดงผลแบบ responsive สำหรับอุปกรณ์มือถือ
- มีการจัดการ timeout สำหรับ API calls เพื่อป้องกันการรอคอยนานเกินไป
- ใช้ Tailwind CSS สำหรับการจัดรูปแบบและ responsive design

