# การเปลี่ยน API Endpoint สำหรับ Update

## การเปลี่ยนแปลง

### API Endpoint ใหม่
```javascript
// เดิม
PUT http://localhost:3003/product/${editingItem.id}

// ใหม่
PUT http://localhost:3003/api/hotels/backoffice/updateroom
```

## การทำงานของระบบ

### 1. **การส่งข้อมูลไปยัง API**
```javascript
const handleEditSubmit = async (e) => {
  e.preventDefault();
  setIsEditing(true);
  
  try {
    console.log('Updating item:', editingItem);
    
    // ใช้ API endpoint ใหม่
    const response = await fetch('http://localhost:3003/api/hotels/backoffice/updateroom', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editingItem),
    });
    
    // ตรวจสอบ response
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Update response:', result);
    
    // อัปเดตข้อมูลในตาราง
    setData(prev => prev.map(item => 
      (item.hotels_plans_id === editingItem.hotels_plans_id || item.id === editingItem.id) ? editingItem : item
    ));
    
    setShowEditModal(false);
    setEditingItem(null);
    
    // แสดงข้อความสำเร็จ
    alert('Record updated successfully!');
  } catch (err) {
    console.error('Error updating item:', err);
    alert('Failed to update item. Please try again.');
  } finally {
    setIsEditing(false);
  }
};
```

### 2. **ข้อมูลที่ส่งไปยัง API**
```javascript
// ข้อมูลที่ส่งไปยัง API
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

### 3. **การอัปเดตข้อมูลในตาราง**
```javascript
// อัปเดตข้อมูลใน state
setData(prev => prev.map(item => 
  (item.hotels_plans_id === editingItem.hotels_plans_id || item.id === editingItem.id) ? editingItem : item
));
```

## API Specification

### Request
```javascript
PUT http://localhost:3003/api/hotels/backoffice/updateroom
Content-Type: application/json

{
  "hotels_plans_id": 1,
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
```

### Expected Response
```javascript
// Success Response
{
  "success": true,
  "message": "Room updated successfully",
  "data": {
    "hotels_plans_id": 1,
    "room_code": "001",
    "room_name": "Standard Room Updated",
    // ... ข้อมูลที่อัปเดตแล้ว
  }
}

// Error Response
{
  "success": false,
  "message": "Failed to update room",
  "error": "Error details"
}
```

## การ Debug

### Console Logs
```javascript
// ก่อนส่งข้อมูล
console.log('Updating item:', editingItem);

// หลังได้รับ response
console.log('Update response:', result);
```

### การตรวจสอบ Network
1. เปิด Developer Tools (F12)
2. ไปที่ Network tab
3. แก้ไขข้อมูลและกด Save
4. ดู API call ไปยัง `/updateroom`

## การจัดการ Error

### 1. **Network Error**
```javascript
catch (err) {
  console.error('Error updating item:', err);
  alert('Failed to update item. Please try again.');
}
```

### 2. **HTTP Error**
```javascript
if (!response.ok) {
  throw new Error(`HTTP error! status: ${response.status}`);
}
```

### 3. **Success Message**
```javascript
// แสดงข้อความสำเร็จ
alert('Record updated successfully!');
```

## ข้อดีของการเปลี่ยนแปลง

### 1. **API Endpoint ที่ชัดเจน**
- ใช้ endpoint ที่เฉพาะเจาะจงสำหรับ update room
- ไม่ต้องส่ง ID ใน URL

### 2. **การจัดการข้อมูลที่ดีขึ้น**
- ส่งข้อมูลทั้งหมดใน request body
- รองรับ ID ที่หลากหลาย (hotels_plans_id หรือ id)

### 3. **User Experience ที่ดีขึ้น**
- แสดงข้อความสำเร็จเมื่ออัปเดตสำเร็จ
- Console logs สำหรับ debug

### 4. **Error Handling ที่ดีขึ้น**
- จัดการ error ได้ครอบคลุม
- แสดงข้อความ error ที่ชัดเจน

## การทดสอบ

### 1. **ทดสอบการอัปเดตข้อมูล**
1. คลิกปุ่ม Edit ในตาราง
2. แก้ไขข้อมูลในฟิลด์ต่างๆ
3. กดปุ่ม Save Changes
4. ตรวจสอบว่า API call ไปยัง `/updateroom`
5. ตรวจสอบว่าข้อมูลอัปเดตในตาราง

### 2. **ทดสอบ Error Handling**
1. แก้ไขข้อมูลให้ไม่ถูกต้อง
2. กดปุ่ม Save Changes
3. ตรวจสอบว่าแสดง error message

### 3. **ทดสอบ Console Logs**
1. เปิด Developer Tools
2. แก้ไขข้อมูลและกด Save
3. ตรวจสอบ console logs

## หมายเหตุสำคัญ

1. **API endpoint ใหม่** - ใช้ `/updateroom` แทน `/product/:id`
2. **Request method** - ใช้ PUT method
3. **Request body** - ส่งข้อมูลทั้งหมดใน JSON format
4. **Response handling** - ตรวจสอบ response และแสดงข้อความที่เหมาะสม
5. **Error handling** - จัดการ error ได้ครอบคลุม 