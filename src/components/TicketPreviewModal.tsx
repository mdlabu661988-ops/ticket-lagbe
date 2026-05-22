import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import { motion } from 'motion/react';
import { generateTicketPDF } from '../lib/pdfGenerator';
import { toast } from 'sonner';

interface TicketPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  language: string;
  t: any;
}

export const TicketPreviewModal: React.FC<TicketPreviewModalProps> = ({
  isOpen,
  onClose,
  booking,
  language,
  t,
}) => {
  if (!isOpen || !booking) return null;

  const isBn = language === 'bn';

  // Standardize the fields cleanly with strong fallback options
  const displayPNR = booking.id || booking.ticketId || 'TL-MOCK123';
  const rawId = displayPNR.startsWith('BK-') ? displayPNR.replace('BK-', '') : (booking.realId || booking.id);
  
  const fromCity = booking.fromCity || booking.route?.split(' to ')[0] || 'Dhaka';
  const toCity = booking.toCity || booking.route?.split(' to ')[1] || 'Khagrachari';
  const busName = booking.busName || booking.bus || booking.bus_name || 'Green Line Paribahan';
  const passengerName = booking.passenger_name || booking.name || booking.passenger || 'Passenger';
  const phoneNumber = booking.phone_number || booking.phone || 'N/A';
  const seats = Array.isArray(booking.seats) 
    ? booking.seats 
    : (typeof booking.seats === 'string' ? booking.seats.split(', ') : ['A1', 'A2']);
  
  const journeyDateStr = booking.travel_date || booking.travelDate || booking.journeyDate || booking.date || '2026-05-20';
  const departureTime = booking.time || booking.departure || 'N/A';
  const amountStr = String(booking.amount || booking.price || '800').replace(/[৳, ]/g, '');
  const basePriceValue = parseFloat(amountStr) || 800;

  const feeCharged = 172.00;
  const insuranceAmount = 40.00;
  const totalAmount = basePriceValue; // Or basePriceValue + feeCharged + insuranceAmount if break down is supported

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const day = d.getDate();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
      }
    } catch (e) {}
    return dateStr;
  };

  const getReportingTime = (departureStr: string) => {
    if (!departureStr || departureStr === 'N/A') return 'N/A';
    try {
      const match = departureStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let hours = parseInt(match[1]);
        let minutes = parseInt(match[2]);
        const ampm = match[3].toUpperCase();
        
        minutes -= 20;
        if (minutes < 0) {
          minutes += 60;
          hours -= 1;
        }
        if (hours <= 0) {
          hours = 12;
        }
        
        const pad = (num: number) => num.toString().padStart(2, '0');
        return `${hours}:${pad(minutes)} ${ampm}`;
      }
    } catch (e) {}
    return departureStr;
  };

  const handleDownloadPdf = async () => {
    const bookingData = {
      ticketId: displayPNR,
      realId: rawId,
      name: passengerName,
      phone: phoneNumber,
      fromCity,
      toCity,
      route: `${fromCity} to ${toCity}`,
      seats,
      busName,
      departure: departureTime,
      journeyDate: journeyDateStr,
      price: Math.ceil(basePriceValue / (seats.length || 1)),
      appliedDiscount: 0,
      totalAmount,
      paymentMethod: booking.paymentMethod || booking.payment_method || 'Online',
      counter: booking.counter || 'SAYEDABAD 11 NO COUNTER'
    };

    try {
      await generateTicketPDF(bookingData, language, t);
    } catch (err) {
      toast.error(isBn ? 'ডাউনলোড করতে ব্যর্থ হয়েছে।' : 'Download failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-100"
      >
        {/* Modal Header */}
        <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              {isBn ? 'টিকেটের পূর্বরূপ (Preview)' : 'Ticket Preview'}
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              {isBn ? `বুকিং আইডি: ${displayPNR}` : `Booking ID: ${displayPNR}`}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Canvas Container */}
        <div className="flex-1 overflow-y-auto p-8 justify-center bg-slate-100">
          
          {/* Main Visual Ticket Card mimicking the paper print EXACTLY */}
          <div className="max-w-[760px] mx-auto bg-white border border-slate-300 rounded-xl overflow-hidden shadow-lg p-1.5">
            <div className="border border-slate-950 rounded-lg overflow-hidden bg-white">
              
              {/* Green Header strip */}
              <div className="bg-emerald-600 text-white p-5 flex flex-col md:flex-row justify-between items-center border-b border-emerald-700 gap-4">
                <div className="flex items-center gap-4">
                  {/* Blue Bus Square Icon */}
                  <div className="w-14 h-14 bg-slate-950 rounded-lg flex items-center justify-center border border-white overflow-hidden p-1 shrink-0">
                    <img 
                      referrerPolicy="no-referrer"
                      src="/src/assets/images/blue_bus_logo_1779299416679.png" 
                      className="w-full h-full object-contain" 
                      alt="Bus Logo"
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-black tracking-tight">{isBn ? 'টিকিট লাগবে' : 'Ticket Lagbe'}</h1>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-slate-100 opacity-90">Your Journey, Our Commitment</p>
                  </div>
                </div>
                <div className="text-right md:max-w-xs text-xs text-slate-100 leading-tight">
                  <p className="font-extrabold text-[13px] text-white">TICKET LAGBE (টিকিট লাগবে)</p>
                  <p className="mt-1">{isBn ? 'প্রধান কার্যালয়: হোল্ডিং-৪৫, রোড-১২, সায়দাবাদ বাস টার্মিনাল, ঢাকা' : 'Head Office: Holding-45, Road-12, Sayedabad, Dhaka'}</p>
                  <p className="mt-0.5">{isBn ? 'সহায়তা: ০৯৬১৩-৪২০৫২০ | support@ticketlagbe.com' : 'Support: 09613-420520 | support@ticketlagbe.com'}</p>
                </div>
              </div>

              {/* Main Ticket Layout Table */}
              <div className="p-6">
                
                {/* 1. Details Table */}
                <div className="border border-slate-950 rounded-md overflow-hidden mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 text-xs leading-relaxed">
                    {/* Column 1 */}
                    <div className="p-4 border-b md:border-b-0 md:border-r border-slate-950 space-y-2">
                      <div className="font-mono text-[13px]">
                        <span className="font-extrabold">PNR : </span>
                        <span className="font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{displayPNR}</span>
                      </div>
                      <div>
                        <span className="font-bold">From : </span>
                        <span>{fromCity}</span>
                      </div>
                      <div>
                        <span className="font-bold">Boarding : </span>
                        <span className="text-[11px] font-medium">{booking.counter || 'SAYEDABAD 11 NO COUNTER'}</span>
                      </div>
                      <div>
                        <span className="font-bold">Departure : </span>
                        <span>{departureTime}</span>
                      </div>
                      <div>
                        <span className="font-bold">Booked On : </span>
                        <span>{formatDate(booking.booking_date || new Date().toISOString())}</span>
                      </div>
                    </div>

                    {/* Column 2 */}
                    <div className="p-4 border-b md:border-b-0 md:border-r border-slate-950 space-y-2">
                      <div>
                        <span className="font-bold">Trip Date : </span>
                        <span className="font-extrabold text-blue-900">{formatDate(journeyDateStr)}</span>
                      </div>
                      <div>
                        <span className="font-bold">To : </span>
                        <span>{toCity}</span>
                      </div>
                      <div>
                        <span className="font-bold">Dropping : </span>
                        <span>{toCity.toUpperCase()} CENTRAL STATION</span>
                      </div>
                      <div>
                        <span className="font-bold">Reporting : </span>
                        <span className="font-extrabold">{getReportingTime(departureTime)}</span>
                      </div>
                      <div>
                        <span className="font-bold">Booked By : </span>
                        <span>Web User</span>
                      </div>
                    </div>

                    {/* Column 3 - Payment info background */}
                    <div className="p-4 bg-slate-50 space-y-2 text-[11px]">
                      <div className="border-b border-slate-400 pb-1.5 mb-1.5">
                        <strong className="text-slate-800 uppercase tracking-wider">Payment Details</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ticket Price :</span>
                        <span>BDT {(basePriceValue - 212 > 0 ? basePriceValue - 212 : basePriceValue).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">+ Fee Charged :</span>
                        <span>BDT {feeCharged.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pb-1.5 border-b border-slate-200 border-dashed">
                        <span className="text-slate-500">+ Insurance Amount :</span>
                        <span>BDT {insuranceAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-black text-sm text-slate-900 pt-1">
                        <span>Total Amount :</span>
                        <span className="text-blue-700">BDT {totalAmount.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black tracking-wider uppercase border ${
                          booking.status === 'Reserved'
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          {booking.status === 'Reserved' 
                            ? (isBn ? 'Pay Later (বুকড)' : 'RESERVED (PAY LATER)') 
                            : `PAID VIA ${String(booking.paymentMethod || booking.payment_method || 'Online').toUpperCase()}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Passenger Rows table */}
                <div className="border border-slate-950 rounded-md overflow-hidden mb-6 text-xs text-left">
                  <div className="bg-slate-100 border-b border-slate-950 p-2 text-slate-800 font-extrabold grid grid-cols-2">
                    <div>Passenger</div>
                    <div>Seat(s)</div>
                  </div>
                  <div className="p-3 grid grid-cols-2 items-center text-sm">
                    <div className="font-extrabold text-slate-900 uppercase">
                      {passengerName}
                    </div>
                    <div className="font-mono flex flex-wrap gap-1.5">
                      {seats.map((seat: string, i: number) => (
                        <span key={i} className="inline-block border border-slate-300 bg-slate-50 px-2 py-0.5 rounded font-bold text-blue-900 text-xs">
                          [{seat}]
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Detailed row block */}
                <div className="border border-slate-300 rounded-lg p-5 bg-stone-50 md:grid md:grid-cols-2 gap-6 space-y-4 md:space-y-0 mb-6 text-sm text-left">
                  <div className="space-y-1 border-b md:border-b-0 md:border-r border-dashed border-slate-300 pb-4 md:pb-0 md:pr-4">
                    <h4 className="text-[11px] font-extrabold text-amber-700 uppercase tracking-widest border-b border-amber-100 pb-1 mb-2">যাত্রীর বিবরণ</h4>
                    <p className="font-black text-slate-900 leading-tight">{passengerName}</p>
                    <p className="text-xs font-bold text-slate-500 font-mono">{phoneNumber}</p>
                  </div>
                  <div className="space-y-1 md:pl-2">
                    <h4 className="text-[11px] font-extrabold text-blue-800 uppercase tracking-widest border-b border-blue-100 pb-1 mb-2">ভ্রমণের তথ্য</h4>
                    <p className="font-black text-slate-900 leading-tight">{fromCity} {isBn ? 'থেকে' : 'to'} {toCity}</p>
                    <p className="text-xs font-bold text-slate-600">
                      {isBn ? 'আসনে' : 'Seat'}: <span className="text-emerald-700 font-black">{seats.join(', ')}</span>
                    </p>
                  </div>
                </div>

                {/* 4. Instructions list */}
                <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-lg text-xs text-left mb-6">
                  <h3 className="font-black text-emerald-800 text-[13px] border-b border-emerald-200 pb-1.5 mb-2 flex items-center gap-1.5">
                    গুরুত্বপূর্ণ নির্দেশনা:
                  </h3>
                  <ul className="space-y-1.5 text-emerald-950 font-medium">
                    <li>• ভ্রমণের সময় এই টিকিটের একটি কপি (প্রিন্ট বা ডিজিটাল) অবশ্যই সাথে রাখুন।</li>
                    <li>• বাস ছাড়ার অন্তত ৩০ মিনিট আগে নির্ধারিত ডিপার্চার কাউন্টারে উপস্থিত হোন।</li>
                    <li>• এই টিকিটটি হস্তান্তরযোগ্য নয়, নিরাপত্তা যাচাইয়ের জন্য কাউন্টার স্টাফকে পরিচয়পত্র দেখাতে হবে।</li>
                    <li>• টিকিট সংক্রান্ত যেকোনো প্রয়োজনে যোগাযোগ করুন: <strong className="font-mono text-emerald-800">support@ticketlagbe.com</strong></li>
                  </ul>
                </div>

                {/* 5. Footer and thanks */}
                <div className="border-t border-slate-300 border-dashed pt-4 text-center mt-4">
                  <p className="font-black text-emerald-700 text-sm">{isBn ? 'টিকিট লাগবে বেছে নেওয়ার জন্য ধন্যবাদ!' : 'Thank you for choosing Ticket Lagbe!'}</p>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-semibold">This is a system generated secure e-ticket.</p>
                </div>

              </div>

            </div>
          </div>

        </div>

        {/* Modal Action Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-4 md:flex-row flex-col justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all text-sm"
          >
            {isBn ? 'বন্ধ করুন' : 'Close'}
          </button>
          <button
            onClick={handleDownloadPdf}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-500/10"
          >
            <Download size={16} />
            {isBn ? 'পিডিএফ ডাউনলোড করুন' : 'Download PDF'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
