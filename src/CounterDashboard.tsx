import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Bus, 
  Ticket, 
  Users, 
  LogOut, 
  Search, 
  Bell, 
  User,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2,
  X,
  Menu,
  ChevronRight,
  Printer,
  QrCode,
  Download,
  Calendar,
  Trash2,
  Globe,
  Home,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from './context/LanguageContext';
import { TicketPreviewModal } from './components/TicketPreviewModal';
import { toast } from 'sonner';

export default function CounterDashboard({ onLogout, onBack, userProfile }: { onLogout?: () => void; onBack?: () => void; userProfile?: any }) {
  const { t, formatNumber, formatCurrency, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [pendingTicket, setPendingTicket] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [ticketPreviewBooking, setTicketPreviewBooking] = useState<any>(null);
  const [buses, setBuses] = useState<any[]>([]);

  const [schedules, setSchedules] = useState<any[]>([]);

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`/api/schedules?lang=${language}`);
      const data = await res.json();
      setSchedules(data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await fetch(`/api/bookings?lang=${language}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setBookings(data);
      } else {
        console.error('Bookings API returned non-array data:', data);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setBookings([]);
    }
  };

  const fetchBuses = async () => {
    try {
      const res = await fetch(`/api/buses?lang=${language}`);
      const data = await res.json();
      setBuses(data);
    } catch (error) {
      console.error('Error fetching buses:', error);
    }
  };

  // Load data from local state
  useEffect(() => {
    fetchSchedules();
    fetchBookings();
    fetchBuses();
  }, [language]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scheduleSearchQuery, setScheduleSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [sellDateFilter, setSellDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [bookingType, setBookingType] = useState<'purchase' | 'reserve'>('purchase');
  
  // Form states for selling
  const [passengerName, setPassengerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [passengerId, setPassengerId] = useState('');
  const [address, setAddress] = useState('');
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [seatPassengers, setSeatPassengers] = useState<{[key: string]: {name: string, phone: string, id: string}}>({});
  const [paymentMethod, setPaymentMethod] = useState<'Online' | 'Offline'>('Offline');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Booking Confirmed', message: 'Ticket #BK-8824 for Tanvir Rahman has been confirmed.', time: '10 mins ago', unread: true },
    { id: 2, title: 'Bus Delayed', message: 'Dhaka-Chittagong 02:00 PM trip is delayed by 20 mins.', time: '45 mins ago', unread: true },
    { id: 3, title: 'New Schedule', message: 'A new trip has been added for Dhaka-Sylhet route.', time: '3 hours ago', unread: false },
  ]);

  const handleSellTicket = async () => {
    if (!passengerName || !phoneNumber || !passengerId || !address || selectedSeats.length === 0) {
      toast.error(t('counter.alert.fill_details'));
      return;
    }

    // Check if all selected seats have passenger info if more than 1 seat
    if (selectedSeats.length > 1) {
      for (const seat of selectedSeats) {
        const p = seatPassengers[seat];
        if (!p || !p.name || !p.phone || !p.id) {
          toast.error(t('counter.alert.seat_details', { seat }));
          return;
        }
      }
    }

    const bookingData = {
      user_id: userProfile?.id || 1,
      passenger_name: passengerName,
      phone_number: phoneNumber,
      passenger_id: passengerId,
      address: address,
      bus_id: selectedBus.bus_id,
      route: `${selectedBus.routeFrom} to ${selectedBus.routeTo}`,
      time: selectedBus.departure_time,
      travel_date: selectedBus.date,
      seats: selectedSeats.join(', '),
      status: bookingType === 'purchase' ? "Confirmed" : "Reserved",
      amount: (selectedBus.fare * selectedSeats.length).toString(),
      payment_method: bookingType === 'purchase' ? paymentMethod : null,
      counter: userProfile?.counterName || 'Direct Sale',
      staff: userProfile?.name || 'Staff',
      passengers_json: JSON.stringify(seatPassengers)
    };

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      
      if (response.ok) {
        const result = await response.json();
        const newBooking = {
          ...bookingData,
          id: result.id,
          passenger: passengerName,
          bus: selectedBus.busName,
          date: new Date().toISOString().split('T')[0],
          passengersJson: bookingData.passengers_json,
          expiryTime: bookingType === 'reserve' ? new Date(Date.now() + 30 * 60000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : null,
        };
        
        setBookings([newBooking, ...bookings]);
        setSelectedBus(null);
        setPassengerName('');
        setPhoneNumber('');
        setPassengerId('');
        setAddress('');
        setSelectedSeats([]);
        setSeatPassengers({});
        setBookingType('purchase');
        
        if (newBooking.status === 'Confirmed') {
          setPendingTicket(newBooking);
          setShowPrintConfirm(true);
        } else {
          toast.success(t('counter.alert.reserve_success', { time: newBooking.expiryTime }));
        }
      } else {
        const error = await response.json();
        toast.error(t('counter.alert.error', { message: error.message }));
      }
    } catch (error) {
      console.error('Error selling ticket:', error);
      toast.error(t('counter.alert.failed_sell'));
    }
  };

  const handleConfirmTicket = async (id: string) => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Confirmed' })
      });
      
      if (response.ok) {
        setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Confirmed' } : b));
        toast.success(t('counter.alert.confirm_success'));
      } else {
        const error = await response.json();
        toast.error(t('counter.alert.error', { message: error.message }));
      }
    } catch (error) {
      console.error('Error confirming ticket:', error);
      toast.error(t('counter.alert.failed_confirm'));
    }
  };

  const handleCancelTicket = async (id: string) => {
    toast(t('counter.alert.cancel_confirm'), {
      action: {
        label: t('common.confirm'),
        onClick: async () => {
          try {
            const response = await fetch(`/api/bookings/${id}`, {
              method: 'DELETE'
            });
            
            if (response.ok) {
              setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Cancelled' } : b));
              toast.success(t('counter.alert.cancel_success'));
            } else {
              const error = await response.json();
              toast.error(t('counter.alert.error', { message: error.message }));
            }
          } catch (error) {
            console.error('Error cancelling ticket:', error);
            toast.error(t('counter.alert.failed_cancel'));
          }
        }
      }
    });
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      String(booking.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.passenger || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.phone || booking.phone_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.passengerId || booking.passenger_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.passengersJson ? booking.passengersJson.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      (booking.bus || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.route || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (booking.date || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'All' || booking.status === statusFilter;
    const matchesDate = dateFilter === 'All' || booking.date === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const filteredSchedule = schedules.filter(bus => {
    const matchesSearch = 
      bus.busName?.toLowerCase().includes(scheduleSearchQuery.toLowerCase()) ||
      bus.routeFrom?.toLowerCase().includes(scheduleSearchQuery.toLowerCase()) ||
      bus.routeTo?.toLowerCase().includes(scheduleSearchQuery.toLowerCase());
    
    const matchesDate = !sellDateFilter || bus.date === sellDateFilter;
    
    return matchesSearch && matchesDate;
  });

  const toggleSeat = (seat: string) => {
    // Check if seat is already booked
    const bookedSeats = selectedBus 
      ? bookings
          .filter(b => b.bus === selectedBus.bus)
          .flatMap(b => b.seats.split(', ').map(s => s.trim()))
      : [];
    
    if (bookedSeats.includes(seat)) return;

    setSelectedSeats(prev => 
      prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
    );
  };

  const handleDownload = async () => {
    const ticketElement = document.getElementById('printable-ticket');
    if (!ticketElement) return;

    try {
      const canvas = await html2canvas(ticketElement, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true
      });
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = `Ticket-${selectedTicket.id}.png`;
      link.click();
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error(t('counter.alert.failed_download'));
    }
  };

  const handleDownloadPDF = async () => {
    const ticketElement = document.getElementById('printable-ticket');
    if (!ticketElement) return;

    try {
      const canvas = await html2canvas(ticketElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Ticket-${selectedTicket.id}.pdf`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error(t('counter.alert.failed_pdf'));
    }
  };

  const handleDownloadSalesReportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(20);
      doc.setTextColor(16, 185, 129); // emerald-600
      doc.text(t('report.sales_report'), 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`${t('nav.counter')}: ${userProfile?.counterName || 'Gabtoli Counter'}`, 14, 30);
      doc.text(`${t('booking.confirmation.date_issued')}: ${new Date().toLocaleDateString()}`, 14, 35);
      doc.text(`${t('admin.report.type')} ${t('counter.dashboard.dailySalesSummary')}`, 14, 40);
      
      // Summary Stats
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(t('report.summary_stats'), 14, 50);
      
      const summaryData = [
        [t('admin.stats.totalRevenue'), formatCurrency(totalSales)],
        [t('admin.stats.onlineSales'), formatCurrency(onlineSales)],
        [t('admin.stats.offlineSales'), formatCurrency(offlineSales)],
        [t('admin.stats.ticketsSold'), formatNumber(ticketsSold)]
      ];
      
      autoTable(doc, {
        startY: 55,
        head: [[t('report.metric'), t('report.value')]],
        body: summaryData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] }
      });
      
      // Detailed Bookings
      doc.text(t('report.detailed_bookings'), 14, (doc as any).lastAutoTable.finalY + 15);
      
      const bookingData = bookings.map(b => {
        let passengerInfo = b.passenger;
        const pJson = b.passengersJson || b.passengers_json;
        if (pJson) {
          try {
            const pData = JSON.parse(pJson);
            const otherPassengers = Object.entries(pData).map(([seat, data]: [string, any]) => `${seat}: ${data.name}`).join(', ');
            if (otherPassengers) passengerInfo += ` (${otherPassengers})`;
          } catch (e) {}
        }
        
        return [
          `BK-${b.id}`,
          passengerInfo,
          b.phone || b.phone_number || 'N/A',
          b.passengerId || b.passenger_id || 'N/A',
          b.address || 'N/A',
          b.bus,
          b.seats,
          formatCurrency(b.amount),
          b.status
        ];
      });
      
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [[t('table.header.id'), t('table.header.passenger'), t('auth.phone'), 'Pass. ID', t('booking.passenger.address'), t('booking.summary.bus'), t('booking.summary.seats'), t('table.header.amount'), t('table.header.status')]],
        body: bookingData,
        theme: 'grid',
        headStyles: { fillColor: [37, 99, 235] }, // blue-600
        styles: { fontSize: 7 }
      });
      
      doc.save(`${t('report.sales_report')}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating Sales Report PDF:', error);
      toast.error(t('counter.alert.failed_pdf'));
    }
  };

  // Calculate Stats
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.travel_date === today || b.date === today);
  const totalSales = todayBookings.reduce((sum, b) => sum + (parseInt(b.amount) || 0), 0);
  const onlineSales = todayBookings.filter(b => b.payment_method === 'Online').reduce((sum, b) => sum + (parseInt(b.amount) || 0), 0);
  const offlineSales = todayBookings.filter(b => b.payment_method === 'Offline' || !b.payment_method).reduce((sum, b) => sum + (parseInt(b.amount) || 0), 0);
  const ticketsSold = todayBookings.length;

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Sidebar */}
      <aside className={`
        sticky top-0 left-0 z-[80] h-screen w-[4.5rem] lg:w-64 bg-slate-900 text-slate-400 flex flex-col shrink-0 transition-all duration-300
      `}>
        <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start border-b border-slate-800 h-14 lg:h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <Bus size={20} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight hidden lg:block">{t('brand.name')} <span className="text-emerald-500">Counter</span></span>
          </div>
        </div>

        <nav className="flex-1 p-3 lg:p-4 space-y-1">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label={t('counter.nav.dashboard')} 
            active={activeTab === 'Dashboard'} 
            onClick={() => setActiveTab('Dashboard')}
          />
          <SidebarItem 
            icon={<Ticket size={20} />} 
            label={t('counter.nav.sellTickets')} 
            active={activeTab === 'Sell'} 
            onClick={() => setActiveTab('Sell')}
          />
          <SidebarItem 
            icon={<Users size={20} />} 
            label={t('counter.nav.myBookings')} 
            active={activeTab === 'Bookings'} 
            onClick={() => setActiveTab('Bookings')}
          />
          <SidebarItem 
            icon={<Home size={20} />} 
            label={t('dashboard.header.backToHome')} 
            onClick={onBack} 
          />
          
          <div className="pt-8 pb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 hidden lg:block">System</div>
          <SidebarItem icon={<LogOut size={20} />} label={t('nav.logout')} onClick={onLogout} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 justify-center lg:justify-start">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shrink-0">
              {userProfile?.name?.charAt(0) || 'C'}
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{userProfile?.name || t('nav.counter')}</p>
              <p className="text-xs truncate text-slate-500">{userProfile?.counterName || 'Gabtoli Counter'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* Header */}
        <header className="h-[74px] bg-emerald-600 border-b border-emerald-700/20 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-4 flex-1">
            <h2 className="text-lg font-black text-white hidden sm:block">{userProfile?.counterName || t('counter.title')} {t('counter.portal')}</h2>
            <div className="flex items-center bg-white/10 rounded-full px-4 py-2 border border-white/20 flex-1 max-w-xs focus-within:ring-2 focus-within:ring-white/30 transition-all">
              <Search size={18} className="text-white/60" />
              <input type="text" placeholder={t('counter.search.placeholder')} className="bg-transparent border-none outline-none ml-2 text-sm w-full text-white placeholder:text-white/50" />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 bg-white text-emerald-600 px-3 lg:px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:bg-sky-50"
            >
              <Home size={16} />
              <span className="inline">{t('dashboard.header.backToHome')}</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-2 rounded-full transition-all relative ${isNotificationsOpen ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/80'}`}
              >
                <Bell size={20} />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>
                )}
              </button>

              <AnimatePresence>
                {isNotificationsOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-[90]" 
                      onClick={() => setIsNotificationsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden"
                    >
                      <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-bold text-slate-900 text-sm">{t('counter.notifications.title')}</h3>
                        <button 
                          onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                        >
                          {t('counter.notifications.markAllRead')}
                        </button>
                      </div>
                      <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div 
                              key={notification.id} 
                              className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer relative ${notification.unread ? 'bg-emerald-50/30' : ''}`}
                            >
                              {notification.unread && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-600" />
                              )}
                              <div className="flex justify-between items-start mb-1">
                                <p className="text-xs font-bold text-slate-900">{notification.title}</p>
                                <span className="text-[10px] text-slate-400">{notification.time}</span>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed">{notification.message}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center">
                            <Bell size={32} className="mx-auto text-slate-200 mb-2" />
                            <p className="text-sm text-slate-400">{t('counter.notifications.empty')}</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
                        <button className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-all">
                          {t('counter.notifications.viewAll')}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {activeTab === 'Dashboard' ? (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                <StatCard label={t('admin.stats.totalRevenue')} value={formatCurrency(totalSales)} icon={<TrendingUp size={20} />} color="emerald" />
                <StatCard label={t('admin.stats.onlineSales')} value={formatCurrency(onlineSales)} icon={<Globe size={20} />} color="purple" />
                <StatCard label={t('admin.stats.offlineSales')} value={formatCurrency(offlineSales)} icon={<Ticket size={20} />} color="blue" />
                <StatCard label={t('admin.stats.ticketsSold')} value={formatNumber(ticketsSold)} icon={<Users size={20} />} color="indigo" />
              </div>

              {/* Daily Sales Summary */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-900">{t('counter.dashboard.dailySalesSummary')}</h3>
                    <p className="text-xs text-slate-500">{t('counter.dashboard.overviewToday')} {userProfile?.counterName || 'Gabtoli Counter'}</p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-xs font-bold">
                    <TrendingUp size={14} />
                    <span>{t('counter.dashboard.vsYesterday')}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.stats.totalRevenue')}</p>
                      <h4 className="text-xl font-black text-slate-900">{formatCurrency(totalSales)}</h4>
                      <p className="text-[10px] text-emerald-600 font-bold mt-1">{t('counter.dashboard.totalCombined')}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.stats.ticketsSold')}</p>
                      <h4 className="text-xl font-black text-slate-900">{formatNumber(ticketsSold)}</h4>
                      <p className="text-[10px] text-blue-600 font-bold mt-1">{t('common.today')}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('counter.dashboard.onlineMobile')}</p>
                      <h4 className="text-xl font-black text-purple-600">{formatCurrency(onlineSales)}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">{t('counter.dashboard.digitalPayments')}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('counter.dashboard.offlineCash')}</p>
                      <h4 className="text-xl font-black text-blue-600">{formatCurrency(offlineSales)}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">{t('counter.dashboard.cashAtCounter')}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('counter.dashboard.salesByService')}</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-600">{t('counter.dashboard.acServices')}</span>
                          <span className="font-bold text-slate-900">
                            {t('counter.dashboard.acServicesStats', { 
                              amount: formatNumber('৮,৪০০'), 
                              count: formatNumber(15), 
                              tickets: t('common.tickets') 
                            })}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '67%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-600">{t('counter.dashboard.nonAcServices')}</span>
                          <span className="font-bold text-slate-900">
                            {t('counter.dashboard.nonAcServicesStats', { 
                              amount: formatNumber('৪,১০০'), 
                              count: formatNumber(9), 
                              tickets: t('common.tickets') 
                            })}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: '33%' }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50">
                      <button 
                        onClick={handleDownloadSalesReportPDF}
                        className="w-full py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      >
                        {t('counter.dashboard.downloadReport')}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Today's Schedule */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">{t('counter.dashboard.todaysSchedule')}</h3>
                  <button className="text-xs font-bold text-blue-600 hover:underline">{t('common.viewAll')}</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.busInfo')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.route')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.departure')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.availableSeats')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">{t('admin.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schedules.filter(s => s.date === new Date().toISOString().split('T')[0]).map((bus) => (
                        <tr key={bus.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-blue-600">
                                <Bus size={20} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-bold text-slate-900">{bus.busName}</p>
                                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                                    bus.status === 'On Time' ? 'bg-emerald-100 text-emerald-600' :
                                    bus.status === 'Delayed' ? 'bg-amber-100 text-amber-600' :
                                    'bg-blue-100 text-blue-600'
                                  }`}>
                                    {bus.status}
                                  </span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{bus.bus_id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-600">{bus.routeFrom} to {bus.routeTo}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <Clock size={14} />
                              {bus.departure_time}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold text-emerald-600">{bus.seats} {t('common.seats')}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => setSelectedBus(bus)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                            >
                              {t('counter.dashboard.sellTicket')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : activeTab === 'Sell' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{t('counter.nav.sellTickets')}</h2>
                  <p className="text-slate-500 text-sm">{t('counter.sell.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Calendar size={16} className="text-slate-400" />
                    <input 
                      type="date" 
                      className="bg-transparent outline-none text-sm w-36"
                      value={sellDateFilter}
                      onChange={(e) => setSellDateFilter(e.target.value)}
                    />
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Search size={16} className="text-slate-400" />
                    <input 
                      type="text" 
                      placeholder={t('counter.sell.searchPlaceholder')} 
                      className="bg-transparent outline-none text-sm w-48"
                      value={scheduleSearchQuery}
                      onChange={(e) => setScheduleSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSchedule.map(bus => (
                  <motion.div 
                    key={bus.id}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                          <Bus size={24} />
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                          bus.status === 'On Time' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {bus.status}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900">{bus.busName}</h4>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                            bus.status === 'On Time' ? 'bg-emerald-100 text-emerald-600' :
                            bus.status === 'Delayed' ? 'bg-amber-100 text-amber-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            {bus.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">{bus.routeFrom} to {bus.routeTo}</p>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                          <Clock size={14} />
                          {bus.departure_time}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{t('admin.table.fare')}</p>
                          <p className="text-sm font-bold text-slate-900">৳{bus.fare}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setSelectedBus(bus)}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                      >
                        {t('counter.sell.bookNow')}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : activeTab === 'Bookings' ? (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{t('counter.nav.myBookings')}</h2>
                  <p className="text-slate-500 text-sm">{t('counter.bookings.subtitle')}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder={t('counter.bookings.searchPlaceholder')} 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none w-full sm:w-64 transition-all"
                    />
                  </div>
                  <select 
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  >
                    <option value="All">{t('counter.bookings.allStatus')}</option>
                    <option value="Confirmed">{t('common.confirmed')}</option>
                    <option value="Reserved">{t('common.reserved')}</option>
                  </select>
                  <select 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  >
                    <option value="All">{t('counter.bookings.allDates')}</option>
                    {Array.from(new Set(bookings.map(b => b.date))).sort().reverse().map(date => (
                      <option key={date} value={date}>{date}</option>
                    ))}
                  </select>
                  <button className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                    {t('counter.bookings.exportCsv')}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.ticketId')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.passenger')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.busRoute')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.seats')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.amount')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.status')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">{t('admin.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-6 py-4 text-sm font-bold text-blue-600">BK-{booking.id}</td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-bold text-slate-900">{booking.passenger}</p>
                              <div className="flex flex-col gap-0.5 mt-1">
                                <p className="text-[10px] text-slate-500 font-medium">{booking.phone || booking.phone_number}</p>
                                <p className="text-[10px] text-slate-400">ID: {booking.passengerId || booking.passenger_id || 'N/A'}</p>
                                <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{booking.address || 'No Address'}</p>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <p className="text-[10px] text-slate-400">Travel: {booking.travelDate || booking.date}</p>
                                {booking.payment_method && (
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                    booking.payment_method === 'Online' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
                                  }`}>
                                    {booking.payment_method}
                                  </span>
                                )}
                              </div>
                              {booking.expiryTime && (
                                <p className="text-[9px] text-amber-600 font-bold">Expires: {booking.expiryTime}</p>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-slate-900">{booking.bus}</p>
                              <p className="text-xs text-slate-500">{booking.route}</p>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600">
                                {booking.seats}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(booking.amount)}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                                booking.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-600' : 
                                booking.status === 'Reserved' ? 'bg-amber-100 text-amber-600' :
                                booking.status === 'Cancelled' ? 'bg-blue-100 text-blue-600' :
                                'bg-blue-100 text-blue-600'
                              }`}>
                                {booking.status === 'Confirmed' ? t('table.status.confirmed') : 
                                 booking.status === 'Reserved' ? t('table.status.reserved') :
                                 booking.status === 'Cancelled' ? t('table.status.cancelled') :
                                 t('table.status.pending')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {(booking.status === 'Pending' || booking.status === 'Reserved') && (
                                  <button 
                                    onClick={() => handleConfirmTicket(booking.id)}
                                    className="px-3 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 transition-all"
                                  >
                                    {t('common.confirm')}
                                  </button>
                                )}
                                {(booking.status === 'Pending' || booking.status === 'Reserved') && (
                                  <button 
                                    onClick={() => handleCancelTicket(booking.id)}
                                    className="px-3 py-1 bg-blue-500 text-white text-[10px] font-bold rounded-lg hover:bg-blue-600 transition-all"
                                  >
                                    {t('common.cancel')}
                                  </button>
                                )}
                                {booking.status === 'Confirmed' && (
                                  <button 
                                    onClick={() => {
                                      setPendingTicket(booking);
                                      setShowPrintConfirm(true);
                                    }}
                                    className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                    title="Print Ticket"
                                  >
                                    <Printer size={18} />
                                  </button>
                                )}
                                {booking.status === 'Confirmed' && (
                                  <button 
                                    onClick={() => {
                                      setSelectedTicket(booking);
                                      setShowDownloadConfirm(true);
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Download Ticket"
                                  >
                                    <Download size={18} />
                                  </button>
                                )}
                                <button 
                                  onClick={() => {
                                    const formattedBooking = {
                                      ...booking,
                                      passenger_name: booking.passenger,
                                      phone_number: booking.phone || booking.phone_number,
                                      travel_date: booking.travelDate || booking.date,
                                      time: booking.time || booking.departure || '08:00 AM',
                                      id: 'BK-' + booking.id
                                    };
                                    setTicketPreviewBooking(formattedBooking);
                                  }}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                  title="Ticket Preview"
                                >
                                  <FileText size={18} />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-blue-600 transition-all">
                                  <ChevronRight size={20} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                            {t('counter.bookings.noResults')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[60vh] text-slate-400 font-medium">
              {t('common.coming_soon')}
            </div>
          )}
        </div>
      </main>

      {/* Quick Sell Modal */}
      <AnimatePresence>
        {selectedBus && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">{t('counter.sell.modalTitle')} - {selectedBus.busName}</h2>
                  <p className="text-sm text-slate-500">{selectedBus.routeFrom} {t('common.to')} {selectedBus.routeTo} | {selectedBus.departure_time}</p>
                </div>
                <button onClick={() => setSelectedBus(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Seat Map Placeholder */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{t('counter.sell.selectSeats')} ({formatNumber(45)} {t('common.total')})</p>
                  <div className="grid grid-cols-4 gap-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                    {Array.from({ length: 45 }).map((_, i) => {
                      const seat = `${String.fromCharCode(65 + Math.floor(i/4))}${i%4 + 1}`;
                      const isSelected = selectedSeats.includes(seat);
                      const isBooked = bookings
                        .filter(b => b.bus === selectedBus.busName)
                        .flatMap(b => b.seats.split(', ').map(s => s.trim()))
                        .includes(seat);

                      return (
                        <div 
                          key={i} 
                          onClick={() => !isBooked && toggleSeat(seat)}
                          className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-[10px] font-bold transition-all shrink-0 ${
                            isBooked
                              ? 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                              : isSelected 
                                ? 'border-blue-600 bg-blue-600 text-white cursor-pointer' 
                                : 'border-slate-200 text-slate-400 hover:border-blue-600 hover:text-blue-600 cursor-pointer'
                          }`}
                        >
                          {seat}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Seat Legend */}
                  <div className="mt-6 flex gap-4 text-[10px] font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-white border border-slate-200"></div>
                      <span className="text-slate-500">{t('common.available')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-blue-600"></div>
                      <span className="text-slate-500">{t('common.selected')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded bg-slate-200 opacity-60"></div>
                      <span className="text-slate-500">{t('common.booked')}</span>
                    </div>
                  </div>
                </div>

                {/* Sell Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('counter.sell.passengerName')}</label>
                    <input 
                      type="text" 
                      value={passengerName}
                      onChange={(e) => setPassengerName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100" 
                      placeholder={t('counter.sell.fullNamePlaceholder')} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('counter.sell.phoneNumber')}</label>
                    <input 
                      type="tel" 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100" 
                      placeholder="01XXXXXXXXX" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('counter.sell.passengerId')}</label>
                    <input 
                      type="text" 
                      value={passengerId}
                      onChange={(e) => setPassengerId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100" 
                      placeholder={t('counter.sell.idPlaceholder')} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">{t('counter.sell.address')}</label>
                    <textarea 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 min-h-[80px]" 
                      placeholder={t('counter.sell.addressPlaceholder')} 
                    />
                  </div>

                  {selectedSeats.length > 1 && (
                    <div className="space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Users size={16} className="text-blue-600" />
                        {t('counter.sell.individualDetails')}
                      </h4>
                      <div className="space-y-6">
                        {selectedSeats.map((seat) => (
                          <div key={seat} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{t('common.seat')} {seat}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input 
                                type="text" 
                                placeholder={t('common.name')}
                                value={seatPassengers[seat]?.name || ''}
                                onChange={(e) => setSeatPassengers({...seatPassengers, [seat]: { name: e.target.value, phone: seatPassengers[seat]?.phone || '', id: seatPassengers[seat]?.id || '' }})}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100"
                              />
                              <input 
                                type="tel" 
                                placeholder={t('common.phone')}
                                value={seatPassengers[seat]?.phone || ''}
                                onChange={(e) => setSeatPassengers({...seatPassengers, [seat]: { name: seatPassengers[seat]?.name || '', phone: e.target.value, id: seatPassengers[seat]?.id || '' }})}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                            <input 
                              type="text" 
                              placeholder={t('counter.sell.idPlaceholder')}
                              value={seatPassengers[seat]?.id || ''}
                              onChange={(e) => setSeatPassengers({...seatPassengers, [seat]: { name: seatPassengers[seat]?.name || '', phone: seatPassengers[seat]?.phone || '', id: e.target.value }})}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('counter.sell.bookingType')}</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setBookingType('purchase')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          bookingType === 'purchase' 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {t('common.purchase')}
                      </button>
                      <button 
                        onClick={() => setBookingType('reserve')}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          bookingType === 'reserve' 
                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {t('common.reserveNoMoney')}
                      </button>
                    </div>
                    {bookingType === 'reserve' && (
                      <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1">
                        <Clock size={10} />
                        {t('counter.sell.reservationExpiry')}
                      </p>
                    )}
                  </div>

                  {bookingType === 'purchase' && (
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{t('counter.sell.paymentMethod')}</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setPaymentMethod('Offline')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            paymentMethod === 'Offline' 
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {t('counter.sell.offlineCash')}
                        </button>
                        <button 
                          onClick={() => setPaymentMethod('Online')}
                          className={`py-2 rounded-xl text-xs font-bold transition-all ${
                            paymentMethod === 'Online' 
                              ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' 
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {t('counter.sell.onlineMobile')}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex justify-between mb-4">
                      <span className="text-sm font-medium text-slate-500">{t('counter.sell.totalAmount')}</span>
                      <span className="text-lg font-bold text-slate-900">৳{parseInt(selectedBus.price) * (selectedSeats.length || 1)}</span>
                    </div>
                    <button 
                      onClick={handleSellTicket}
                      className={`w-full text-white font-bold py-4 rounded-2xl transition-all shadow-xl ${
                        bookingType === 'purchase' 
                          ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                          : 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'
                      }`}
                    >
                      {bookingType === 'purchase' ? t('counter.sell.confirmPrint') : t('counter.sell.reserveSeat')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Print Confirmation Dialog */}
      <AnimatePresence>
        {showPrintConfirm && pendingTicket && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Printer size={32} />
              </div>
              
              <div className="text-center space-y-3 mb-8">
                <h3 className="text-xl font-bold text-slate-900">Generate Ticket</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  You are about to generate a secure ticket for <span className="font-bold text-slate-900">{pendingTicket.passenger}</span>.
                </p>
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3 text-left">
                  <QrCode size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    <span className="font-bold block mb-1">Verification QR Code</span>
                    This ticket includes a unique QR code for boarding verification. It is essential for the passenger's journey.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowPrintConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setSelectedTicket(pendingTicket);
                    setShowPrintConfirm(false);
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Generate Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Print Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-900">{t('counter.ticket.printTitle')}</h3>
                <button onClick={() => setSelectedTicket(null)} className="p-2 hover:bg-white rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-8" id="printable-ticket">
                <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 relative overflow-hidden">
                  {/* Decorative Elements */}
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-slate-900 rounded-full"></div>
                  <div className="absolute -top-4 -right-4 w-8 h-8 bg-slate-900 rounded-full"></div>
                  <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-slate-900 rounded-full"></div>
                  <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-slate-900 rounded-full"></div>

                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                        <Bus size={18} />
                      </div>
                      <span className="text-lg font-black tracking-tight">{t('brand.name')}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('counter.ticket.id')}</p>
                      <p className="text-sm font-black text-blue-600">BK-{formatNumber(selectedTicket.id)}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('counter.ticket.passenger')}</p>
                        <p className="text-sm font-bold text-slate-900">{selectedTicket.passenger}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('counter.ticket.phone')}</p>
                        <p className="text-sm font-bold text-slate-900">{formatNumber(selectedTicket.phone_number || selectedTicket.phone)}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('counter.ticket.passengerId')}</p>
                        <p className="text-sm font-bold text-slate-900">{selectedTicket.passenger_id || selectedTicket.passengerId || t('common.na')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('counter.ticket.date')}</p>
                        <p className="text-sm font-bold text-slate-900">{formatNumber(selectedTicket.date)}</p>
                      </div>
                    </div>

                    {(selectedTicket.passengers_json || selectedTicket.passengersJson) && 
                      (() => {
                        try {
                          const pJson = selectedTicket.passengers_json || selectedTicket.passengersJson;
                          const pData = JSON.parse(pJson);
                          if (Object.keys(pData).length === 0) return null;
                          return (
                            <div className="pt-4 border-t border-slate-100 space-y-4">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('counter.ticket.seatWise')}</p>
                              <div className="grid grid-cols-1 gap-3">
                                {Object.entries(pData).map(([seat, data]: [string, any]) => (
                                  <div key={seat} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{t('common.seats')} {formatNumber(seat)}</span>
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold text-slate-900">{data.name}</span>
                                        <span className="text-[10px] text-slate-500">{formatNumber(data.phone)}</span>
                                      </div>
                                    </div>
                                    <span className="text-[10px] font-medium text-slate-400">{t('common.id')}: {formatNumber(data.id)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        } catch (e) {
                          return null;
                        }
                      })()
                    }

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('counter.ticket.address')}</p>
                        <p className="text-xs text-slate-600 leading-relaxed">{selectedTicket.address || t('common.na')}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                        <span className="text-xs text-slate-500">{t('counter.ticket.bus')}</span>
                        <span className="text-xs font-bold text-slate-900">{selectedTicket.bus}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">{t('counter.ticket.route')}</span>
                        <span className="text-xs font-bold text-slate-900">{selectedTicket.route}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">{t('counter.ticket.seats')}</span>
                        <span className="text-xs font-bold text-emerald-600">{formatNumber(selectedTicket.seats)}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-200">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('counter.ticket.totalPaid')}</span>
                        <span className="text-xl font-black text-slate-900">{formatCurrency(selectedTicket.amount)}</span>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-100">
                        <QRCodeSVG 
                          value={`ID: BK-${selectedTicket.id}\nName: ${selectedTicket.passenger}\nRoute: ${selectedTicket.route}\nBus: ${selectedTicket.bus}`}
                          size={64}
                          level="M"
                          includeMargin={false}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => window.print()}
                  className="flex-1 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <Printer size={20} />
                  {t('counter.ticket.printNow')}
                </button>
                <button 
                  onClick={() => setShowDownloadConfirm(true)}
                  className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                >
                  <Download size={20} />
                  {t('counter.ticket.download')}
                </button>
                <button 
                  onClick={() => setSelectedTicket(null)}
                  className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all"
                >
                  {t('counter.ticket.close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Download Confirmation Dialog */}
      <AnimatePresence>
        {showDownloadConfirm && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                  <Download size={32} />
                </div>
                
                <h3 className="text-xl font-black text-slate-900 text-center mb-2">{t('counter.download.confirmTitle')}</h3>
                <p className="text-slate-500 text-center mb-6 text-sm leading-relaxed">
                  {t('counter.download.confirmMsg')}
                </p>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3 mb-8">
                  <QrCode size={20} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-800 leading-relaxed">
                    <span className="font-bold block mb-0.5">{t('counter.download.noticeTitle')}</span>
                    {t('counter.download.noticeMsg')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      handleDownload();
                      setShowDownloadConfirm(false);
                    }}
                    className="bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all flex flex-col items-center justify-center gap-1"
                  >
                    <span className="text-xs">{t('counter.download.image')}</span>
                    <span className="text-[10px] opacity-50 font-medium">{t('counter.download.imageFormat')}</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      handleDownloadPDF();
                      setShowDownloadConfirm(false);
                    }}
                    className="bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-all flex flex-col items-center justify-center gap-1 shadow-lg shadow-emerald-100"
                  >
                    <span className="text-xs">{t('counter.download.document')}</span>
                    <span className="text-[10px] opacity-50 font-medium">{t('counter.download.documentFormat')}</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setShowDownloadConfirm(false)}
                className="w-full bg-slate-50 text-slate-500 font-bold py-4 border-t border-slate-100 hover:bg-slate-100 transition-all text-sm"
              >
                Cancel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {ticketPreviewBooking && (
          <TicketPreviewModal
            isOpen={!!ticketPreviewBooking}
            onClose={() => setTicketPreviewBooking(null)}
            booking={ticketPreviewBooking}
            language={language}
            t={t}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center lg:gap-3 justify-center lg:justify-start px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
        active 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' 
          : 'hover:bg-slate-800 hover:text-white'
      }`}
      title={label}
    >
      <span className="shrink-0">{icon}</span>
      <span className="hidden lg:block truncate">{label}</span>
    </button>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-indigo-50 text-indigo-600"
  };
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-slate-500 text-sm font-medium">{label}</p>
      <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
    </div>
  );
}
