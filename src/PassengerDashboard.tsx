import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Bus, 
  Ticket, 
  User, 
  LogOut, 
  Clock, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Star, 
  Shield, 
  Phone,
  Home,
  TrendingUp,
  Bell,
  History,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Wifi,
  WifiOff,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './context/LanguageContext';
import { CountdownTimer } from './components/CountdownTimer';
import { TicketPreviewModal } from './components/TicketPreviewModal';
import { toast } from 'sonner';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { io, Socket } from 'socket.io-client';

export default function PassengerDashboard({ onLogout, onBack, userProfile }: { onLogout?: () => void; onBack?: () => void; userProfile?: any }) {
  const { t, formatNumber, formatCurrency, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('Overview');
  const [bookings, setBookings] = useState<any[]>([]);
  const [ticketPreviewBooking, setTicketPreviewBooking] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(false);
  const [busLocation, setBusLocation] = useState<any>(null);
  const [trackingBusId, setTrackingBusId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  useEffect(() => {
    const newSocket = io(window.location.origin, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsSocketConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsSocketConnected(false);
    });

    newSocket.on('bus_location_update', (data: any) => {
      // Only update if we are tracking this matching bus ID
      if (isTrackingModalOpen && trackingBusId && String(data.busId) === String(trackingBusId)) {
        console.log('Received WebSocket update for bus:', data.busId);
        setBusLocation(data);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isTrackingModalOpen, trackingBusId]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (isTrackingModalOpen && trackingBusId) {
      const busDocRef = doc(db, 'bus_locations', trackingBusId);
      unsubscribe = onSnapshot(busDocRef, (doc) => {
        if (doc.exists()) {
          setBusLocation(doc.data());
        } else {
          // Fallback if no real-time data exists yet
          setBusLocation({
            status: 'Initializing...',
            speed: '0 km/h',
            nextStop: 'Calculating...',
            lastUpdated: new Date().toISOString()
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `bus_locations/${trackingBusId}`);
        toast.error("Real-time tracking unavailable");
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isTrackingModalOpen, trackingBusId]);

  const fetchMyBookings = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bookings?lang=${language}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const myData = userProfile?.id 
          ? data.filter(b => b.user_id === userProfile.id)
          : data.slice(0, 5);
        setBookings(myData);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayNow = async (booking: any) => {
    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: parseFloat(String(booking.amount).replace(/[৳,]/g, '')) || 800,
          customerName: booking.passenger_name || userProfile?.name || 'Passenger',
          customerEmail: userProfile?.email || 'customer@example.com',
          customerPhone: booking.phone_number || userProfile?.phone,
          busName: booking.bus_name || 'Premium Bus',
          seats: booking.seats
        })
      });

      const data = await response.json();
      const gatewayUrl = data.GatewayPageURL || data.gatewayUrl || data.gatewayURL;
      if (gatewayUrl) {
        window.location.href = gatewayUrl;
      } else {
        toast.error('Failed to initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('An error occurred. Please try again.');
    }
  };

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!userProfile?.id) return;
      try {
        const response = await fetch(`/api/transactions?userId=${userProfile.id}`);
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchMyBookings();
    fetchTransactions();
  }, [language, userProfile?.id]);

  const handleTrackBus = (busId: string) => {
    setTrackingBusId(busId);
    setIsTrackingModalOpen(true);
  };

  const stats = [
    { label: t('passenger.dashboard.trips_completed'), value: '12', icon: <Bus size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('passenger.dashboard.loyalty_points'), value: '450', icon: <Star size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('passenger.dashboard.total_spent'), value: formatCurrency(8500), icon: <CreditCard size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const upcomingTrips = bookings.filter(b => b.status === 'Confirmed' || b.status === 'Reserved' || b.status === 'Upcoming');
  const pastTrips = bookings.filter(b => b.status === 'Completed');

  const handleRefund = async (id: string) => {
    toast(t('passenger.dashboard.refund_confirm'), {
      action: {
        label: t('common.confirm'),
        onClick: async () => {
          try {
            const response = await fetch(`/api/bookings/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'Refund Requested' })
            });
            
            if (response.ok) {
              setBookings(bookings.map(b => b.id === id ? { ...b, status: 'Refund Requested' } : b));
              toast.success(t('passenger.dashboard.refund_success'));
            } else {
              toast.error(t('passenger.dashboard.refund_failed'));
            }
          } catch (error) {
            console.error('Error requesting refund:', error);
            toast.error(t('passenger.dashboard.refund_failed'));
          }
        }
      }
    });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Sidebar */}
      <aside className="sticky top-0 left-0 z-[80] h-screen w-[4.5rem] lg:w-64 bg-slate-900 text-slate-400 flex flex-col shrink-0 transition-all duration-300">
        <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start border-b border-slate-800 h-14 lg:h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <Bus size={20} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight hidden lg:block">{t('brand.name')} <span className="text-blue-500">User</span></span>
          </div>
        </div>

        <nav className="flex-1 p-3 lg:p-4 space-y-1">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label={t('passenger.dashboard.title')} 
            active={activeTab === 'Overview'} 
            onClick={() => setActiveTab('Overview')}
          />
          <SidebarItem 
            icon={<Ticket size={20} />} 
            label={t('my_bookings.title')} 
            active={activeTab === 'Bookings'} 
            onClick={() => setActiveTab('Bookings')}
          />
          <SidebarItem 
            icon={<User size={20} />} 
            label={t('nav.profile')} 
            active={activeTab === 'Profile'} 
            onClick={() => setActiveTab('Profile')}
          />
          <SidebarItem 
            icon={<History size={20} />} 
            label={t('passenger.dashboard.transactions')} 
            active={activeTab === 'Transactions'} 
            onClick={() => setActiveTab('Transactions')}
          />
          <SidebarItem 
            icon={<Lock size={20} />} 
            label={t('passenger.dashboard.change_password')} 
            active={activeTab === 'Security'} 
            onClick={() => setActiveTab('Security')}
          />
          <SidebarItem 
            icon={<Home size={20} />} 
            label={t('dashboard.header.backToHome')} 
            onClick={onBack} 
          />
          
          <div className="pt-8 pb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 hidden lg:block">Account</div>
          <SidebarItem icon={<LogOut size={20} />} label={t('nav.logout')} onClick={onLogout} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 justify-center lg:justify-start">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
              {userProfile?.name?.charAt(0) || 'P'}
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{userProfile?.name || t('auth.passenger')}</p>
              <p className="text-xs truncate text-slate-500">{userProfile?.email || 'passenger@example.com'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* Header */}
        <header className="h-[74px] bg-emerald-600 border-b border-emerald-700/20 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-white">{t('passenger.dashboard.title')}</h2>
          </div>

          <div className="flex items-center gap-4">
             <button 
              onClick={onBack}
              className="flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:bg-sky-50"
            >
              <Home size={16} />
              {t('dashboard.header.backToHome')}
            </button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {activeTab === 'Overview' && (
            <>
              {/* Welcome Section */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-[2rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10">
                  <h1 className="text-3xl md:text-4xl font-black mb-4">
                    {t('passenger.dashboard.welcome', { name: userProfile?.name || t('auth.passenger') })}
                  </h1>
                  <p className="text-blue-100 text-lg max-w-xl mb-8">
                    {t('passenger.dashboard.subtitle')}
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={onBack}
                      className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg"
                    >
                      {t('passenger.dashboard.book_now')}
                    </button>
                    <button 
                      onClick={() => handleTrackBus('1')}
                      className="bg-blue-500/30 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-500/40 transition-all"
                    >
                      {t('passenger.dashboard.track_bus')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className="text-2xl font-black text-slate-900">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Trips */}
                <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-slate-900">{t('passenger.dashboard.upcoming_trips')}</h3>
                    <button 
                      onClick={() => setActiveTab('Bookings')}
                      className="text-blue-600 font-bold text-sm hover:underline"
                    >
                      {t('profile.view_all')}
                    </button>
                  </div>

                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse" />)}
                    </div>
                  ) : upcomingTrips.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingTrips.slice(0, 3).map((trip) => (
                        <div key={trip.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all group">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600">
                                <Bus size={24} />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900">{trip.route}</h4>
                                <p className="text-xs text-slate-500">{trip.travel_date} • {trip.time}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('booking.summary.seats')}</p>
                                <p className="text-sm font-bold text-slate-900">{trip.seats}</p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  trip.status === 'Confirmed' || trip.status === 'Upcoming' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                }`}>
                                  {trip.status}
                                </span>
                                {(trip.status === 'Confirmed' || trip.status === 'Upcoming' || trip.status === 'Reserved') && (
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRefund(trip.id);
                                    }}
                                    className="text-blue-600 font-bold text-[10px] hover:underline"
                                  >
                                    {t('passenger.dashboard.refund_ticket')}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Ticket size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-500 font-medium">{t('passenger.dashboard.no_trips')}</p>
                      <button 
                        onClick={onBack}
                        className="mt-4 text-blue-600 font-bold hover:underline"
                      >
                        {t('passenger.dashboard.book_now')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Quick Actions & Profile Summary */}
                <div className="space-y-8">
                  <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">{t('passenger.dashboard.quick_actions')}</h3>
                    <div className="space-y-3">
                      <QuickActionButton 
                        icon={<MapPin size={18} />} 
                        label={t('passenger.dashboard.track_bus')} 
                        onClick={() => handleTrackBus('1')}
                      />
                      <QuickActionButton 
                        icon={<X size={18} />} 
                        label={t('passenger.dashboard.refund_ticket')} 
                        color="red" 
                        onClick={() => setActiveTab('Bookings')}
                      />
                      <QuickActionButton icon={<Phone size={18} />} label={t('passenger.dashboard.support')} />
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-[50px] -mr-16 -mt-16"></div>
                    <h3 className="text-lg font-bold mb-6 relative z-10">{t('passenger.dashboard.profile_summary')}</h3>
                    <div className="space-y-4 relative z-10">
                      <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{t('passenger.dashboard.member_id')}</p>
                        <p className="font-bold">#TL-{userProfile?.id || '8821'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{t('profile.membership_tier')}</p>
                        <div className="inline-flex items-center gap-2 bg-blue-600/20 px-3 py-1 rounded-lg border border-blue-500/30">
                          <Star size={12} className="text-blue-400" />
                          <span className="text-xs font-bold text-blue-400">PLATINUM</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'Bookings' && (
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm min-h-[60vh]">
               <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{t('my_bookings.title')}</h3>
                  <p className="text-slate-500 text-sm">{t('my_bookings.subtitle')}</p>
                </div>
              </div>
              
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-slate-50 rounded-2xl animate-pulse" />)}
                </div>
              ) : bookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('table.header.id')}</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.route')}</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('booking.summary.seats')}</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('table.header.amount')}</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('table.header.status')}</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">{t('admin.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="py-4 font-bold text-slate-900 text-sm">#BK-{booking.id}</td>
                          <td className="py-4">
                            <p className="text-sm font-bold text-slate-900">{booking.route}</p>
                            <p className="text-[10px] text-slate-400">{booking.travel_date} • {booking.time}</p>
                          </td>
                          <td className="py-4 text-sm font-medium text-slate-600">{booking.seats}</td>
                          <td className="py-4 text-sm font-black text-slate-900">{formatCurrency(booking.amount)}</td>
                          <td className="py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' :
                                booking.status === 'Reserved' ? 'bg-amber-50 text-amber-600' :
                                booking.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                                booking.status === 'Refund Requested' ? 'bg-indigo-50 text-indigo-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {booking.status === 'Refund Requested' ? t('passenger.dashboard.refund_status') : (booking.status === 'Reserved' ? (language === 'bn' ? 'পেমেন্ট বাকি' : 'Pending Payment') : booking.status)}
                              </span>
                              {booking.status === 'Reserved' && booking.booking_date && (
                                <CountdownTimer 
                                  bookingDate={booking.booking_date}
                                  language={language}
                                  onExpired={fetchMyBookings}
                                />
                              )}
                            </div>
                          </td>
                          <td className="py-4 text-right flex items-center justify-end gap-3">
                            {booking.status === 'Reserved' && (
                              <button 
                                onClick={() => handlePayNow(booking)}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-sm transition-all"
                              >
                                <CreditCard size={12} />
                                {language === 'bn' ? 'পেমেন্ট করুন' : 'Pay Now'}
                              </button>
                            )}
                            {(booking.status === 'Confirmed' || booking.status === 'Upcoming') && (
                              <>
                                <button 
                                  onClick={() => handleTrackBus(String(booking.bus_id || '1'))}
                                  className="text-emerald-600 font-bold text-xs hover:underline flex items-center gap-1"
                                >
                                  <MapPin size={12} />
                                  {t('passenger.dashboard.track_bus')}
                                </button>
                                <button 
                                  onClick={() => handleRefund(booking.id)}
                                  className="text-blue-600 font-bold text-xs hover:underline"
                                >
                                  {t('passenger.dashboard.refund_ticket')}
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => setTicketPreviewBooking({
                                ...booking,
                                id: 'BK-' + booking.id
                              })}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                            >
                              <FileText size={12} />
                              {language === 'bn' ? 'টিকিট প্রিভিউ' : 'Ticket Preview'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20">
                  <Ticket size={64} className="mx-auto text-slate-100 mb-4" />
                  <p className="text-slate-400 font-medium">{t('passenger.dashboard.no_trips')}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'Profile' && (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
                <div className="flex flex-col items-center text-center mb-10">
                  <div className="w-24 h-24 rounded-3xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black mb-4 shadow-xl shadow-blue-200">
                    {userProfile?.name?.charAt(0) || 'P'}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{userProfile?.name || t('auth.passenger')}</h3>
                  <p className="text-slate-500">{userProfile?.email || 'passenger@example.com'}</p>
                </div>

                <div className="space-y-6">
                  <ProfileItem label={t('auth.fullname')} value={userProfile?.name || 'Kamal Hossain'} />
                  <ProfileItem label={t('auth.email')} value={userProfile?.email || 'kamal@example.com'} />
                  <ProfileItem label={t('auth.phone')} value={userProfile?.phone || '01700-000000'} />
                  <ProfileItem label={t('booking.passenger.address')} value="Dhaka, Bangladesh" />
                </div>

                <button className="w-full mt-10 bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all">
                  {t('profile.edit')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'Security' && (
            <div className="max-w-2xl mx-auto">
              <ChangePasswordForm userId={userProfile?.id} />
            </div>
          )}

          {activeTab === 'Transactions' && (
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm min-h-[60vh]">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{t('passenger.dashboard.transactions')}</h3>
                  <p className="text-slate-500 text-sm">{t('passenger.dashboard.no_transactions')}</p>
                </div>
              </div>
              
              {transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('passenger.dashboard.transaction_id')}</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('passenger.dashboard.transaction_type')}</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('passenger.dashboard.transaction_method')}</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('passenger.dashboard.transaction_amount')}</th>
                        <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('passenger.dashboard.transaction_date')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="py-4 font-bold text-slate-900 text-sm">#TX-{tx.id}</td>
                          <td className="py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              tx.type === 'Payment' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-4 text-sm font-medium text-slate-600">{tx.method}</td>
                          <td className="py-4 text-sm font-black text-slate-900">{formatCurrency(tx.amount)}</td>
                          <td className="py-4 text-sm text-slate-500">{new Date(tx.transaction_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20">
                  <History size={64} className="mx-auto text-slate-100 mb-4" />
                  <p className="text-slate-400 font-medium">{t('passenger.dashboard.no_transactions')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <BusTrackingModal 
        isOpen={isTrackingModalOpen} 
        onClose={() => setIsTrackingModalOpen(false)} 
        location={busLocation} 
        isSocketConnected={isSocketConnected}
      />

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

function ChangePasswordForm({ userId }: { userId: number }) {
  const { t } = useLanguage();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('passenger.dashboard.password_mismatch'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, oldPassword, newPassword })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(t('passenger.dashboard.password_success'));
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || t('passenger.dashboard.password_error'));
      }
    } catch (error) {
      toast.error(t('passenger.dashboard.password_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
      <h3 className="text-2xl font-bold text-slate-900 mb-8">{t('passenger.dashboard.change_password')}</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('passenger.dashboard.old_password')}</label>
          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Lock className="text-slate-400 mr-3" size={20} />
            <input 
              type={showOld ? "text" : "password"}
              className="bg-transparent w-full outline-none font-medium"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowOld(!showOld)} className="text-slate-400 hover:text-slate-600">
              {showOld ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('passenger.dashboard.new_password')}</label>
          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Lock className="text-slate-400 mr-3" size={20} />
            <input 
              type={showNew ? "text" : "password"}
              className="bg-transparent w-full outline-none font-medium"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button type="button" onClick={() => setShowNew(!showNew)} className="text-slate-400 hover:text-slate-600">
              {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('passenger.dashboard.confirm_password')}</label>
          <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Lock className="text-slate-400 mr-3" size={20} />
            <input 
              type="password"
              className="bg-transparent w-full outline-none font-medium"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="animate-spin" size={20} />}
          {t('profile.edit')}
        </button>
      </form>
    </div>
  );
}

function BusTrackingModal({ isOpen, onClose, location, isSocketConnected }: { isOpen: boolean; onClose: () => void; location: any; isSocketConnected?: boolean }) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
          <div className="flex items-center gap-3">
            <MapPin size={24} />
            <div className="flex flex-col">
              <h3 className="text-xl font-bold">{t('passenger.dashboard.track_bus_title')}</h3>
              <div className="flex items-center gap-2">
                {isSocketConnected ? (
                  <div className="flex items-center gap-1 text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30">
                    <Wifi size={10} />
                    <span>LIVE CONNECTED</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                    <WifiOff size={10} />
                    <span>SYNCING VIA CLOUD</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="aspect-video bg-slate-100 rounded-3xl relative overflow-hidden flex items-center justify-center border-2 border-slate-100">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px]"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xl animate-bounce">
                <Bus size={32} />
              </div>
              <p className="mt-4 font-bold text-slate-400">Live Map View</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('passenger.dashboard.bus_status')}</p>
              <p className="font-bold text-emerald-600">{location?.status || 'On Time'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('passenger.dashboard.current_speed')}</p>
              <p className="font-bold text-slate-900">{location?.speed || '45 km/h'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('passenger.dashboard.next_stop')}</p>
              <p className="font-bold text-slate-900">{location?.nextStop || 'Gazipur'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('passenger.dashboard.last_updated')}</p>
              <p className="font-bold text-slate-900">Just now</p>
            </div>
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all"
          >
            {t('common.close') || 'Close'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all group ${
        active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'hover:bg-slate-800 hover:text-white'
      }`}
    >
      <div className={`${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`}>
        {icon}
      </div>
      <span className="text-sm font-bold hidden lg:block">{label}</span>
    </button>
  );
}

function QuickActionButton({ icon, label, color = 'blue', onClick }: { icon: React.ReactNode; label: string; color?: 'blue' | 'red'; onClick?: () => void }) {
  const colorClasses = color === 'blue' 
    ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
    : 'bg-blue-50 text-blue-600 hover:bg-blue-100';
    
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${colorClasses}`}
    >
      <div className="flex items-center gap-3">
        <div className="transition-transform group-hover:scale-110">
          {icon}
        </div>
        <span className="text-sm font-bold">{label}</span>
      </div>
      <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
    </button>
  );
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="font-bold text-slate-900">{value}</p>
    </div>
  );
}
