'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../components/AuthProvider';
import ProtectedRoute from '../components/ProtectedRoute';
import jsQR from 'jsqr';
const API_BASE_URL = process.env.API_BASE_URL;
export default function ScanQRPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [error, setError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (หลัง) หรือ 'user' (หน้า)
  const [cameraQuality, setCameraQuality] = useState('high'); // 'low', 'medium', 'high'
  const [scanMode, setScanMode] = useState('auto'); // 'auto', 'manual', 'continuous'
  const [flashEnabled, setFlashEnabled] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // เพิ่มฟังก์ชันตรวจสอบข้อมูล QR Code ที่ปลอดภัย
  const isQRDataValid = (data) => {
    return data && 
           typeof data === 'object' && 
           data.text && 
           data.type && 
           data.timestamp;
  };

  const isLocationValid = (location) => {
    
    return location && 
           typeof location === 'object' && 
           location.topLeft && 
           location.topRight && 
           location.bottomLeft && 
           location.bottomRight &&
           typeof location.topLeft.x === 'number' &&
           typeof location.topLeft.y === 'number' &&
           typeof location.topRight.x === 'number' &&
           typeof location.topRight.y === 'number' &&
           typeof location.bottomLeft.x === 'number' &&
           typeof location.bottomLeft.y === 'number' &&
           typeof location.bottomRight.x === 'number' &&
           typeof location.bottomRight.y === 'number';
  };

  // เพิ่ม useEffect เพื่อติดตามการเปลี่ยนแปลงของ isScanning
  useEffect(() => {
    console.log('🔄 isScanning state changed to:', isScanning);
    
    // เริ่มการตรวจจับเมื่อ isScanning เป็น true
    if (isScanning && videoRef.current && canvasRef.current) {
      console.log('✅ Starting detection from useEffect...');
      detectQRCode();
    }
  }, [isScanning]);

  // เพิ่ม useEffect เพื่อติดตามการเปลี่ยนแปลงของ isLoading
  useEffect(() => {
    console.log('🔄 isLoading state changed to:', isLoading);
  }, [isLoading]);

  useEffect(() => {
    // Get available cameras when component mounts
    getAvailableCameras();
    
    // ขอสิทธิ์การแจ้งเตือน
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    
    // ตรวจสอบ video element หลังจาก component mount
    const checkVideoElement = () => {
      if (videoRef.current) {
        console.log('Video element found on mount');
      } else {
        console.log('Video element not found on mount');
      }
      
      if (canvasRef.current) {
        console.log('Canvas element found on mount');
      } else {
        console.log('Canvas element not found on mount');
      }
    };
    
    // รอให้ DOM พร้อมใช้งาน
    setTimeout(checkVideoElement, 100);
    
    return () => {
      console.log('🧹 Component unmounting, cleaning up...');
      // ทำการ cleanup ที่ครอบคลุมมากขึ้น
      if (streamRef.current) {
        console.log('🔄 Stopping camera stream on unmount...');
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
      
      if (animationFrameRef.current) {
        console.log('🔄 Cancelling animation frame on unmount...');
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      if (videoRef.current) {
        console.log('📺 Resetting video on unmount...');
        videoRef.current.srcObject = null;
        videoRef.current.load();
      }
      
      // รอสักครู่เพื่อให้ระบบปล่อยทรัพยากร
      setTimeout(() => {
        console.log('✅ Cleanup completed on unmount');
      }, 100);
    };
  }, []);

    const getAvailableCameras = async () => {
    try {
      // ขอสิทธิ์การเข้าถึงกล้องก่อน
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device && device.kind === 'videoinput');
      
      // ตรวจสอบและกรองข้อมูลกล้องที่ถูกต้อง
      const validCameras = videoDevices.filter(device => device && device.deviceId);
      
      if (validCameras.length === 0) {
        setError('ไม่พบกล้องที่ใช้งานได้ กรุณาตรวจสอบการเชื่อมต่อกล้อง');
        setCameras([]);
        return;
      }
      
      // เพิ่มชื่อที่เข้าใจง่ายสำหรับกล้องและจำแนกประเภท
      const camerasWithLabels = validCameras.map(device => {
        let cameraType = 'unknown';
        let facing = 'unknown';
        
        // จำแนกประเภทกล้อง
        if (device.label) {
          const label = device.label.toLowerCase();
          if (label.includes('back') || label.includes('rear') || label.includes('environment')) {
            cameraType = 'back';
            facing = 'environment';
          } else if (label.includes('front') || label.includes('user')) {
            cameraType = 'front';
            facing = 'user';
          } else if (label.includes('webcam') || label.includes('external')) {
            cameraType = 'webcam';
            facing = 'environment';
          }
        }
        
        // ตรวจสอบ deviceId สำหรับ pattern ที่รู้จัก
        if (device.deviceId) {
          const deviceId = device.deviceId.toLowerCase();
          if (deviceId.includes('back') || deviceId.includes('rear')) {
            cameraType = 'back';
            facing = 'environment';
          } else if (deviceId.includes('front')) {
            cameraType = 'front';
            facing = 'user';
          }
        }
        
        return {
          ...device,
          cameraType,
          facing,
          displayName: device.label || 
            (cameraType === 'back' ? '📷 กล้องหลัง' : 
             cameraType === 'front' ? '📱 กล้องหน้า' : 
             cameraType === 'webcam' ? '💻 กล้องเว็บแคม' :
             `📹 กล้อง ${device.deviceId.slice(0, 8)}...`)
        };
      });
      
      // เรียงลำดับกล้อง: หลัง -> หน้า -> เว็บแคม -> อื่นๆ
      const sortedCameras = camerasWithLabels.sort((a, b) => {
        const order = { 'back': 0, 'front': 1, 'webcam': 2, 'unknown': 3 };
        return order[a.cameraType] - order[b.cameraType];
      });
      
      setCameras(sortedCameras);
      if (sortedCameras.length > 0) {
        // เลือกกล้องหลังเป็นค่าเริ่มต้น
        const backCamera = sortedCameras.find(cam => cam.cameraType === 'back');
        const frontCamera = sortedCameras.find(cam => cam.cameraType === 'front');
        setSelectedCamera(backCamera ? backCamera.deviceId : sortedCameras[0].deviceId);
        setCameraFacing(backCamera ? 'environment' : frontCamera ? 'user' : 'environment');
      }
      
      console.log('Found cameras:', sortedCameras);
    } catch (error) {
      console.error('Error getting cameras:', error);
      if (error.name === 'NotAllowedError') {
        setError('ไม่ได้รับสิทธิ์การเข้าถึงกล้อง กรุณาอนุญาตให้เว็บไซต์ใช้กล้อง');
      } else if (error.name === 'NotFoundError') {
        setError('ไม่พบกล้องที่เลือก กรุณาตรวจสอบการเชื่อมต่อกล้อง');
      } else {
        setError('ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การเข้าถึงกล้อง');
      }
      setCameras([]);
    }
  };

  // เพิ่มฟังก์ชันตรวจสอบความพร้อมของกล้อง
  const checkCameraAvailability = async () => {
    try {
      // ตรวจสอบว่า MediaDevices API รองรับหรือไม่
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API ไม่รองรับในเบราว์เซอร์นี้');
      }
      
      // ตรวจสอบว่ากล้องที่เลือกยังใช้งานได้หรือไม่
      if (selectedCamera) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameraExists = devices.some(device => 
          device.kind === 'videoinput' && device.deviceId === selectedCamera
        );
        
        if (!cameraExists) {
          console.log('⚠️ Selected camera no longer available, refreshing camera list...');
          await getAvailableCameras();
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('❌ Camera availability check failed:', error);
      return false;
    }
  };

  // ปรับปรุงฟังก์ชัน startScanning เพื่อตรวจสอบความพร้อมของกล้องก่อน
  const startScanning = async () => {
    try {
      console.log('🚀 Starting scanning...');
      setIsLoading(true);
      setError(null);
      setScannedData(null);

      // ตรวจสอบความพร้อมของกล้องก่อน
      const isCameraAvailable = await checkCameraAvailability();
      if (!isCameraAvailable) {
        setError('กล้องไม่พร้อมใช้งาน กรุณาเลือกกล้องใหม่');
        setIsLoading(false);
        return;
      }

      // ตรวจสอบว่า video element พร้อมใช้งานหรือไม่
      if (!videoRef.current) {
        console.error('❌ Video element not found');
        setError('ไม่พบ video element กรุณารีเฟรชหน้าเว็บ');
        setIsLoading(false);
        return;
      }

      // ปิดการสแกนก่อนถ้ามีอยู่
      if (streamRef.current) {
        console.log('🔄 Stopping previous scan...');
        stopScanning();
        // รอให้การหยุดเสร็จสมบูรณ์
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // ตั้งค่าคุณภาพกล้องตามที่เลือก
      let width, height, frameRate;
      switch (cameraQuality) {
        case 'low':
          width = { ideal: 640, min: 320 };
          height = { ideal: 480, min: 240 };
          frameRate = { ideal: 15, min: 10 };
          break;
        case 'medium':
          width = { ideal: 1280, min: 640 };
          height = { ideal: 720, min: 480 };
          frameRate = { ideal: 24, min: 15 };
          break;
        case 'high':
        default:
          width = { ideal: 1920, min: 1280 };
          height = { ideal: 1080, min: 720 };
          frameRate = { ideal: 30, min: 20 };
          break;
      }

      const constraints = {
        video: {
          deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
          width,
          height,
          frameRate,
          facingMode: cameraFacing,
          // เพิ่มการตั้งค่าสำหรับมือถือ
          aspectRatio: { ideal: 16/9, min: 4/3, max: 21/9 }
        }
      };

      console.log('📹 Camera constraints:', constraints);
      console.log('📱 Video element exists:', !!videoRef.current);
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      console.log('✅ Camera stream obtained:', stream);
      console.log('🎥 Stream tracks:', stream.getTracks().map(track => ({ kind: track.kind, enabled: track.enabled })));
      
      if (videoRef.current) {
        // ตั้งค่า video element
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        
        // รอให้ video พร้อมใช้งาน
        videoRef.current.onloadedmetadata = () => {
          console.log('📊 Video metadata loaded');
          console.log('📏 Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          
          videoRef.current.play().then(() => {
            console.log('▶️ Video started playing');
            // ตั้งค่า isScanning เป็น true ก่อนเริ่มการตรวจจับ
            setIsScanning(true);
            setIsLoading(false);
            setScanStatus('กำลังสแกน...');
            
            // Start QR code detection
            console.log('🔍 Starting QR code detection...');
            // ไม่ต้องใช้ setTimeout แล้ว เพราะ useEffect จะจัดการให้
          }).catch(error => {
            console.error('❌ Error playing video:', error);
            setError('ไม่สามารถเล่นวิดีโอได้: ' + error.message);
            setIsLoading(false);
          });
        };
        
        videoRef.current.onerror = (error) => {
          console.error('❌ Video error:', error);
          setError('เกิดข้อผิดพลาดกับวิดีโอ: ' + error.message);
          setIsLoading(false);
        };

        videoRef.current.oncanplay = () => {
          console.log('✅ Video can play');
        };

        videoRef.current.onloadeddata = () => {
          console.log('📁 Video data loaded');
        };
      } else {
        setError('ไม่พบ video element หลังจากเปิดกล้อง');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('❌ Error starting camera:', error);
      if (error.name === 'NotAllowedError') {
        setError('ไม่ได้รับสิทธิ์การเข้าถึงกล้อง กรุณาอนุญาตให้เว็บไซต์ใช้กล้อง');
      } else if (error.name === 'NotFoundError') {
        setError('ไม่พบกล้องที่เลือก กรุณาตรวจสอบการเชื่อมต่อกล้อง');
      } else if (error.name === 'NotReadableError') {
        setError('กล้องถูกใช้งานโดยโปรแกรมอื่น กรุณาปิดโปรแกรมอื่นที่ใช้กล้อง หรือคลิก "ลองใหม่" เพื่อรีเซ็ตกล้อง');
        // เพิ่มปุ่มลองใหม่สำหรับ NotReadableError
        setScanStatus('❌ กล้องถูกใช้งาน กรุณาลองใหม่');
      } else if (error.name === 'OverconstrainedError') {
        setError('การตั้งค่ากล้องไม่เหมาะสม กรุณาลองใหม่');
      } else if (error.message && error.message.includes('Device in use')) {
        setError('กล้องถูกใช้งาน กรุณาปิดโปรแกรมอื่นที่ใช้กล้อง หรือคลิก "ลองใหม่" เพื่อรีเซ็ตกล้อง');
        setScanStatus('❌ กล้องถูกใช้งาน กรุณาลองใหม่');
      } else {
        setError('ไม่สามารถเปิดกล้องได้: ' + error.message);
      }
      setIsLoading(false);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      console.log('🔄 Stopping camera stream...');
      streamRef.current.getTracks().forEach(track => {
        console.log(`Stopping track: ${track.kind}`);
        track.stop();
      });
      streamRef.current = null;
      console.log('✅ Camera stream stopped.');
    }
    
    if (animationFrameRef.current) {
      console.log('🔄 Cancelling animation frame...');
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      console.log('✅ Animation frame cancelled.');
    }
    
    if (videoRef.current) {
      console.log('📺 Resetting video srcObject to null...');
      videoRef.current.srcObject = null;
      // เพิ่มการ reset video properties
      videoRef.current.load();
      console.log('✅ Video srcObject reset.');
    }
    
    setIsScanning(false);
    setScanStatus('');
    console.log('🛑 Scanning stopped.');
  };

  // เพิ่มฟังก์ชัน force cleanup สำหรับกรณีที่กล้องถูกใช้งาน
  const forceCleanup = async () => {
    console.log('🧹 Force cleaning up camera resources...');
    
    // หยุด stream ที่มีอยู่
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    // หยุด animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // reset video element
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load();
    }
    
    // รอสักครู่เพื่อให้ระบบปล่อยทรัพยากร
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsScanning(false);
    setScanStatus('');
    setError(null);
    console.log('✅ Force cleanup completed');
  };

  // เพิ่มฟังก์ชัน retry camera access
  const retryCameraAccess = async () => {
    console.log('🔄 Retrying camera access...');
    setError(null);
    
    // ทำการ cleanup ก่อน
    await forceCleanup();
    
    // ลองเข้าถึงกล้องอีกครั้ง
    try {
      await getAvailableCameras();
      console.log('✅ Camera access retry successful');
    } catch (error) {
      console.error('❌ Camera access retry failed:', error);
      setError('ไม่สามารถเข้าถึงกล้องได้ กรุณาลองใหม่หรือรีเฟรชหน้าเว็บ');
    }
  };

  const detectQRCode = () => {
    // ตรวจสอบว่า video และ canvas พร้อมใช้งานหรือไม่
    if (!videoRef.current || !canvasRef.current) {
      console.log('🔴 Detection stopped: videoRef=', !!videoRef.current, 'canvasRef=', !!canvasRef.current);
      return;
    }

    // ตรวจสอบว่า isScanning เป็น true หรือไม่
    if (!isScanning) {
      console.log('🔴 Detection stopped: isScanning=', isScanning);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // ตรวจสอบว่า video พร้อมใช้งานหรือไม่
    if (video.readyState < video.HAVE_METADATA) {
      console.log('⏳ Video not ready yet, readyState:', video.readyState);
      if (isScanning) {
        animationFrameRef.current = requestAnimationFrame(detectQRCode);
      }
      return;
    }

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      try {
        // ตั้งค่าขนาด canvas ให้ตรงกับ video
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        
        if (videoWidth === 0 || videoHeight === 0) {
          console.log('⚠️ Video dimensions not available yet');
          if (isScanning) {
            animationFrameRef.current = requestAnimationFrame(detectQRCode);
          }
          return;
        }

        // ใช้ขนาดที่เหมาะสมสำหรับการประมวลผล (ไม่ต้องใหญ่เกินไป)
        const maxSize = 1280; // เพิ่มขนาดเพื่อความแม่นยำ
        let canvasWidth = videoWidth;
        let canvasHeight = videoHeight;
        
        if (videoWidth > maxSize || videoHeight > maxSize) {
          const ratio = Math.min(maxSize / videoWidth, maxSize / videoHeight);
          canvasWidth = Math.floor(videoWidth * ratio);
          canvasHeight = Math.floor(videoHeight * ratio);
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        // วาดภาพจาก video ลงบน canvas
        context.drawImage(video, 0, 0, canvasWidth, canvasHeight);
        
        // ดึงข้อมูลภาพ
        const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
        
        // แสดง log ทุก 30 เฟรม (ประมาณ 1 วินาที)
        if (!window.frameCount) window.frameCount = 0;
        window.frameCount++;
        
        if (window.frameCount % 30 === 0) {
          console.log(`🔄 Frame ${window.frameCount}: Processing ${canvasWidth} x ${canvasHeight} (Original: ${videoWidth} x ${videoHeight})`);
        }
        
        // ใช้ jsQR ในการสแกน QR Code ด้วยการตั้งค่าที่หลากหลาย
        let code = null;
        
        // ลองสแกนด้วยการตั้งค่าต่างๆ เพื่อรองรับ QR Code ทุกแบบ
        const scanAttempts = [
          // การตั้งค่าพื้นฐาน
          { inversionAttempts: "dontInvert" },
          { inversionAttempts: "attemptBoth" },
          { inversionAttempts: "onlyInvert" },
          
          // การตั้งค่าสำหรับ QR Code ที่มีปัญหา
          { 
            inversionAttempts: "attemptBoth",
            canOverwriteImage: true
          },
          { 
            inversionAttempts: "onlyInvert",
            canOverwriteImage: true
          }
        ];
        
        // ลองสแกนด้วยการตั้งค่าต่างๆ
        for (let attempt of scanAttempts) {
          try {
            code = jsQR(imageData.data, imageData.width, imageData.height, attempt);
            if (code) {
              console.log('🎯 QR Code found with settings:', attempt);
              break;
            }
          } catch (error) {
            console.log('❌ Scan attempt failed with settings:', attempt, error);
          }
        }
        
        // หาก jsQR ไม่สามารถสแกนได้ ให้ลองใช้วิธีอื่น
        if (!code) {
          // ลองปรับความคมชัดของภาพ
          try {
            const enhancedImageData = enhanceImage(imageData);
            for (let attempt of scanAttempts) {
              code = jsQR(enhancedImageData.data, enhancedImageData.width, enhancedImageData.height, attempt);
              if (code) {
                console.log('🎯 QR Code found with enhanced image:', attempt);
                break;
              }
            }
          } catch (error) {
            console.log('Image enhancement failed:', error);
          }
        }
        
        if (code) {
          console.log('🎉 SUCCESS: Found QR code!');
          console.log('📊 QR Code details:', {
            data: code.data,
            length: code.data.length,
            location: code.location,
            size: code.size
          });
          
          setScanStatus('🎉 สแกนสำเร็จ! พบ QR Code แล้ว');
          
                  // แจ้งเตือนเมื่อสแกนเสร็จ
        try {
          // แจ้งเตือนในเบราว์เซอร์
          if ('Notification' in window && Notification.permission === 'granted') {
            let notificationBody = `พบข้อมูล: ${code.data.substring(0, 50)}${code.data.length > 50 ? '...' : ''}`;
            
            // เพิ่มข้อมูล API ถ้ามี
            if (attractionListId && orderTravelerId) {
              notificationBody += `\nAttraction ID: ${attractionListId}, Order Traveler ID: ${orderTravelerId}, Users Applications ID: ${user?.users_applications_id || 'N/A'}`;
            }
            
            new Notification('สแกน QR Code สำเร็จ!', {
              body: notificationBody,
              icon: '/favicon.ico',
              badge: '/favicon.ico'
            });
          }
            
            // เล่นเสียงแจ้งเตือน (ถ้าเบราว์เซอร์รองรับ)
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            
          } catch (error) {
            console.log('Notification or audio not supported:', error);
          }
          
          // วิเคราะห์ประเภทของข้อมูล
          let qrType = 'TEXT';
          let qrText = code.data;
          
          // ตรวจสอบประเภทของข้อมูล
          if (qrText.startsWith('http://') || qrText.startsWith('https://')) {
            qrType = 'URL';
          } else if (qrText.startsWith('mailto:')) {
            qrType = 'EMAIL';
            qrText = qrText.replace('mailto:', '');
          } else if (qrText.startsWith('tel:')) {
            qrType = 'PHONE';
            qrText = qrText.replace('tel:', '');
          } else if (qrText.startsWith('WIFI:')) {
            qrType = 'WIFI';
          } else if (qrText.startsWith('BEGIN:VCARD')) {
            qrType = 'VCARD';
          }
          
          // วิเคราะห์ข้อมูล QR Code เพื่อดึง attraction_list_id และ order_traveler_id
          let attractionListId = null;
          let orderTravelerId = null;
          
          try {
            // ลอง parse เป็น JSON ถ้าเป็นไปได้
            if (qrText.startsWith('{') && qrText.endsWith('}')) {
              const jsonData = JSON.parse(qrText);
              attractionListId = jsonData.attraction_list_id || jsonData.attractionListId;
              orderTravelerId = jsonData.order_traveler_id || jsonData.orderTravelerId;
            } else {
              // ลองหา pattern ของ attraction_list_id และ order_traveler_id ในข้อความ
              const attractionMatch = qrText.match(/attraction_list_id[:\s]*(\d+)/i);
              const orderMatch = qrText.match(/order_traveler_id[:\s]*(\d+)/i);
              
              if (attractionMatch) attractionListId = parseInt(attractionMatch[1]);
              if (orderMatch) orderTravelerId = parseInt(orderMatch[1]);
              
              // หากไม่มี pattern ให้ลองแปลงข้อความทั้งหมดเป็น order_traveler_id
              if (!orderTravelerId && !attractionListId) {
                // ตรวจสอบว่าข้อความเป็นตัวเลขหรือไม่
                if (/^\d+$/.test(qrText.trim())) {
                  orderTravelerId = parseInt(qrText.trim());
                  console.log('📝 Converting text to order_traveler_id:', orderTravelerId);
                }
              }
            }
          } catch (error) {
            console.log('Could not parse QR data as JSON, trying pattern matching...');
            
            // หาก parse JSON ไม่สำเร็จ ให้ลองแปลงข้อความเป็น order_traveler_id
            if (/^\d+$/.test(qrText.trim())) {
              orderTravelerId = parseInt(qrText.trim());
              console.log('📝 Converting text to order_traveler_id:', orderTravelerId);
            }
          }
          
          const qrData = {
            text: qrText,
            timestamp: new Date().toLocaleString('th-TH'),
            type: qrType,
            rawData: code.data,
            location: code.location,
            size: code.size,
            orderTravelerId: orderTravelerId,
            user_attraction_id: user.user_attraction_id
          };
          
          console.log('✅ QR Data processed successfully:', qrData);
          setScannedData(qrData);
          stopScanning();
          
          // ส่งข้อมูลไปยัง API เมื่อสแกนสำเร็จ
          if (orderTravelerId) {
            // หากไม่มี attraction_list_id ให้ใช้ค่า default หรือค่าจาก user data
            if (!attractionListId) {
              attractionListId = user?.attraction_list_id || 1; // ใช้ค่า default หรือค่าจาก user
            }
            
            console.log('🚀 Sending data to API...', { attractionListId, orderTravelerId, users_applications_id: user?.users_applications_id });
            sendScanDataToAPI(attractionListId, orderTravelerId);
          } else {
            alert('⚠️ QR Code ไม่สามารถใช้งานได้ กรุณาตรวจสอบ QR Code อีกครั้ง:')
          }
          
          return;
        } else {
          // แสดง log ทุก 60 เฟรม (ประมาณ 2 วินาที)
          if (window.frameCount % 60 === 0) {
            console.log(`🔍 Frame ${window.frameCount}: No QR code found in this frame`);
            console.log('📊 Image data:', {
              width: imageData.width,
              height: imageData.height,
              dataLength: imageData.data.length
            });
          }
        }
      } catch (error) {
        console.error('❌ Error processing QR code:', error);
      }
    } else {
      console.log('📺 Video readyState:', video.readyState, 'HAVE_ENOUGH_DATA:', video.HAVE_ENOUGH_DATA);
    }

    // วนลูปต่อไปถ้ายังสแกนอยู่
    if (isScanning) {
      animationFrameRef.current = requestAnimationFrame(detectQRCode);
    } else {
      console.log('🛑 Detection loop stopped: isScanning=', isScanning);
    }
  };

  // ฟังก์ชันสลับกล้องหน้าหลัง
  const switchCamera = async () => {
    if (cameras.length < 2) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // หยุดการสแกนปัจจุบันก่อน
      if (isScanning) {
        console.log('🔄 Stopping current scan before switching camera...');
        stopScanning();
        // รอให้การหยุดเสร็จสมบูรณ์
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // หากล้องถัดไป
      const currentIndex = cameras.findIndex(cam => cam.deviceId === selectedCamera);
      const nextIndex = (currentIndex + 1) % cameras.length;
      const nextCamera = cameras[nextIndex];
      
      console.log('🔄 Switching from camera:', selectedCamera, 'to:', nextCamera.deviceId);
      
      setSelectedCamera(nextCamera.deviceId);
      setCameraFacing(nextCamera.facing);
      
      // รอสักครู่เพื่อให้ระบบปล่อยทรัพยากรของกล้องเดิม
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // เริ่มการสแกนใหม่ด้วยกล้องใหม่
      if (isScanning) {
        console.log('🔄 Restarting scan with new camera...');
        await startScanning();
      }
      
      console.log('✅ Successfully switched to camera:', nextCamera.displayName);
    } catch (error) {
      console.error('❌ Error switching camera:', error);
      if (error.name === 'NotReadableError' || error.message?.includes('Device in use')) {
        setError('กล้องถูกใช้งาน กรุณาลองใหม่หรือรีเฟรชหน้าเว็บ');
        // ลองทำการ cleanup อัตโนมัติ
        await forceCleanup();
      } else {
        setError('ไม่สามารถสลับกล้องได้: ' + error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ฟังก์ชันปรับคุณภาพกล้อง
  const changeCameraQuality = async (quality) => {
    try {
      setCameraQuality(quality);
      if (isScanning) {
        console.log('🔄 Changing camera quality, stopping current scan...');
        stopScanning();
        // รอให้การหยุดเสร็จสมบูรณ์
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('🔄 Restarting scan with new quality settings...');
        await startScanning();
      }
    } catch (error) {
      console.error('❌ Error changing camera quality:', error);
      if (error.name === 'NotReadableError' || error.message?.includes('Device in use')) {
        setError('กล้องถูกใช้งาน กรุณาลองใหม่');
        await forceCleanup();
      }
    }
  };

  // ฟังก์ชันเปิด/ปิดแฟลช
  // ฟังก์ชันปรับปรุงภาพเพื่อเพิ่มความคมชัด
  const enhanceImage = (imageData) => {
    const { data, width, height } = imageData;
    const enhancedData = new Uint8ClampedArray(data);
    
    // ปรับความคมชัดด้วยการเพิ่ม contrast
    for (let i = 0; i < data.length; i += 4) {
      // ปรับ RGB values
      enhancedData[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.2 + 128));     // Red
      enhancedData[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.2 + 128)); // Green
      enhancedData[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.2 + 128)); // Blue
      // Alpha channel ไม่เปลี่ยนแปลง
    }
    
    return new ImageData(enhancedData, width, height);
  };

  const toggleFlash = () => {
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track && track.getCapabilities && track.getCapabilities().torch) {
        const newState = !flashEnabled;
        track.applyConstraints({
          advanced: [{ torch: newState }]
        }).then(() => {
          setFlashEnabled(newState);
        }).catch(error => {
          console.log('Flash not supported:', error);
        });
      }
    }
  };

  const handleScanResult = (data) => {
    setScannedData(data);
    stopScanning();
  };

  const resetScanner = () => {
    setScannedData(null);
    setError(null);
    setScanStatus('');
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('คัดลอกไปยังคลิปบอร์ดแล้ว');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('ไม่สามารถคัดลอกได้');
    }
  };

  // ฟังก์ชันส่งข้อมูลการสแกนไปยัง API
  const sendScanDataToAPI = async (attractionListId, orderTravelerId) => {
    try {
      console.log('📡 Sending scan data to API...', { attractionListId, orderTravelerId, users_applications_id: user?.users_applications_id });
      
      // ตรวจสอบข้อมูลก่อนส่ง
      if (!attractionListId || !orderTravelerId) {
        console.error('❌ Missing required data:', { attractionListId, orderTravelerId });
        setScanStatus('❌ ข้อมูลไม่ครบถ้วน');
        return;
      }
      
      if (!user?.users_applications_id) {
        console.warn('⚠️ No users_applications_id found in user data');
      }
      
      const requestBody = {
        order_traveler_id: orderTravelerId,
        user_attraction_id: user.user_attraction_id
      };
      
      setScanStatus('📡 กำลังส่งข้อมูลไปยัง API...');
      
      const response = await fetch(`${API_BASE_URL}/api/attraction/backoffice/scandatastatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API call successful:', result);
        
        // แสดงข้อความสำเร็จ
        setScanStatus('✅ ส่งข้อมูลไปยัง API สำเร็จ');
        
        // แจ้งเตือนผู้ใช้
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification({
            body: `Message: ${result.message}`,

          });
        }
        // แสดงข้อความยืนยันการสแกนสำเร็จ
        setTimeout(() => {
          try {
            const alertMessage = `🎉 QR Code scan successful`;
            // เพิ่มข้อมูล API ถ้ามี
            if (result.status === true && result.code === 200) {
              alert(`🎉 ${result.message}`);
            }else if (result.status === false && result.code === 400) {
              alert(`🎉 ${result.message}`);
            }else{
              alert(`🎉 ${result.message}`);
            }
          } catch (error) {
            console.error('Error creating alert message:', error);
            // แสดงข้อความแบบง่ายถ้าเกิด error
            alert(`🎉 You have already checked in to this location and cannot check in again.`);
          }
        }, 100);
      } else {
        const errorText = await response.message;
        // console.error('❌ API call failed:', response.status, errorText);
        
        
        
        // แจ้งเตือนผู้ใช้
        alert(`Status: ${response.status}\nError: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error sending data to API:', error);
      
      // แสดงข้อความ error
      setScanStatus('❌ เกิดข้อผิดพลาดในการส่งข้อมูล');
      
      // แจ้งเตือนผู้ใช้
      alert(`❌ เกิดข้อผิดพลาดในการส่งข้อมูล\nError: ${error.message}`);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Scan QR Code</h1>
                {scanStatus && (
                  <div className="mt-2 flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      scanStatus.includes('✅') ? 'bg-green-500' : 
                      scanStatus.includes('❌') ? 'bg-red-500' : 'bg-blue-500'
                    }`}></div>
                    <span className={`text-sm ${
                      scanStatus.includes('✅') ? 'text-green-600' : 
                      scanStatus.includes('❌') ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {scanStatus}
                    </span>
                  </div>
                )}
              </div>
              <Link 
                href="/"
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
                         {/* Camera Selection & Controls */}
             <div className="bg-white rounded-lg shadow-sm border p-6">
               <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                 <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                 </svg>
                 Camera Settings & Controls
               </h3>
               
               <div className="space-y-4">
                 {/* Camera Info */}
                 {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                   <div className="flex items-start space-x-3">
                     <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                     <div className="text-sm text-blue-800">
                       <p className="font-medium">Support multiple camera types.:</p>
                       <ul className="mt-1 space-y-1">
                         <li>• Webcam</li>
                         <li>• Mobile Camera</li>
                         <li>• External Camera</li>
                       </ul>
                     </div>
                   </div>
                 </div> */}
               
                 {/* Camera Controls */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-4">
                   {/* Camera Selection */}
                   {/* <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-700">Camera Selection</label>
                     <select
                       value={selectedCamera}
                       onChange={(e) => setSelectedCamera(e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                       disabled={isScanning}
                     >
                       {cameras.map((camera) => (
                         <option key={camera.deviceId || Math.random()} value={camera.deviceId || ''}>
                           {camera.displayName || camera.label || (camera.deviceId ? `กล้อง ${camera.deviceId.slice(0, 8)}...` : 'กล้องไม่ระบุชื่อ')}
                         </option>
                       ))}
                     </select>
                   </div> */}

                   {/* Camera Quality */}
                   <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-700">Camera Quality</label>
                     <select
                       value={cameraQuality}
                       onChange={(e) => changeCameraQuality(e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                       disabled={isScanning}
                     >
                       <option value="low">Low (Fast)</option>
                       <option value="medium">Medium (Balanced)</option>
                       <option value="high">High (Best)</option>
                     </select>
                   </div>

                   {/* Scan Mode */}
                   <div className="space-y-2">
                     <label className="text-sm font-medium text-gray-700">Scan Mode</label>
                     <select
                       value={scanMode}
                       onChange={(e) => setScanMode(e.target.value)}
                       className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                       disabled={isScanning}
                     >
                       <option value="auto">Auto (Recommended)</option>
                       <option value="manual">Manual</option>
                       <option value="continuous">Continuous</option>
                     </select>
                   </div>
                 </div>

                 {/* Quick Actions */}
                 <div className="flex flex-wrap gap-3 mb-4">
                   {/* <button
                     onClick={switchCamera}
                     disabled={cameras.length < 2 || isScanning}
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center"
                   >
                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                     </svg>
                     Switch Camera
                   </button> */}

                   <button
                     onClick={toggleFlash}
                     disabled={!isScanning}
                     className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                       flashEnabled 
                         ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                         : 'bg-gray-600 hover:bg-gray-700 text-white'
                     }`}
                   >
                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                     </svg>
                     {flashEnabled ? 'Flash ON' : 'Flash OFF'}
                   </button>

                   <button
                     onClick={getAvailableCameras}
                     className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center"
                     disabled={isScanning}
                   >
                     <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                     </svg>
                     Refresh Cameras
                   </button>
                 </div>
                 
                 {/* Camera Status */}
                 {cameras.length === 0 && (
                   <div className="text-center py-4">
                     <p className="text-gray-500 mb-2">No working camera found</p>
                     <button
                       onClick={getAvailableCameras}
                       className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                     >
                       Click to search for cameras
                     </button>
                   </div>
                 )}
                 
                 {cameras.length > 0 && (
                   <div className="space-y-2">
                     <div className="text-sm text-gray-600">
                       Found {cameras.length} camera(s)
                     </div>
                     
                     {/* Camera Details */}
                     <div className="bg-gray-50 rounded-lg p-3">
                       <div className="text-xs text-gray-600 space-y-2">
                         {cameras.map((camera, index) => (
                           <div key={camera.deviceId || index} className="flex items-center justify-between p-2 bg-white rounded border">
                             <div className="flex items-center space-x-2">
                               <span className="font-medium">
                                 {index + 1}. {camera.displayName || camera.label || 'กล้องไม่ระบุชื่อ'}
                               </span>
                               <span className={`px-2 py-1 rounded-full text-xs ${
                                 camera.cameraType === 'back' ? 'bg-blue-100 text-blue-800' :
                                 camera.cameraType === 'front' ? 'bg-green-100 text-green-800' :
                                 camera.cameraType === 'webcam' ? 'bg-purple-100 text-purple-800' :
                                 'bg-gray-100 text-gray-800'
                               }`}>
                                 {camera.cameraType === 'back' ? '📷 หลัง' :
                                  camera.cameraType === 'front' ? '📱 หน้า' :
                                  camera.cameraType === 'webcam' ? '💻 เว็บแคม' : '📹 อื่นๆ'}
                               </span>
                             </div>
                             <div className="text-right">
                               <div className="text-gray-500 text-xs">
                                 {camera.deviceId ? `${camera.deviceId.slice(0, 12)}...` : 'ไม่ระบุ ID'}
                               </div>
                               <div className="text-gray-400 text-xs">
                                 {camera.facing === 'environment' ? '🔍 หลัง' : 
                                  camera.facing === 'user' ? '👤 หน้า' : '❓ ไม่ระบุ'}
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   </div>
                 )}
               </div>
             </div>

            {/* Scanner Interface */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                </svg>
                Scan QR Code
              </h3>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600">{error}</p>
                  {/* Add retry button for camera errors */}
                  {(error.includes('กล้องถูกใช้งาน') || error.includes('Device in use') || error.includes('NotReadableError')) && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={retryCameraAccess}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        ลองใหม่ (Retry)
                      </button>
                      <button
                        onClick={forceCleanup}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center text-sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        รีเซ็ตกล้อง (Reset Camera)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Start Scanning Section */}
              {!isScanning && !scannedData && (
                <div className="text-center py-8">
                  <button
                    onClick={startScanning}
                    disabled={isLoading || cameras.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-lg font-medium transition-colors flex items-center mx-auto text-lg"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Start Scan
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Camera View - Always visible but hidden when not scanning */}
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    className={`w-full h-100 object-cover ${!isScanning ? 'hidden' : ''}`}
                    autoPlay
                    playsInline
                    muted
                  />
                  
                  {/* Placeholder when not scanning */}
                  {!isScanning && (
                    <div className="w-full h-100 bg-gray-100 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                          </svg>
                        </div>
                        <p className="text-gray-500">The camera will be displayed here when scanning begins.</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Camera Status Info - Always visible */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                    {videoRef.current ? (
                      <>
                        Size: {videoRef.current.videoWidth || 0} x {videoRef.current.videoHeight || 0}<br/>
                        State: {videoRef.current.readyState === 0 ? 'HAVE_NOTHING' : 
                                videoRef.current.readyState === 1 ? 'HAVE_METADATA' : 
                                videoRef.current.readyState === 2 ? 'HAVE_CURRENT_DATA' : 
                                videoRef.current.readyState === 3 ? 'HAVE_FUTURE_DATA' : 
                                videoRef.current.readyState === 4 ? 'HAVE_ENOUGH_DATA' : 'UNKNOWN'}
                      </>
                    ) : 'No video element'}
                  </div>
                  
                  {/* Scanning Overlay - Only visible when scanning */}
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-blue-500 rounded-lg relative">
                        {/* Corner indicators */}
                        <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-blue-500"></div>
                        <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-blue-500"></div>
                        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-blue-500"></div>
                        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-blue-500"></div>
                        
                        {/* Scanning line animation */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Controls - Different based on scanning state */}
                {!isScanning ? (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Click the "Start Scan" button to open the camera.</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">Place the QR Code in the square frame.</p>
                    
                    {/* Scan Status */}
                    {scanStatus && (
                      <div className={`mb-4 p-3 border rounded-lg ${
                        scanStatus.includes('สำเร็จ') || scanStatus.includes('เสร็จ') 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-blue-50 border-blue-200'
                      }`}>
                        <p className={`font-medium ${
                          scanStatus.includes('สำเร็จ') || scanStatus.includes('เสร็จ') 
                            ? 'text-green-800' 
                            : 'text-blue-800'
                        }`}>
                          {scanStatus}
                        </p>
                        <div className={`mt-2 text-xs ${
                          scanStatus.includes('สำเร็จ') || scanStatus.includes('เสร็จ') 
                            ? 'text-green-600' 
                            : 'text-blue-600'
                        }`}>
                          {scanStatus.includes('สำเร็จ') || scanStatus.includes('เสร็จ') 
                            ? '✅ การสแกนเสร็จสิ้นแล้ว - ข้อมูลแสดงด้านล่าง' 
                            : `กำลังประมวลผลภาพ: ${videoRef.current ? `${videoRef.current.videoWidth || 0} x ${videoRef.current.videoHeight || 0}` : 'N/A'}`
                          }
                        </div>
                        
                        {/* Real-time Data Processing Info */}
                        {/* {!scanStatus.includes('สำเร็จ') && !scanStatus.includes('เสร็จ') && (
                          <div className="mt-2 p-2 bg-white rounded border">
                            <div className="text-xs text-gray-600 space-y-1">
                              <div>🔄 กำลังประมวลผลภาพ...</div>
                              <div>📊 ขนาดภาพ: {videoRef.current ? `${videoRef.current.videoWidth || 0} x ${videoRef.current.videoHeight || 0}` : 'N/A'}</div>
                              <div>⚡ สถานะ: {videoRef.current ? 
                                videoRef.current.readyState === 4 ? 'พร้อมสแกน' : 
                                videoRef.current.readyState === 3 ? 'กำลังโหลด' : 
                                videoRef.current.readyState === 2 ? 'เริ่มต้น' : 
                                videoRef.current.readyState === 1 ? 'เมทาดาต้า' : 'ไม่มีข้อมูล' : 'ไม่มีกล้อง'}</div>
                              <div>🔍 การสแกน: กำลังค้นหา QR Code ในภาพ...</div>
                              <div>📈 เฟรมที่ประมวลผล: {Math.floor(Math.random() * 1000)}</div>
                              <div>🎯 เป้าหมาย: ค้นหา QR Code ในทุกเฟรม</div>
                              <div>⚙️ อัลกอริทึม: jsQR (3 รูปแบบการสแกน)</div>
                            </div>
                          </div>
                        )} */}
                      </div>
                    )}
                    
                    {/* Scan Progress */}
                    {/* <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">สถานะการสแกน:</span>
                        <span className="text-xs text-gray-500">
                          {videoRef.current ? 
                            videoRef.current.readyState === 4 ? 'พร้อมสแกน' : 
                            videoRef.current.readyState === 3 ? 'กำลังโหลด' : 
                            videoRef.current.readyState === 2 ? 'เริ่มต้น' : 
                            videoRef.current.readyState === 1 ? 'เมทาดาต้า' : 'ไม่มีข้อมูล' : 'ไม่มีกล้อง'}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: videoRef.current ? 
                              (videoRef.current.readyState / 4 * 100) + '%' : '0%' 
                          }}
                        ></div>
                      </div> */}
                      
                      {/* Processing Details */}
                      {/* <div className="mt-3 p-2 bg-white rounded border">
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                            <span>การประมวลผล: {videoRef.current && videoRef.current.readyState === 4 ? '✅ ทำงานปกติ' : '⏳ กำลังเตรียม'}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span>กล้อง: {videoRef.current ? '✅ เชื่อมต่อแล้ว' : '❌ ไม่ได้เชื่อมต่อ'}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                            <span>Stream: {streamRef.current ? '✅ เปิดใช้งาน' : '❌ ปิดอยู่'}</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-bounce"></div>
                            <span>QR Detection: กำลังค้นหา...</span>
                          </div>
                        </div>
                      </div>
                    </div> */}
                    
                    {/* Camera Info */}
                    {/* <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-xs text-gray-600 space-y-1">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <span>Camera: {videoRef.current ? '✅ เชื่อมต่อแล้ว' : '❌ ไม่ได้เชื่อมต่อ'}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                          <span>Stream: {streamRef.current ? '✅ เปิดใช้งาน' : '❌ ปิดอยู่'}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                          <span>Status: {videoRef.current ? 
                            videoRef.current.readyState === 4 ? 'Ready to scan' : 
                            videoRef.current.readyState === 3 ? 'Loading' : 
                            videoRef.current.readyState === 2 ? 'start' : 
                            videoRef.current.readyState === 1 ? 'Metadata' : 'No information' : 'No camera'}</span>
                        </div>
                      </div>
                    </div> */}
                    
                    <button
                      onClick={stopScanning}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Stop scanning
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden canvas for QR detection */}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Scan Results */}
            {isQRDataValid(scannedData) && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-lg">
                <div className="space-y-4">
                  {/* Success Header */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-6 h-6 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm font-medium text-green-800">Scan successful!</p>
                          <p className="text-xs text-green-600">Time: {scannedData.timestamp}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-green-600">ID: {Math.random().toString(36).substr(2, 9)}</div>
                        <div className="text-xs text-green-500 mt-1">✅ เสร็จสิ้น</div>
                      </div>
                    </div>
                    
                    {/* Success Animation */}
                    <div className="mt-3 p-2 bg-green-100 rounded-lg">
                      <div className="flex items-center text-green-700 text-sm">
                        <svg className="w-4 h-4 mr-2 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        The system has scanned the QR Code and processed the data.
                      </div>
                    </div>
                  </div>
                  
                  {/* QR Code Type */}
                  {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a1.994 1.994 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-800">Data type :</span>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {scannedData.type === 'URL' ? '🌐 ลิงก์เว็บไซต์' : 
                         scannedData.type === 'TEXT' ? '📝 ข้อความ' : 
                         scannedData.type === 'EMAIL' ? '📧 อีเมล' : 
                         scannedData.type === 'PHONE' ? '📞 เบอร์โทรศัพท์' : 
                         scannedData.type === 'WIFI' ? '📶 WiFi' : 
                         scannedData.type === 'VCARD' ? '👤 ข้อมูลติดต่อ' : 
                         scannedData.type}
                      </span>
                    </div>
                  </div> */}
                  
                  {/* Scanned Data - Enhanced Display */}
                  {/* <div className="bg-gray-50 border border-gray-200 rounded-lg p-4"> */}
                    {/* <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Scannable data:</span>
                      </div>
                    </div> */}
                  
                    
                    {/* Data Statistics */}
                    {/* <div className="mt-3 grid grid-cols-3 gap-4 text-xs text-gray-500">
                      <div className="text-center p-2 bg-gray-100 rounded">
                        <div className="font-medium">length</div>
                        <div className="text-lg text-gray-700">{scannedData?.text?.length || 0} character</div>
                      </div>
                      <div className="text-center p-2 bg-gray-100 rounded">
                        <div className="font-medium">type</div>
                        <div className="text-lg text-gray-700">{scannedData?.type || `I don't know.`}</div>
                      </div>
                      <div className="text-center p-2 bg-gray-100 rounded">
                        <div className="font-medium">QR size</div>
                        <div className="text-lg text-gray-700">
                          {scannedData?.size ? `${scannedData.size} x ${scannedData.size}` : 'N/A'}
                        </div>
                      </div>
                    </div> */}
                    
                    {/* QR Code Details */}
                    {/* {isQRDataValid(scannedData) && isLocationValid(scannedData.location) && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-xs text-blue-800 space-y-1">
                          <div className="font-medium">QR Code Details:</div>
                          <div>ตำแหน่งบนซ้าย: ({scannedData.location.topLeft.x}, {scannedData.location.topLeft.y})</div>
                          <div>ตำแหน่งบนขวา: ({scannedData.location.topRight.x}, {scannedData.location.topRight.y})</div>
                          <div>ตำแหน่งล่างซ้าย: ({scannedData.location.bottomLeft.x}, {scannedData.location.bottomLeft.y})</div>
                          <div>ตำแหน่งล่างขวา: ({scannedData.location.bottomRight.x}, {scannedData.location.bottomRight.y})</div>
                        </div>
                      </div>
                    )} */}
                  {/* </div> */}
                  
                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={resetScanner}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Rescan
                      </button>
                      
                      {scannedData?.type === 'URL' && (
                        <a
                          href={scannedData?.text}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium transition-colors text-center flex items-center justify-center"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Open the link
                        </a>
                      )}
                    </div>
                    
                    {/* Quick Actions */}
                    {scannedData?.type === 'EMAIL' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800 mb-2">ส่งอีเมลไปยัง:</p>
                        <a
                          href={`mailto:${scannedData?.text}`}
                          className="text-blue-600 hover:text-blue-800 font-medium break-all"
                        >
                          {scannedData?.text}
                        </a>
                      </div>
                    )}
                    
                    {scannedData?.type === 'PHONE' && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800 mb-2">โทรไปยัง:</p>
                        <a
                          href={`tel:${scannedData?.text}`}
                          className="text-blue-600 hover:text-blue-800 font-medium break-all"
                        >
                          {scannedData?.text}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
