import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Bus, Users, MapPin, Ticket, 
  TrendingUp, LogOut, Menu, X, Plus, Edit2, Trash2, 
  ChevronRight, Search, Filter, Download, UserPlus,
  ArrowLeft, Settings, ShieldCheck, Clock, CheckCircle2,
  AlertCircle, DollarSign, BarChart3, PieChart, Phone,
  Store, Globe, CreditCard, Wifi, WifiOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from './context/LanguageContext';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { io, Socket } from 'socket.io-client';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

interface BusOwnerDashboardProps {
  userProfile: any;
  onLogout: () => void;
  onBack: () => void;
}

export default function BusOwnerDashboard({ userProfile, onLogout, onBack }: BusOwnerDashboardProps) {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Buses' | 'Banking' | 'Ledger' | 'Reports'>('Overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data states
  const [buses, setBuses] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isAddBankModalOpen, setIsAddBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);
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
      setIsSocketConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    newSocket.on('bus_location_update', (data: any) => {
      if (isTrackingModalOpen && trackingBusId && String(data.busId) === String(trackingBusId)) {
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
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `bus_locations/${trackingBusId}`);
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isTrackingModalOpen, trackingBusId]);
  
  // Form states
  const [bankForm, setBankForm] = useState({
    id: null,
    bank_name: '',
    account_name: '',
    account_number: '',
    branch_name: '',
    routing_number: '',
    is_primary: false
  });

  useEffect(() => {
    fetchData();
  }, [userProfile, language]);

  const fetchData = async () => {
    if (!userProfile?.id) return;
    setIsLoading(true);
    try {
      const [busesRes, bookingsRes, paymentsRes, bankRes, ledgerRes] = await Promise.all([
        fetch(`/api/buses?ownerId=${userProfile.id}&lang=${language}`),
        fetch(`/api/bookings?ownerId=${userProfile.id}&lang=${language}`),
        fetch(`/api/owner-payments?owner_id=${userProfile.id}`),
        fetch(`/api/bank-account/${userProfile.id}`),
        fetch(`/api/ledger?userId=${userProfile.id}`)
      ]);

      const busesData = await busesRes.json();
      const bookingsData = await bookingsRes.json();
      const paymentsData = await paymentsRes.json();
      const bankData = await bankRes.json();
      const ledgerData = await ledgerRes.json();

      setBuses(Array.isArray(busesData) ? busesData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setBankAccounts(Array.isArray(bankData) ? bankData : []);
      setLedger(Array.isArray(ledgerData) ? ledgerData : []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const parseAmount = (amt: any) => {
    if (!amt) return 0;
    return parseInt(amt.toString().replace(/[৳,]/g, '')) || 0;
  };

  const counterRevenue = bookings
    .filter(b => b.counter && b.counter !== 'Online')
    .reduce((sum, b) => sum + parseAmount(b.amount), 0);

  const onlineRevenue = bookings
    .filter(b => !b.counter || b.counter === 'Online')
    .reduce((sum, b) => sum + parseAmount(b.amount), 0);

  const totalRevenue = counterRevenue + onlineRevenue;
  const paidAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const onlineBalance = onlineRevenue - paidAmount;

  const handleBankSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bank-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bankForm, owner_id: userProfile.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(bankForm.id ? 'Bank details updated' : 'Bank details saved');
        setIsAddBankModalOpen(false);
        setEditingBank(null);
        setBankForm({ id: null, bank_name: '', account_name: '', account_number: '', branch_name: '', routing_number: '', is_primary: false });
        fetchData();
      } else {
        toast.error(data.message || 'Failed to save bank details');
      }
    } catch (error) {
      toast.error('Network error. Failed to save bank details');
    }
  };

  const handleDeleteBank = async (id: number) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;
    try {
      const res = await fetch(`/api/bank-account/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Bank account removed');
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to remove bank account');
    }
  };

  const generateRevenueReport = async () => {
    try {
      toast.loading('Generating report...', { id: 'report-gen' });
      
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = '"Inter", "Noto Sans BN", sans-serif';
      
      const tableData = buses.map(bus => {
        const busBookings = bookings.filter(b => b.bus_id === bus.id || b.busName === bus.name);
        const revenue = busBookings.reduce((sum, b) => sum + parseAmount(b.amount), 0);
        return {
          name: bus.name,
          regNo: bus.regNo || bus.registration_number,
          bookings: busBookings.length,
          revenue: `৳${revenue}`
        };
      });

      tempDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 2px solid #1e293b; padding-bottom: 20px;">
          <div>
            <div style="color: #1e293b; font-size: 28px; font-weight: 800; margin-bottom: 4px;">
              Revenue Report / রাজস্ব রিপোর্ট
            </div>
            <div style="color: #64748b; font-size: 14px; font-weight: 600;">
              Owner: ${userProfile.name}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="color: #64748b; font-size: 12px;">
              Generated on / প্রদানের তারিখ: ${new Date().toLocaleString()}
            </div>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
          <div style="padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Counter Sales / কাউন্টার সেলস</p>
            <p style="font-size: 18px; font-weight: 800; color: #1e293b;">৳${counterRevenue}</p>
          </div>
          <div style="padding: 15px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Online Sales / অনলাইন সেলস</p>
            <p style="font-size: 18px; font-weight: 800; color: #1e293b;">৳${onlineRevenue}</p>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e2e8f0;">
          <thead>
            <tr style="background-color: #1e293b; color: white;">
              <th style="padding: 12px; text-align: left;">Bus Name / বাসের নাম</th>
              <th style="padding: 12px; text-align: left;">Reg No / রেজিস্ট্রেশন</th>
              <th style="padding: 12px; text-align: left;">Total Bookings / মোট বুকিং</th>
              <th style="padding: 12px; text-align: left;">Revenue / রাজস্ব</th>
            </tr>
          </thead>
          <tbody>
            ${tableData.map(row => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px;">${row.name}</td>
                <td style="padding: 12px;">${row.regNo}</td>
                <td style="padding: 12px;">${row.bookings}</td>
                <td style="padding: 12px; font-weight: bold;">${row.revenue}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;

      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`revenue_report_${userProfile.name}.pdf`);
      
      document.body.removeChild(tempDiv);
      toast.success('Report generated successfully!', { id: 'report-gen' });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report.', { id: 'report-gen' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-bold animate-pulse">Loading Owner Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Bus size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t('brand.name')}</h1>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Owner Panel</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
            <SidebarItem icon={<Bus size={20} />} label="My Buses" active={activeTab === 'Buses'} onClick={() => setActiveTab('Buses')} />
            <SidebarItem icon={<CreditCard size={20} />} label="Bank Account" active={activeTab === 'Banking'} onClick={() => setActiveTab('Banking')} />
            <SidebarItem icon={<BarChart3 size={20} />} label="Ledger" active={activeTab === 'Ledger'} onClick={() => setActiveTab('Ledger')} />
            <SidebarItem icon={<DollarSign size={20} />} label="Payments" active={activeTab === 'Reports'} onClick={() => setActiveTab('Reports')} />
          </nav>

          <div className="pt-8 mt-8 border-t border-slate-800 space-y-2">
            <button onClick={onBack} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all font-bold text-sm">
              <ArrowLeft size={20} /> {t('common.back')}
            </button>
            <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition-all font-bold text-sm">
              <LogOut size={20} /> {t('nav.logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-hidden">
        <header className="bg-emerald-600 border-b border-emerald-700/20 px-6 py-5 flex items-center justify-between sticky top-0 z-40 shadow-md">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-all text-white">
              <Menu size={24} />
            </button>
            <h2 className="text-lg font-black text-white">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end">
              <p className="text-sm font-bold text-white">{userProfile?.name}</p>
              <p className="text-[10px] text-white/70 font-bold uppercase tracking-wider">Bus Owner</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold border border-white/20">
              {userProfile?.name?.charAt(0) || 'O'}
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          {activeTab === 'Overview' ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={<Bus className="text-blue-600" />} label="Total Buses" value={buses.length} color="bg-blue-50" />
                <StatCard icon={<Store className="text-emerald-600" />} label="Counter Sales" value={`৳${counterRevenue}`} color="bg-emerald-50" />
                <StatCard icon={<Globe className="text-indigo-600" />} label="Online Sales" value={`৳${onlineRevenue}`} color="bg-indigo-50" />
                <StatCard icon={<DollarSign className="text-rose-600" />} label="Online Balance" value={`৳${onlineBalance}`} color="bg-rose-50" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold">Revenue Summary</h3>
                    <button onClick={generateRevenueReport} className="text-blue-600 text-sm font-bold flex items-center gap-2 hover:underline">
                      <Download size={16} /> Download Report
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Revenue</p>
                      <p className="text-xl font-bold text-slate-900">৳${totalRevenue}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Paid by Admin</p>
                      <p className="text-xl font-bold text-emerald-600">৳${paidAmount}</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-1">Receivable</p>
                      <p className="text-xl font-bold text-blue-600">৳${onlineBalance}</p>
                    </div>
                  </div>
                  
                  <h4 className="font-bold text-sm mb-4 text-slate-400 uppercase tracking-widest">Recent Bookings</h4>
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-200 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <Ticket size={20} className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{booking.passenger}</p>
                            <p className="text-xs text-slate-500">{booking.busName} • {booking.seats} • {booking.counter || 'Online'}</p>
                          </div>
                        </div>
                        <p className="font-bold text-blue-600">৳${parseAmount(booking.amount)}</p>
                      </div>
                    ))}
                    {bookings.length === 0 && <p className="text-center text-slate-400 py-8">No bookings found</p>}
                  </div>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Recent Payments</h3>
                  <div className="space-y-4">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-sm text-emerald-600">+৳${payment.amount}</p>
                          <span className="text-[10px] text-slate-400">{new Date(payment.payment_date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-slate-500">{payment.reference || 'Admin Payment'}</p>
                      </div>
                    ))}
                    {payments.length === 0 && <p className="text-center text-slate-400 py-8">No payment history</p>}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'Buses' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">My Buses</h1>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buses.map((bus) => (
                  <div key={bus.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <Bus size={24} />
                      </div>
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Active</span>
                    </div>
                    <h3 className="text-lg font-bold mb-1">{bus.name}</h3>
                    <p className="text-slate-500 text-sm mb-4">{bus.registration_number}</p>
                    <div className="space-y-2 border-t border-slate-100 pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Capacity</span>
                        <span className="font-bold">{bus.capacity} Seats</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Driver</span>
                        <span className="font-bold">{bus.driver_name}</span>
                      </div>
                      <button 
                        onClick={() => {
                          setTrackingBusId(bus.id);
                          setIsTrackingModalOpen(true);
                        }}
                        className="w-full mt-2 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100 transition-all"
                      >
                        <MapPin size={14} />
                        Track Live Location
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'Banking' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{language === 'bn' ? 'ব্যাংক একাউন্টসমূহ' : 'Bank Accounts'}</h1>
                  <p className="text-slate-500 text-sm">{language === 'bn' ? 'আপনার পেমেন্ট গ্রহণের জন্য ব্যাংকের তথ্য পরিচালনা করুন' : 'Manage your bank details to receive payments'}</p>
                </div>
                <button 
                  onClick={() => {
                    setEditingBank(null);
                    setBankForm({ id: null, bank_name: '', account_name: '', account_number: '', branch_name: '', routing_number: '', is_primary: false });
                    setIsAddBankModalOpen(true);
                  }}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  <Plus size={18} /> {language === 'bn' ? 'নতুন অ্যাকাউন্ট' : 'Add Account'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bankAccounts.map((account) => (
                  <div key={account.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group">
                    {account.is_primary === 1 && (
                      <div className="absolute top-0 right-0">
                        <div className="bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1 rotate-45 translate-x-3 -translate-y-1 w-24 text-center">
                          Primary
                        </div>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                        <CreditCard size={24} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setEditingBank(account);
                            setBankForm({
                              id: account.id,
                              bank_name: account.bank_name,
                              account_name: account.account_name,
                              account_number: account.account_number,
                              branch_name: account.branch_name,
                              routing_number: account.routing_number,
                              is_primary: account.is_primary === 1
                            });
                            setIsAddBankModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteBank(account.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{account.bank_name}</h3>
                    <p className="text-sm font-medium text-slate-500 mb-4">{account.account_name}</p>
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Account No</span>
                        <span className="font-mono font-bold text-slate-700">{account.account_number}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">Branch</span>
                        <span className="font-bold text-slate-700">{account.branch_name}</span>
                      </div>
                      {account.routing_number && (
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Routing</span>
                          <span className="font-bold text-slate-700">{account.routing_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {bankAccounts.length === 0 && (
                  <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-medium">No bank accounts added yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'Ledger' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Ledger Book</h1>
                  <p className="text-slate-500 text-sm">Track your debits and credits history</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-[10px] md:text-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Description</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-emerald-600">Debit (In)</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-rose-600">Credit (Out)</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledger.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-all">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="font-medium text-slate-600">{new Date(entry.date).toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400">{new Date(entry.date).toLocaleTimeString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">{entry.description}</p>
                            <p className="text-[8px] md:text-[10px] text-slate-400">Ref: #{entry.reference_id} ({entry.reference_type})</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={entry.debit > 0 ? "text-emerald-600 font-bold" : "text-slate-300"}>
                              {entry.debit > 0 ? `৳${entry.debit}` : '৳0'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={entry.credit > 0 ? "text-rose-600 font-bold" : "text-slate-300"}>
                              {entry.credit > 0 ? `৳${entry.credit}` : '৳0'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className={`font-black ${entry.balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                              ৳{entry.balance}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {ledger.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="text-slate-200" size={40} />
                    </div>
                    <p className="text-slate-400 font-medium tracking-tight">No ledger entries found</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Reports</h1>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ReportActionCard 
                  title="Revenue Report" 
                  desc="Detailed breakdown of revenue by bus" 
                  icon={<DollarSign className="text-blue-600" />} 
                  onClick={generateRevenueReport}
                />
                <ReportActionCard 
                  title="Bus Efficiency" 
                  desc="Analyze booking rates per bus" 
                  icon={<BarChart3 className="text-emerald-600" />} 
                  onClick={() => toast.info('Efficiency report coming soon')}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add/Edit Bank Modal */}
      <AnimatePresence>
        {isAddBankModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{editingBank ? 'Edit Bank Account' : 'Add Bank Account'}</h2>
                <button onClick={() => setIsAddBankModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <form onSubmit={handleBankSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Bank Name</label>
                    <input type="text" value={bankForm.bank_name} onChange={(e) => setBankForm({...bankForm, bank_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="e.g. Dutch Bangla Bank" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Account Holder Name</label>
                    <input type="text" value={bankForm.account_name} onChange={(e) => setBankForm({...bankForm, account_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="e.g. John Doe" required />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Account Number</label>
                  <input type="text" value={bankForm.account_number} onChange={(e) => setBankForm({...bankForm, account_number: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="e.g. 1234567890" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Branch Name</label>
                    <input type="text" value={bankForm.branch_name} onChange={(e) => setBankForm({...bankForm, branch_name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="e.g. Mohakhali" required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Routing Number</label>
                    <input type="text" value={bankForm.routing_number} onChange={(e) => setBankForm({...bankForm, routing_number: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-100 outline-none" placeholder="e.g. 123456789" />
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                  <input 
                    type="checkbox" 
                    id="is_primary"
                    checked={bankForm.is_primary} 
                    onChange={(e) => setBankForm({...bankForm, is_primary: e.target.checked})} 
                    className="w-5 h-5 rounded-md border-slate-200 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_primary" className="text-sm font-bold text-slate-700 cursor-pointer">
                    Set as Primary Account
                  </label>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 mt-4 flex items-center justify-center gap-2">
                  <ShieldCheck size={20} />
                  {editingBank ? 'Update Account' : 'Save Account'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <BusTrackingModal 
        isOpen={isTrackingModalOpen} 
        onClose={() => setIsTrackingModalOpen(false)} 
        location={busLocation} 
        isSocketConnected={isSocketConnected}
      />

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden" />
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
      {icon} {label}
    </button>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
      <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
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
              <h3 className="text-xl font-bold">Bus Tracking</h3>
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
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <p className="font-bold text-emerald-600">{location?.status || 'On Time'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Speed</p>
              <p className="font-bold text-slate-900">{location?.speed || '45 km/h'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Next Stop</p>
              <p className="font-bold text-slate-900">{location?.nextStop || 'Checking...'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Last Updated</p>
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

function ReportActionCard({ title, desc, icon, onClick }: { title: string; desc: string; icon: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-6 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner">
        {icon}
      </div>
      <div>
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{desc}</p>
      </div>
      <ChevronRight className="ml-auto text-slate-300" />
    </button>
  );
}
