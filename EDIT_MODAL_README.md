# การแก้ไขหน้า Edit Modal

## การเปลี่ยนแปลงที่ทำ

### 1. **เพิ่มฟิลด์ที่ตรงกับข้อมูลในตาราง**

#### ฟิลด์เดิม (ไม่ตรงกับข้อมูล):
- `number` - ไม่มีในข้อมูลจริง
- `name` - ไม่มีในข้อมูลจริง  
- `status` - ใช้ string แทนที่จะเป็น number

#### ฟิลด์ใหม่ (ตรงกับข้อมูลจริง):
- `room_code` - รหัสห้อง
- `room_name` - ชื่อห้อง
- `room_type` - ประเภทห้อง
- `price` - ราคา
- `facilities` - สิ่งอำนวยความสะดวก
- `detail` - รายละเอียด
- `number_beds` - จำนวนเตียง
- `number_guests` - จำนวนแขก
- `all_room` - จำนวนห้องทั้งหมด
- `remaining_rooms` - จำนวนห้องที่เหลือ
- `status` - สถานะ (1 = Active, 0 = Inactive)

### 2. **ปรับปรุง UI/UX**

#### ขนาด Modal:
```javascript
// เดิม
<div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">

// ใหม่
<div className="relative top-10 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
```

#### Layout:
```javascript
// ใช้ Grid Layout สำหรับฟิลด์ที่เกี่ยวข้อง
<div className="grid grid-cols-2 gap-4">
  <div>Room Code</div>
  <div>Room Name</div>
</div>
```

#### Input Types:
```javascript
// Text inputs สำหรับข้อมูลทั่วไป
<input type="text" name="room_code" />

// Number inputs สำหรับตัวเลข
<input type="number" name="price" />

// Textarea สำหรับข้อมูลยาว
<textarea name="facilities" rows="2" />

// Select สำหรับสถานะ
<select name="status">
  <option value={1}>Active</option>
  <option value={0}>Inactive</option>
</select>
```

### 3. **แก้ไขการจัดการ ID**

#### การค้นหา Item:
```javascript
// เดิม
const item = data.find(item => item.id === id);

// ใหม่
const item = data.find(item => item.hotels_plans_id === id || item.id === id);
```

#### การส่ง ID:
```javascript
// เดิม
onClick={() => handleEdit(item.id)}

// ใหม่
onClick={() => handleEdit(item.hotels_plans_id || item.id)}
```

### 4. **การจัดการข้อมูล**

#### Default Values:
```javascript
// ใช้ || '' เพื่อป้องกัน undefined
value={editingItem.room_code || ''}
value={editingItem.status || 1}
```

#### Data Types:
```javascript
// Status ใช้ number แทน string
<option value={1}>Active</option>
<option value={0}>Inactive</option>
```

## โครงสร้างข้อมูลที่รองรับ

### ข้อมูลในตาราง:
```javascript
{
  hotels_plans_id: 1,
  room_code: "001",
  room_name: "Standard Room",
  room_type: "Standard",
  facilities: "WiFi, TV, AC",
  detail: "Comfortable room with city view",
  price: "100",
  number_beds: 2,
  number_guests: 2,
  all_room: 10,
  remaining_rooms: 5,
  status: 1
}
```

### ฟิลด์ใน Edit Modal:
```javascript
// ข้อมูลที่แก้ไขได้
{
  room_code: "001",
  room_name: "Standard Room",
  room_type: "Standard",
  price: "100",
  facilities: "WiFi, TV, AC",
  detail: "Comfortable room with city view",
  number_beds: 2,
  number_guests: 2,
  all_room: 10,
  remaining_rooms: 5,
  status: 1
}
```

## การทำงานของระบบ

### 1. **การเปิด Edit Modal**
```javascript
// คลิกปุ่ม Edit
onClick={() => handleEdit(item.hotels_plans_id || item.id)}

// ค้นหาข้อมูล
const item = data.find(item => item.hotels_plans_id === id || item.id === id);

// ตั้งค่าข้อมูลใน modal
setEditingItem({ ...item });
setShowEditModal(true);
```

### 2. **การแสดงข้อมูลใน Modal**
```javascript
// แสดงข้อมูลในฟิลด์ต่างๆ
value={editingItem.room_code || ''}
value={editingItem.room_name || ''}
value={editingItem.price || ''}
// ... ฯลฯ
```

### 3. **การบันทึกข้อมูล**
```javascript
// เมื่อกด Save
const handleEditSubmit = async (e) => {
  e.preventDefault();
  // ส่งข้อมูลที่แก้ไขไปยัง API
  const response = await fetch(`http://localhost:3003/api/hotels/backoffice/room/${editingItem.hotels_plans_id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(editingItem)
  });
};
```

## ข้อดีของการแก้ไข

### 1. **ข้อมูลตรงกับตาราง**
- ฟิลด์ใน edit modal ตรงกับข้อมูลที่แสดงในตาราง
- ไม่มีฟิลด์ที่ไม่เกี่ยวข้อง

### 2. **UI ที่ดีขึ้น**
- Modal ขนาดใหญ่ขึ้น (600px)
- ใช้ Grid Layout สำหรับจัดเรียงฟิลด์
- มี Scroll เมื่อข้อมูลยาว

### 3. **การจัดการข้อมูลที่ดีขึ้น**
- รองรับ ID ที่หลากหลาย (hotels_plans_id หรือ id)
- ใช้ default values เพื่อป้องกัน error
- Data types ที่ถูกต้อง (number สำหรับ status)

### 4. **User Experience ที่ดีขึ้น**
- ฟิลด์ที่ชัดเจนและเข้าใจง่าย
- การจัดกลุ่มฟิลด์ที่เกี่ยวข้อง
- การแสดงข้อมูลที่ครบถ้วน

## การทดสอบ

### 1. **ทดสอบการเปิด Modal**
1. คลิกปุ่ม Edit ในตาราง
2. ตรวจสอบว่า Modal เปิดขึ้น
3. ตรวจสอบว่าข้อมูลแสดงถูกต้อง

### 2. **ทดสอบการแก้ไขข้อมูล**
1. แก้ไขข้อมูลในฟิลด์ต่างๆ
2. กดปุ่ม Save Changes
3. ตรวจสอบว่าข้อมูลอัปเดตในตาราง

### 3. **ทดสอบการยกเลิก**
1. แก้ไขข้อมูล
2. กดปุ่ม Cancel
3. ตรวจสอบว่าข้อมูลไม่เปลี่ยนแปลง 