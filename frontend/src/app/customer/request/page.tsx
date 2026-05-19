'use client';
import { useState, useEffect } from 'react';
import { useRequireRole } from '@/context/AuthContext';
import { Spinner } from '@nextui-org/react';
import { FiSend, FiCheckCircle, FiDollarSign, FiSmartphone, FiTruck, FiShoppingBag, FiPlus, FiTrash2, FiHash } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

interface Service {
  id: string;
  service_name: string;
  unit: string;
  price_per_unit: number;
  category: string;
}

interface EstRow {
  id: number;
  serviceId: string;
  type: string;
  qty: string;
}

const LAUNDRY_TYPES = ['White', 'Colored', 'Blanket'];

const isDeliveryEnabled = (value: unknown) =>
  value === true || value === 1 || value === '1' || value === 't' || value === 'true';

export default function CustomerRequestPage() {
  const { user, loading: authLoading } = useRequireRole('customer');
  const router = useRouter();
  const [services, setServices]           = useState<Service[]>([]);
  const [loading, setLoading]             = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'GCash' | 'Manual'>('GCash');
  const [orderType, setOrderType]         = useState<'Pickup' | 'Delivery'>('Pickup');
  const [submitting, setSubmitting]       = useState(false);
  const [sent, setSent]                   = useState(false);
  const [refCode, setRefCode]             = useState('');
  const [rows, setRows]                   = useState<EstRow[]>([
    { id: 1, serviceId: '', type: 'Colored', qty: '' },
  ]);
  const [refNum, setRefNum]               = useState('');
  const [shop, setShop]                   = useState<any>(null);
  const [deliveryAddress, setDeliveryAddress] = useState('');

  useEffect(() => {
    if (user) {
      fetch('/api/customer/request_order.php')
        .then(r => r.json())
        .then(res => { 
          if (res.success) {
            setServices(res.data);
            setShop(res.shop);
            if (res.shop?.address) setDeliveryAddress(res.shop.address);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  const addRow = () =>
    setRows(prev => [...prev, { id: Date.now(), serviceId: '', type: 'Colored', qty: '' }]);

  const removeRow = (id: number) =>
    setRows(prev => prev.filter(r => r.id !== id));

  const updateRow = (id: number, field: keyof EstRow, value: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));

  const getSubtotal = (row: EstRow) => {
    const svc = services.find(s => s.id === row.serviceId);
    const q = parseFloat(row.qty) || 0;
    return svc ? svc.price_per_unit * q : 0;
  };

  const grandTotal = rows.reduce((sum, r) => sum + getSubtotal(r), 0) + (orderType === 'Delivery' ? (parseFloat(shop?.delivery_fee) || 0) : 0);

  const buildNotes = () =>
    rows
      .filter(r => r.serviceId && r.qty)
      .map(r => {
        const svc = services.find(s => s.id === r.serviceId);
        return `${r.type}: ${r.qty} ${svc?.unit === 'per_kg' ? 'kg' : 'pcs'} of ${svc?.service_name}`;
      })
      .join(' | ');

  const handleSubmit = async () => {
    // validation
    if (!rows.some(r => r.serviceId && parseFloat(r.qty) > 0)) { 
      alert('Please add at least one service to your request.'); 
      return; 
    }

    if (paymentMethod === 'GCash') {
      const cleanRef = refNum.trim();
      if (!cleanRef) {
        alert('Please enter your GCash Reference Number.');
        return;
      }
      if (cleanRef.length !== 13 || !/^\d+$/.test(cleanRef)) {
        alert('The GCash Reference Number must be exactly 13 digits.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/request_order.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: orderType, 
          payment_method: paymentMethod, 
          notes: buildNotes(),
          reference_number: refNum,
          delivery_address: orderType === 'Delivery' ? deliveryAddress : '',
          delivery_fee: orderType === 'Delivery' ? (shop?.delivery_fee || 0) : 0,
          total_amount: grandTotal
        }),
      });
      const data = await res.json();
      if (data.success) { setRefCode(data.ref); setSent(true); }
      else alert(data.message || 'Failed to send request');
    } catch { alert('Network error'); }
    finally { setSubmitting(false); }
  };

  if (authLoading || loading) return <div className="flex justify-center p-20"><Spinner size="lg" /></div>;

  // Success screen
  if (sent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-emerald-600" />
          <div className="p-8 flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center">
              <FiCheckCircle className="text-emerald-500" size={36} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Request Submitted!</h2>
              <p className="text-slate-500 text-sm mt-1.5">
                Waiting for staff at <strong>{user?.shop_name}</strong> to accept your request.
              </p>
            </div>
            <div className="w-full bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Reference Code</p>
              <p className="font-black text-emerald-900 text-2xl font-mono mt-1">{refCode}</p>
              <p className="text-xs text-emerald-600 mt-1">Show this at the counter</p>
            </div>
            <p className="text-xs text-slate-400 italic">You'll see updates on your dashboard once staff accepts.</p>
            <button
              onClick={() => router.push('/customer/dashboard')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeColors: Record<string, string> = {
    White:   'bg-slate-100 text-slate-700 border-slate-300',
    Colored: 'bg-blue-50 text-blue-700 border-blue-300',
    Blanket: 'bg-amber-50 text-amber-700 border-amber-300',
  };
  const typeActive: Record<string, string> = {
    White:   'bg-slate-700 text-white border-slate-700',
    Colored: 'bg-blue-600 text-white border-blue-600',
    Blanket: 'bg-amber-500 text-white border-amber-500',
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Request Laundry</h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Submit a request to <strong>{user?.shop_name}</strong> — staff will confirm and weigh your items.
        </p>
      </div>
      {/* Step 1: Order Type */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
          <p className="font-semibold text-slate-800 text-sm">How will you drop off your laundry?</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'Pickup',   label: 'Walk-in / Pickup', icon: FiShoppingBag, desc: 'Bring to the shop' },
            { value: 'Delivery', label: 'Delivery',          icon: FiTruck,       desc: 'We pick up from you' },
          ].map(({ value, label, icon: Icon, desc }) => {
            const isAvailable = value === 'Pickup' || isDeliveryEnabled(shop?.delivery_available);
            
            return (
              <button 
                key={value} 
                disabled={!isAvailable}
                onClick={() => setOrderType(value as any)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                  !isAvailable 
                    ? 'opacity-40 grayscale cursor-not-allowed border-slate-100 bg-slate-50'
                    : orderType === value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <Icon size={22} />
                <div>
                  <p className="font-bold text-sm">{label}</p>
                  <p className="text-xs opacity-70">{desc}</p>
                  {!isAvailable && <p className="text-[10px] text-red-500 font-bold mt-1 uppercase">Unavailable</p>}
                </div>
              </button>
            );
          })}
        </div>

        {/* Delivery Unavailable Message */}
        {shop && !isDeliveryEnabled(shop.delivery_available) && (
          <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-lg">
            <span className="text-red-500 text-xs">⚠️</span>
            <p className="text-[10px] text-red-600 font-semibold">Delivery services are temporarily unavailable at this shop.</p>
          </div>
        )}

        {/* Delivery Address Input */}
        {orderType === 'Delivery' && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
              <label className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                Delivery / Pickup Location
              </label>
              <div className="relative">
                <FiTruck className="absolute left-3 top-3 text-blue-400" size={14} />
                <textarea
                  placeholder="Enter your complete address..."
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={2}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-blue-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                />
              </div>
              {shop?.delivery_fee > 0 && (
                <p className="text-[10px] text-blue-500 font-semibold italic">
                  Note: A delivery fee of ₱{parseFloat(shop.delivery_fee).toFixed(2)} will be added.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Payment Method */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
          <p className="font-semibold text-slate-800 text-sm">Preferred payment method</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'GCash',  label: 'GCash', icon: FiSmartphone, desc: 'Pay via GCash',  active: 'border-emerald-500 bg-emerald-50 text-emerald-700' },
            { value: 'Manual', label: 'Cash',  icon: FiDollarSign, desc: 'Pay in person',  active: 'border-amber-500 bg-amber-50 text-amber-700' },
          ].map(({ value, label, icon: Icon, desc, active }) => (
            <button key={value} onClick={() => setPaymentMethod(value as any)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                paymentMethod === value ? active : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              <Icon size={22} />
              <div>
                <p className="font-bold text-sm">{label}</p>
                <p className="text-xs opacity-70">{desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* GCash Reference Input */}
        {paymentMethod === 'GCash' && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
            {/* Shop GCash Details */}
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Send payment to:</p>
                <p className="text-sm font-bold text-slate-800">{shop?.gcash_name || 'N/A'}</p>
                <p className="text-xs font-medium text-emerald-700">{shop?.gcash_number || 'N/A'}</p>
              </div>
              <div className="p-3 bg-white rounded-xl border border-emerald-100 text-emerald-600 shadow-sm">
                <FiSmartphone size={24} />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                GCash Reference Number
              </label>
              <div className="relative">
                <FiHash className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" size={14} />
                <input
                  type="text"
                  placeholder="Enter 13-digit ref number"
                  value={refNum}
                  onChange={(e) => setRefNum(e.target.value.replace(/\D/g, ''))}
                  maxLength={13}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-emerald-200 rounded-lg text-sm font-medium text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
              </div>
              <p className="text-[10px] text-rose-500 italic font-bold">Required: Must be exactly 13 digits to proceed.</p>
            </div>
          </div>
        )}
      </div>

      {/* Step 3: Estimation Calculator */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-lg text-blue-600"><FiHash size={14} /></div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Estimation Calculator</p>
                <p className="text-xs text-slate-400">Optional — add multiple laundry types</p>
              </div>
            </div>
          </div>
          <button onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-all"
          >
            <FiPlus size={12} /> Add Row
          </button>
        </div>

        <div className="p-4 space-y-3">
          {rows.map((row, idx) => {
            const svc = services.find(s => s.id === row.serviceId);
            const subtotal = getSubtotal(row);
            return (
              <div key={row.id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                {/* Row header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Item {idx + 1}</span>
                  {rows.length > 1 && (
                    <button onClick={() => removeRow(row.id)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  )}
                </div>

                {/* Laundry Type pills */}
                <div className="flex gap-2">
                  {LAUNDRY_TYPES.map(t => (
                    <button key={t} onClick={() => updateRow(row.id, 'type', t)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                        row.type === t ? typeActive[t] : typeColors[t]
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Service + Qty */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Service</label>
                    <select
                      value={row.serviceId}
                      onChange={e => updateRow(row.id, 'serviceId', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                    >
                      <option value="">— Select —</option>
                      {services.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.service_name} ₱{parseFloat(s.price_per_unit.toString()).toFixed(0)}/{s.unit === 'per_kg' ? 'kg' : 'pc'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                      {svc?.unit === 'per_kg' ? 'Weight (kg)' : 'Qty (pcs)'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={row.qty}
                      onChange={e => updateRow(row.id, 'qty', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>
                </div>

                {/* Row subtotal */}
                {subtotal > 0 && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-xs text-slate-400 font-medium">{row.type} subtotal</span>
                    <span className="text-sm font-bold text-blue-600">₱{subtotal.toFixed(2)}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Grand Total */}
          <div className={`rounded-xl p-4 flex items-center justify-between transition-all ${
            grandTotal > 0 ? 'bg-blue-600' : 'bg-slate-100 border border-slate-200'
          }`}>
            <div>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${grandTotal > 0 ? 'text-blue-200' : 'text-slate-400'}`}>
                Estimated Grand Total
              </p>
              <p className={`text-3xl font-black mt-0.5 ${grandTotal > 0 ? 'text-white' : 'text-slate-300'}`}>
                ₱{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              {grandTotal > 0 && (
                <p className="text-blue-200 text-xs mt-0.5">{rows.filter(r => r.serviceId && r.qty).length} item(s)</p>
              )}
            </div>
            <div className={`p-3 rounded-xl ${grandTotal > 0 ? 'bg-blue-500' : 'bg-slate-200'}`}>
              <FiHash size={20} className={grandTotal > 0 ? 'text-white' : 'text-slate-400'} />
            </div>
          </div>
        </div>
      </div>

      {/* Info notice */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
        <span className="text-blue-500 shrink-0 mt-0.5">ℹ️</span>
        <p className="text-xs text-blue-700 font-medium">
          Actual weight and pricing will be confirmed by staff when you bring your clothes. This is just a heads-up request.
        </p>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 transition-all text-sm"
      >
        {submitting
          ? <><Spinner size="sm" color="white" /> Submitting...</>
          : <><FiSend size={16} /> Submit Laundry Request</>
        }
      </button>
    </div>
  );
}
