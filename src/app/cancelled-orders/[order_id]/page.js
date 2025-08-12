"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrderDetailPage() {
  const { order_id } = useParams();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API_BASE_URL = process.env.API_BASE_URL;
  useEffect(() => {
    async function fetchOrder() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/hotels/backoffice/orderroomlist/${order_id}`);
        if (!res.ok) throw new Error("Order not found");
        const result = await res.json();
        // ถ้าเป็น array ให้ใช้ตรงๆ ถ้าเป็น object ให้แปลงเป็น array
        setRooms(Array.isArray(result.data || result) ? (result.data || result) : [(result.data || result)]);
      } catch (err) {
        setError("ไม่พบข้อมูลคำสั่งซื้อหรือเกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    }
    if (order_id) fetchOrder();
  }, [order_id]);

  if (loading) return <div className="p-8 text-center text-lg text-gray-500">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!rooms || rooms.length === 0) return <div className="p-8 text-center text-gray-500">ไม่พบข้อมูลคำสั่งซื้อ</div>;

  // ใช้ข้อมูลลูกค้าจากห้องแรก
  const order = rooms[0];

  // แปลง status เป็นข้อความ
  function getStatusText(status) {
    switch (status) {
      case 1: return "Confirmed";
      case 2: return "Pending";
      case 3: return "Cancelled";
      case 4: return "Completed";
      default: return "Unknown";
    }
  }
  const getStatusConfirmedColor = (status_confirm) => {
    if(status_confirm === 4){
        return 'bg-green-100 text-green-900 border-green-300';
    }else if(status_confirm === 2){
        return 'bg-yellow-100 text-yellow-900 border-yellow-300';
    }else if(status_confirm === 3){
        return 'bg-red-100 text-red-900 border-red-300';
    }else if(status_confirm === 1){
        return 'bg-blue-100 text-blue-900 border-blue-300';
    }else{
        return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 bg-gradient-to-br from-white via-gray-50 to-gray-100 rounded-3xl shadow-2xl mt-10 border border-gray-200">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-8 tracking-tight text-center">
        Order <span className="text-indigo-600">#{order.number_order || order_id}</span>
      </h1>

      <div className="grid md:grid-cols-2 gap-8 mb-10">
        {/* Customer Info */}
        <div className="bg-white/80 rounded-2xl p-6 shadow border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 tracking-wide">Customer</h2>
          <div className="space-y-2 text-gray-600 text-base">
            <div><span className="font-medium">Name:</span> {order.firstname} {order.lastname}</div>
            <div><span className="font-medium">Email:</span> {order.email || '-'}</div>
            <div><span className="font-medium">Phone:</span> {order.phone_number || '-'}</div>
            <div><span className="font-medium">Order No:</span> {order.number_order}</div>
            <div><span className="font-medium">Created:</span> {order.created_at ? new Date(order.created_at).toLocaleString() : '-'}</div>
          </div>
        </div>
        {/* Order Info */}
        <div className="bg-white/80 rounded-2xl p-6 shadow border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-700 mb-4 tracking-wide">Order Info</h2>
          <div className="space-y-2 text-gray-600 text-base">
            <div>
              <span className="font-medium">Status:</span>
              <span className={`ml-2 px-3 py-1 rounded-full text-xs font-bold shadow-sm border transition-all ${getStatusConfirmedColor(order.status)}`}>{getStatusText(order.status)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rooms Booked */}
      <div className="mb-10">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 tracking-wide">Rooms Booked</h2>
        <div className="overflow-x-auto rounded-2xl shadow border border-gray-100 bg-white/90">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gradient-to-r from-indigo-50 to-white">
                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Room Code</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Room Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-indigo-700 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {rooms.map((room, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/60 transition">
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800">{room.room_code || '-'}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800">{room.room_name || '-'}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800">
                    {room.check_In ? new Date(room.check_In).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800">
                    {room.check_Out ? new Date(room.check_Out).toLocaleDateString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '-'}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-indigo-700 font-semibold">{room.initial_price ? `¥${parseFloat(room.initial_price).toLocaleString()}` : '-'}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-800">{getStatusText(room.status)}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">{room.created_at ? new Date(room.created_at).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <Link
          href="/cancelled-orders"
          className="inline-block bg-gradient-to-r from-indigo-600 to-indigo-500 text-white px-8 py-2 rounded-full font-semibold shadow-lg hover:from-indigo-700 hover:to-indigo-600 transition text-base"
        >
          ← Back
        </Link>
      </div>
    </div>
  );
} 