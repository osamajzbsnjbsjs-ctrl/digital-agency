"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Phone, 
  MapPin, 
  User, 
  Euro,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface Order {
  id: number;
  created_at: string;
  product_name: string;
  price_eur: number;
  recipient_name: string;
  recipient_phone: string;
  recipient_city: string;
  recipient_address?: string;
  payment_status: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // جلب الطلبات من Supabase
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error fetching orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // تحديث حالة الطلب (مثلاً: مدفوع، تم التسليم)
  const updateOrderStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: newStatus })
      .eq('id', id);

    if (!error) {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, payment_status: newStatus } : o));
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 font-sans p-6 sm:p-10" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* الهيدر العلوي للوحة التحكم */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Sanad Admin Panel</span>
            </div>
            <h1 className="text-3xl font-black text-white font-serif">إدارة طلبات الزبائن</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 px-4 py-2.5 rounded-2xl text-xs font-bold transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث البيانات</span>
            </button>

            <Link
              href="/"
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs transition"
            >
              <span>الرجوع للموقع</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* كروت الإحصائيات السريعة */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl">
            <span className="text-xs text-slate-400 block mb-1 font-medium">إجمالي الطلبات</span>
            <span className="text-3xl font-black text-white font-mono">{orders.length}</span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl">
            <span className="text-xs text-slate-400 block mb-1 font-medium">الطلبات المكتملة</span>
            <span className="text-3xl font-black text-emerald-400 font-mono">
              {orders.filter(o => o.payment_status === 'completed' || o.payment_status === 'paid').length}
            </span>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl">
            <span className="text-xs text-slate-400 block mb-1 font-medium">إجمالي المبيعات باليورو</span>
            <span className="text-3xl font-black text-amber-400 font-mono">
              €{orders.reduce((sum, o) => sum + Number(o.price_eur || 0), 0)}
            </span>
          </div>
        </div>

        {/* جدول الطلبات */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">جاري تحميل الطلبات...</div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">لا توجد أي طلبات مستلمة حتى الآن.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-4">رقم الطلب</th>
                    <th className="p-4">المنتج</th>
                    <th className="p-4">السعر</th>
                    <th className="p-4">اسم المستلم في سوريا</th>
                    <th className="p-4">رقم الواتساب</th>
                    <th className="p-4">المحافظة والعنوان</th>
                    <th className="p-4">حالة الطلب</th>
                    <th className="p-4">تغيير الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-800/30 transition">
                      <td className="p-4 font-mono font-bold text-slate-400">#{order.id}</td>
                      <td className="p-4 font-bold text-white">{order.product_name}</td>
                      <td className="p-4 font-mono font-black text-amber-400">€{order.price_eur}</td>
                      <td className="p-4 font-semibold text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.recipient_name}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono dir-ltr text-right">
                        <a 
                          href={`https://wa.me/${order.recipient_phone?.replace(/[^0-9]/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-emerald-400 hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{order.recipient_phone}</span>
                        </a>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{order.recipient_city} - {order.recipient_address || 'بدون تفاصيل'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${
                          order.payment_status === 'completed' || order.payment_status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : order.payment_status === 'delivered'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {order.payment_status === 'pending' ? 'قيد الانتظار' :
                           order.payment_status === 'paid' ? 'تم الدفع' :
                           order.payment_status === 'delivered' ? 'تم التوصيل' : order.payment_status}
                        </span>
                      </td>
                      <td className="p-4">
                        <select
                          value={order.payment_status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs text-white rounded-xl p-2 outline-none focus:border-emerald-500"
                        >
                          <option value="pending">قيد الانتظار</option>
                          <option value="paid">تم الدفع</option>
                          <option value="delivered">تم التوصيل وتسليم الهدية</option>
                          <option value="canceled">ملغي</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}