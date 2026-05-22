import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Bus, MapPin, 
  ChevronRight, Search, Filter, Download, UserPlus,
  ArrowLeft, Settings, ShieldCheck, Clock, CheckCircle2,
  AlertCircle, DollarSign, BarChart3, PieChart, Phone,
  Store, Globe, CreditCard, Wifi, WifiOff, X, Building2,
  Users, History, TrendingUp, Briefcase, Edit2, Trash2
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

interface BusCompanyDashboardProps {
  userProfile: any;
  onLogout: () => void;
  onBack: () => void;
}

export default function BusCompanyDashboard({ userProfile, onLogout, onBack }: BusCompanyDashboardProps) {
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'Overview' | 'Fleet' | 'Banking' | 'Ledger' | 'Reports' | 'Staff'>('Overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Data states
  const [buses, setBuses] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [ledgeEntries, setLedgeEntries] = useState<any[]>([]);
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

  // Bus Registration States
  const [isRegisterBusModalOpen, setIsRegisterBusModalOpen] = useState(false);
  const [newBus, setNewBus] = useState({
    name: '',
    regNo: '',
    driver: '',
    driverPhone: '',
    lastMaintenance: '',
    nextMaintenance: '',
    status: 'Active',
    route: '',
    capacity: 45,
    imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800'
  });
  
  // Form states
  const [bankForm, setBankForm] = useState({
    id: null,
    bank_name: '',
    account_name: '',
    account_number: '',
    branch_name: '',
    routing_number: ''
  });

  const fetchData = async () => {
    if (!userProfile?.id) return;
    setIsLoading(true);
    try {
      const [busesRes, bookingsRes, paymentsRes, bankRes, ledgerRes] = await Promise.all([
        fetch(`/api/buses?ownerId=${userProfile.id}&lang=${language}`),
        fetch(`/api/bookings?ownerId=${userProfile.id}&lang=${language}`),
        fetch(`/api/owner-payments?owner_id=${userProfile.id}`),
        fetch(`/api/bank-account/${userProfile.id}`),
        fetch(`/api/ledger-entries?owner_id=${userProfile.id}`)
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
      setLedgeEntries(Array.isArray(ledgerData) ? ledgerData : []);
    } catch (error) {
      console.error('Error fetching company data:', error);
      toast.error('Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userProfile, language]);

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

  const handleRegisterBus = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/buses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBus.name,
          reg_no: newBus.regNo,
          driver: newBus.driver,
          driver_phone: newBus.driverPhone,
          status: newBus.status,
          route: newBus.route,
          last_maintenance: newBus.lastMaintenance || new Date().toISOString().split('T')[0],
          next_maintenance: newBus.nextMaintenance || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
          capacity: newBus.capacity || 40,
          owner_id: userProfile?.id || null,
          image_url: newBus.imageUrl
        })
      });
      if (res.ok) {
        toast.success(language === 'bn' ? 'বাস সফলভাবে নিবন্ধিত হয়েছে' : 'Bus registered successfully');
        setIsRegisterBusModalOpen(false);
        setNewBus({
          name: '',
          regNo: '',
          driver: '',
          driverPhone: '',
          lastMaintenance: '',
          nextMaintenance: '',
          status: 'Active',
          route: '',
          capacity: 45,
          imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800'
        });
        fetchData();
      } else {
        toast.error(language === 'bn' ? 'বাস নিবন্ধন ব্যর্থ হয়েছে' : 'Failed to register bus');
      }
    } catch (error) {
      toast.error(language === 'bn' ? 'ত্রুটি ঘটেছে' : 'An error occurred');
    }
  };

  const onlineRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
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

      if (res.ok) {
        toast.success(bankForm.id ? 'Bank account updated' : 'Bank account added');
        setIsAddBankModalOpen(false);
        setBankForm({ id: null, bank_name: '', account_name: '', account_number: '', branch_name: '', routing_number: '' });
        fetchData();
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const SidebarItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
            <Building2 size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-800">Bus Company</h2>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Master Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <SidebarItem icon={<LayoutDashboard size={20} />} label="Overview" active={activeTab === 'Overview'} onClick={() => setActiveTab('Overview')} />
          <SidebarItem icon={<Bus size={20} />} label="Fleet Management" active={activeTab === 'Fleet'} onClick={() => setActiveTab('Fleet')} />
          <SidebarItem icon={<Users size={20} />} label="Staff & Personnel" active={activeTab === 'Staff'} onClick={() => setActiveTab('Staff')} />
          <SidebarItem icon={<CreditCard size={20} />} label="Banking" active={activeTab === 'Banking'} onClick={() => setActiveTab('Banking')} />
          <SidebarItem icon={<BarChart3 size={20} />} label="Financial Ledger" active={activeTab === 'Ledger'} onClick={() => setActiveTab('Ledger')} />
          <SidebarItem icon={<TrendingUp size={20} />} label="Analytics & Reports" active={activeTab === 'Reports'} onClick={() => setActiveTab('Reports')} />
        </nav>

        <div className="mt-auto space-y-2">
          <button onClick={onBack} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all">
            <ArrowLeft size={18} /> Back to Portal
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-all">
            <ShieldCheck size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 py-4 px-6 lg:px-10 flex items-center justify-between sticky top-0 z-50">
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-slate-600">
            <LayoutDashboard size={24} />
          </button>
          
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800">{userProfile?.name || 'Company Admin'}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{userProfile?.email}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-600">
              <Building2 size={20} />
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-10 max-w-7xl mx-auto w-full">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : activeTab === 'Overview' ? (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Fleet" value={buses.length} icon={<Bus size={24} />} color="blue" />
                <StatCard title="Today's Bookings" value={bookings.length} icon={<Clock size={24} />} color="emerald" />
                <StatCard title="Monthly Revenue" value={`৳${onlineRevenue}`} icon={<TrendingUp size={24} />} color="indigo" />
                <StatCard title="Active Routes" value="12" icon={<MapPin size={24} />} color="amber" />
              </div>

              {/* Company Financial Overview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold">Revenue Analytics</h3>
                    <button className="text-blue-600 text-sm font-bold flex items-center gap-2">View Full Ledger <ChevronRight size={16} /></button>
                  </div>
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600">
                          <TrendingUp size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gross Receivables</p>
                          <p className="text-lg font-black text-slate-800">৳{onlineRevenue}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-emerald-600 font-bold mb-1">+12.5%</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">vs Last Month</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Disbursements</p>
                          <p className="text-lg font-black text-slate-800">৳{paidAmount}</p>
                        </div>
                      </div>
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-100">Reconcile</button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-100">
                  <h3 className="text-xl font-bold mb-6">Net Liquid Balance</h3>
                  <div className="mb-10">
                    <p className="text-[40px] font-black leading-none mb-2">৳{onlineBalance}</p>
                    <p className="text-white/60 text-sm font-bold">{language === 'bn' ? 'সফল পেমেন্ট ব্যালেন্স' : 'Settlement Balance'}</p>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                      <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">Company Fleet Health</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">100% Operational</span>
                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'Fleet' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Fleet Management</h1>
                  <p className="text-slate-500 text-sm">Control and track your entire bus fleet</p>
                </div>
                <button 
                  onClick={() => setIsRegisterBusModalOpen(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 flex items-center gap-2">
                  <Plus size={18} /> Register New Bus
                </button>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Bus Details</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Staffing</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Health</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {buses.map((bus) => (
                        <tr key={bus.id} className="hover:bg-slate-50 transition-all">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <Bus size={24} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{bus.name}</p>
                                <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">{bus.regNo || bus.reg_no}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <p className="text-sm font-bold text-slate-700">{bus.driver}</p>
                            <p className="text-xs text-slate-400">{bus.driverPhone}</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              bus.status === 'Active' || bus.status === 'On Time' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                              {bus.status || 'Active'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div className="w-[90%] h-full bg-emerald-500 rounded-full"></div>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Excellent</p>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button
                               onClick={() => {
                                setTrackingBusId(bus.id);
                                setIsTrackingModalOpen(true);
                              }}
                              className="text-blue-600 font-bold text-sm hover:underline"
                            >
                              Track Live
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'Banking' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Banking Setup</h1>
                  <p className="text-slate-500 text-sm">Manage bank accounts for automatic settlements</p>
                </div>
                <button 
                  onClick={() => setIsAddBankModalOpen(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-blue-100 flex items-center gap-2"
                >
                  <Plus size={18} /> Add New Account
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bankAccounts.map((account) => (
                  <div key={account.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                        <CreditCard size={28} />
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setBankForm(account);
                            setIsAddBankModalOpen(true);
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteBank(account.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-lg font-black text-slate-800 mb-1">{account.bank_name}</h3>
                    <p className="text-sm font-bold text-slate-400 mb-6">{account.account_name}</p>
                    <div className="bg-slate-50 rounded-2xl p-6 space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-widest">Account Number</span>
                        <span className="font-mono font-bold text-slate-700">{account.account_number}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-widest">Branch</span>
                        <span className="font-bold text-slate-700">{account.branch_name}</span>
                      </div>
                      {account.routing_number && (
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-400 uppercase tracking-widest">Routing</span>
                          <span className="font-bold text-slate-700">{account.routing_number}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {bankAccounts.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold">No bank accounts linked yet.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'Ledger' ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold">Corporate Ledger</h1>
                  <p className="text-slate-500 text-sm">Real-time financial transaction history</p>
                </div>
              </div>
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Entry Details</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-emerald-600">Debit (In)</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-rose-600">Credit (Out)</th>
                        <th className="px-8 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {ledgeEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50/50 transition-all font-medium text-slate-600">
                          <td className="px-8 py-6">
                            <p className="font-bold">{new Date(entry.date).toLocaleDateString()}</p>
                            <p className="text-[10px] font-bold text-slate-400">{new Date(entry.date).toLocaleTimeString()}</p>
                          </td>
                          <td className="px-8 py-6">
                            <p className="font-black text-slate-800">{entry.description}</p>
                            <p className="text-[10px] font-bold text-blue-600/60 uppercase tracking-widest">Ref: #{entry.reference_id}</p>
                          </td>
                          <td className="px-8 py-6">
                            <span className={entry.debit > 0 ? "text-emerald-600 font-bold" : "text-slate-300"}>
                              {entry.debit > 0 ? `৳${entry.debit}` : '৳0'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <span className={entry.credit > 0 ? "text-rose-600 font-bold" : "text-slate-300"}>
                              {entry.credit > 0 ? `৳${entry.credit}` : '৳0'}
                            </span>
                          </td>
                          <td className="px-8 py-6">
                            <p className="font-black text-slate-900">৳{entry.balance}</p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {ledgeEntries.length === 0 && (
                  <div className="py-24 text-center">
                    <p className="text-slate-400 font-bold">No ledger records found for this period.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-[2.5rem] p-12 text-center border border-slate-200">
               <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-400 mx-auto mb-6">
                <Settings size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Section Under Construction</h3>
              <p className="text-slate-500 max-w-sm mx-auto">This specialized module for "{activeTab}" is currently being optimized for company operations.</p>
            </div>
          )}
        </div>
      </main>

      {/* Bus Registration Modal */}
      <AnimatePresence>
        {isRegisterBusModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-slate-800">{language === 'bn' ? 'নতুন বাস নিবন্ধন করুন' : 'Register New Bus'}</h2>
                <button onClick={() => setIsRegisterBusModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleRegisterBus} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{language === 'bn' ? 'বাসের নাম' : 'Bus Name'}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Hanif Express"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-slate-700"
                      value={newBus.name}
                      onChange={(e) => setNewBus({...newBus, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{language === 'bn' ? 'রেজিস্ট্রেশন নম্বর' : 'Reg. Number'}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Dhaka Metro-Ba..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-mono font-medium text-slate-700"
                      value={newBus.regNo}
                      onChange={(e) => setNewBus({...newBus, regNo: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{language === 'bn' ? 'চালকের নাম' : 'Driver Name'}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Driver Name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-slate-700"
                      value={newBus.driver}
                      onChange={(e) => setNewBus({...newBus, driver: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{language === 'bn' ? 'চালকের ফোন' : 'Driver Phone'}</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="017..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-slate-700"
                      value={newBus.driverPhone}
                      onChange={(e) => setNewBus({...newBus, driverPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{language === 'bn' ? 'নির্দিষ্ট রুট' : 'Assigned Route'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Dhaka - Chattogram"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-slate-700"
                    value={newBus.route}
                    onChange={(e) => setNewBus({...newBus, route: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{language === 'bn' ? 'আসন ক্ষমতা' : 'Seat Capacity'}</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      placeholder="45"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-slate-700"
                      value={newBus.capacity}
                      onChange={(e) => setNewBus({...newBus, capacity: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</label>
                    <select 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium text-slate-700"
                      value={newBus.status}
                      onChange={(e) => setNewBus({...newBus, status: e.target.value})}
                    >
                      <option value="Active">{language === 'bn' ? 'সক্রিয়' : 'Active'}</option>
                      <option value="In Maintenance">{language === 'bn' ? 'রক্ষণাবেক্ষণাধীন' : 'In Maintenance'}</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100">
                    {language === 'bn' ? 'নিবন্ধন সম্পন্ন করুন' : 'Confirm Registration'}
                  </button>
                </div>
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
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: 'blue' | 'emerald' | 'indigo' | 'amber' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
      <div className={`w-12 h-12 ${colors[color]} rounded-2xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  );
}

function Plus({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
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
              <h3 className="text-xl font-bold">Company Fleet Tracking</h3>
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
              <p className="mt-4 font-bold text-slate-400">Company Master Map</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
              <p className="font-bold text-emerald-600">{location?.status || 'Active Service'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Company Code</p>
              <p className="font-bold text-slate-900">BC-9921</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Telemetry</p>
              <p className="font-bold text-slate-900">Real-time Verified</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Update Period</p>
              <p className="font-bold text-slate-900">5 seconds</p>
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
