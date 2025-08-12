# Docker Setup สำหรับ Backoffice

## การติดตั้งและรันด้วย Docker

### วิธีที่ 1: ใช้ Docker Compose (Production)

```bash
# Build และรัน application
docker-compose up --build

# รันใน background
docker-compose up -d --build

# หยุดการทำงาน
docker-compose down
```

### วิธีที่ 2: ใช้ Docker Compose Development (แนะนำสำหรับการพัฒนา)

```bash
# รันในโหมด development พร้อม volumes
docker-compose -f docker-compose.dev.yml up --build

# รันใน background
docker-compose -f docker-compose.dev.yml up -d --build

# หยุดการทำงาน
docker-compose -f docker-compose.dev.yml down
```

### วิธีที่ 3: ใช้ Docker โดยตรง

```bash
# Build Docker image
docker build -t backoffice .

# รัน container
docker run -p 3000:3000 backoffice

# รันใน background
docker run -d -p 3000:3000 --name backoffice-app backoffice
```

### วิธีที่ 2: ใช้ Docker โดยตรง

```bash
# Build Docker image
docker build -t backoffice .

# รัน container
docker run -p 3000:3000 backoffice

# รันใน background
docker run -d -p 3000:3000 --name backoffice-app backoffice
```

## การเข้าถึง Application

หลังจากรันแล้ว สามารถเข้าถึง application ได้ที่:
- http://localhost:3000

## Volumes และ Cache

### ประโยชน์ของ Volumes:
- **node_modules**: Cache dependencies ไม่ต้องติดตั้งใหม่
- **next_cache**: Cache Next.js build ไม่ต้อง build ใหม่
- **app_data**: เก็บข้อมูลที่ persistent
- **Source code**: แก้ไขโค้ดได้ทันทีโดยไม่ต้อง restart

### Hot Reload Features:
- **Auto-refresh**: เมื่อแก้ไขไฟล์จะ refresh หน้าเว็บอัตโนมัติ
- **Fast Refresh**: React component จะ update ทันทีโดยไม่สูญเสีย state
- **File Watching**: ตรวจจับการเปลี่ยนแปลงไฟล์แบบ real-time
- **Polling**: ใช้ polling mode เพื่อความเสถียรใน Docker

### คำสั่งจัดการ Volumes:

```bash
# ดู volumes ทั้งหมด
docker volume ls

# ดูรายละเอียด volume
docker volume inspect backoffice_node_modules

# ลบ volumes (ระวัง! จะลบ cache ทั้งหมด)
docker volume rm backoffice_node_modules backoffice_next_cache backoffice_app_data

# ลบ volumes ทั้งหมด
docker volume prune
```

## คำสั่งที่มีประโยชน์

```bash
# ดู logs
docker-compose logs -f

# ดู logs สำหรับ development
docker-compose -f docker-compose.dev.yml logs -f

# เข้าไปใน container
docker exec -it backoffice-app sh

# ลบ container และ image
docker-compose down --rmi all

# Restart container
docker-compose restart

# Update code without rebuilding (development mode)
# แก้ไขไฟล์ใน src/ แล้ว save จะ auto-reload ทันที
# หรือแค่ refresh หน้าเว็บก็จะเห็นการเปลี่ยนแปลง
```

## การพัฒนา

### โหมด Development (แนะนำ):
```bash
# รันด้วย Docker Compose Development
docker-compose -f docker-compose.dev.yml up --build

# ข้อดี:
# - Hot reload (แก้ไขโค้ดได้ทันที)
# - Cache dependencies
# - ไม่ต้อง restart container
# - ดู logs ได้ง่าย
# - Auto-refresh เมื่อแก้ไขไฟล์
```

### โหมด Production:
```bash
# รันด้วย Docker Compose Production
docker-compose up --build

# ข้อดี:
# - Optimized build
# - ปลอดภัยกว่า
# - เหมาะสำหรับ deploy
```

## หมายเหตุ

- Application จะรันที่ port 3000
- ใช้ Node.js 18 Alpine image เพื่อลดขนาด
- มีการ optimize สำหรับ production build 