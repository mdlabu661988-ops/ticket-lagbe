import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Bus, 
  Map, 
  Clock,
  Calendar,
  Ticket, 
  BarChart3, 
  Settings, 
  LogOut, 
  Search, 
  Bell, 
  User,
  TrendingUp,
  Users,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  X,
  ChevronLeft,
  ChevronRight,
  Menu,
  Store,
  Building2,
  FileText,
  Trash2,
  ArrowRight,
  Globe,
  Home,
  UserPlus,
  ShieldCheck,
  Database as DatabaseIcon,
  Edit,
  Plus,
  CreditCard,
  GripVertical,
  ExternalLink,
  Briefcase,
  Upload,
  Phone,
  Image as ImageIcon,
  Wifi,
  WifiOff,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useLanguage } from './context/LanguageContext';
import { io, Socket } from 'socket.io-client';
import { db } from './firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';
import { applyTheme, defaultThemeSettings, ThemeSettings } from './lib/theme';

const RECENT_BOOKINGS = [
  { id: "#BK-8821", passenger: "আরিফ আহমেদ", route: "ঢাকা - চট্টগ্রাম", time: "১০:৩০ AM", status: "Confirmed", amount: "৳১২০০", counter: "Mohakhali Counter", staff: "Siddiqur Rahman" },
  { id: "#BK-8822", passenger: "সাদিয়া ইসলাম", route: "ঢাকা - সিলেট", time: "১১:১৫ AM", status: "Confirmed", amount: "৳১০০০", counter: "Gabtoli Counter", staff: "Abul Kashem" },
  { id: "#BK-8823", passenger: "কামাল হোসেন", route: "ঢাকা - রাজশাহী", time: "০৭:৪৫ AM", status: "Cancelled", amount: "৳৭০০", counter: "Mohakhali Counter", staff: "Siddiqur Rahman" },
  { id: "#BK-8824", passenger: "তানভীর রহমান", route: "ঢাকা - চট্টগ্রাম", time: "০২:০০ PM", status: "Confirmed", amount: "৳১৫০০", counter: "Gabtoli Counter", staff: "Abul Kashem" },
  { id: "#BK-8825", passenger: "ফারজানা আক্তার", route: "ঢাকা - সিলেট", time: "০৯:০০ AM", status: "Confirmed", amount: "৳৬০০", counter: "Mohakhali Counter", staff: "Siddiqur Rahman" },
  { id: "#BK-8826", passenger: "জসীম উদ্দিন", route: "ঢাকা - বরিশাল", time: "০৮:৩০ AM", status: "Confirmed", amount: "৳৯০০", counter: "Gabtoli Counter", staff: "Abul Kashem" },
  { id: "#BK-8827", passenger: "রকিবুল হাসান", route: "ঢাকা - খুলনা", time: "১২:০০ PM", status: "Confirmed", amount: "৳১১০০", counter: "Mohakhali Counter", staff: "Siddiqur Rahman" },
  { id: "#BK-8828", passenger: "নাজমুল হক", route: "ঢাকা - রংপুর", time: "০৩:৩০ PM", status: "Confirmed", amount: "৳১২৫০", counter: "Gabtoli Counter", staff: "Abul Kashem" },
  { id: "#BK-8829", passenger: "আয়েশা সিদ্দিকা", route: "ঢাকা - কুমিল্লা", time: "০৪:১৫ PM", status: "Confirmed", amount: "৳৫০০", counter: "Mohakhali Counter", staff: "Siddiqur Rahman" },
  { id: "#BK-8830", passenger: "মাহমুদ উল্লাহ", route: "ঢাকা - ময়মনসিংহ", time: "০৫:০০ PM", status: "Cancelled", amount: "৳৪৫০", counter: "Gabtoli Counter", staff: "Abul Kashem" },
  { id: "#BK-8831", passenger: "সাকিব আল হাসান", route: "ঢাকা - মাগুরা", time: "০৬:৩০ PM", status: "Confirmed", amount: "৳৮০০", counter: "Mohakhali Counter", staff: "Siddiqur Rahman" },
  { id: "#BK-8832", passenger: "মুশফিকুর রহিম", route: "ঢাকা - বগুড়া", time: "০৭:১৫ PM", status: "Confirmed", amount: "৳৯৫০", counter: "Gabtoli Counter", staff: "Abul Kashem" },
  { id: "#BK-8833", passenger: "লিটন দাস", route: "ঢাকা - দিনাজপুর", time: "০৮:০০ PM", status: "Confirmed", amount: "৳১১০০", counter: null, staff: null },
  { id: "#BK-8834", passenger: "মেহেদী হাসান", route: "ঢাকা - খুলনা", time: "০৯:৩০ PM", status: "Confirmed", amount: "৳১২০০", counter: null, staff: null },
];

export default function AdminDashboard({ onLogout, onBack, userProfile, onProfileUpdate }: { onLogout?: () => void; onBack?: () => void; userProfile?: any; onProfileUpdate?: (profile: any) => void }) {
  const { t, formatNumber, formatCurrency, language } = useLanguage();
  
  const STATS = [
    { label: t('admin.stats.todaySales'), value: formatCurrency(45200), change: formatNumber("+12%"), icon: <TrendingUp size={20} />, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: t('admin.stats.totalPassengers'), value: formatNumber(124), change: formatNumber("+5%"), icon: <Users size={20} />, color: "text-blue-600", bg: "bg-blue-50" },
    { label: t('admin.stats.activeBuses'), value: `${formatNumber(18)}/${formatNumber(20)}`, change: "92%", icon: <Bus size={20} />, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: t('admin.stats.pendingIssues'), value: formatNumber(2), change: formatNumber("-1"), icon: <AlertCircle size={20} />, color: "text-amber-600", bg: "bg-amber-50" },
  ];
  console.log('AdminDashboard rendering. userProfile:', userProfile);
  const [adminProfile, setAdminProfile] = useState({
    id: userProfile?.id,
    name: userProfile?.name || "Admin User",
    email: userProfile?.email || "admin@ticketlagbe.com",
    phone: userProfile?.phone || ""
  });

  useEffect(() => {
    if (userProfile) {
      setAdminProfile({
        id: userProfile.id,
        name: userProfile.name || "Admin User",
        email: userProfile.email || "admin@ticketlagbe.com",
        phone: userProfile.phone || ""
      });
    }
  }, [userProfile]);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...adminProfile });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [driverApplications, setDriverApplications] = useState<any[]>([]);
  const [corporateContent, setCorporateContent] = useState({
    heroTitle_en: 'Revolutionizing Corporate Mobility in Bangladesh',
    heroTitle_bn: 'বাংলাদেশে কর্পোরেট মোবিলিটিতে বিপ্লব আনা',
    heroSubtitle_en: 'Streamline your employee transportation with our tech-enabled, safe, and reliable corporate mobility solutions.',
    heroSubtitle_bn: 'আমাদের প্রযুক্তি-নির্ভর, নিরাপদ এবং নির্ভরযোগ্য কর্পোরেট মোবিলিটি সমাধানের মাধ্যমে আপনার কর্মীদের পরিবহন ব্যবস্থা সহজতর করুন।',
    stats_clients: '500+',
    stats_trips: '1M+',
    stats_drivers: '10k+',
    stats_ontime: '99.9%',
    heroImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=1920'
  });
  const [isCounterModalOpen, setIsCounterModalOpen] = useState(false);
  const [isCounterUserModalOpen, setIsCounterUserModalOpen] = useState(false);
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isBusModalOpen, setIsBusModalOpen] = useState(false);
  const [selectedBusDetail, setSelectedBusDetail] = useState<any>(null);
  const [buses, setBuses] = useState<any[]>([]);
  const [counters, setCounters] = useState<any[]>([]);
  const [counterUsers, setCounterUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [newCounter, setNewCounter] = useState({ name: '', location: '', phone: '' });
  const [newCounterUser, setNewCounterUser] = useState({ name: '', email: '', password: '', counterId: '' });
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'user', ownerId: '' });
  const [newOwner, setNewOwner] = useState({ name: '', email: '', password: '' });
  const [newCompany, setNewCompany] = useState({ name: '', email: '', password: '' });
  const [isRegisterBusModalOpen, setIsRegisterBusModalOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportOwnerId, setReportOwnerId] = useState('');
  const [reportBusId, setReportBusId] = useState('');
  const [reportCounterId, setReportCounterId] = useState('');
  const [reportStaffId, setReportStaffId] = useState('');
  
  // Real-time tracking states
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

  // Menu Management State
  const [menus, setMenus] = useState<any[]>([]);
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<any>(null);
  const [newMenu, setNewMenu] = useState({
    label_en: '',
    label_bn: '',
    path: '',
    is_active: 1
  });

  const [availableDrivers, setAvailableDrivers] = useState<any[]>([]);
  const [corporateBookings, setCorporateBookings] = useState<any[]>([]);
  const [corporateSubTab, setCorporateSubTab] = useState<'Reservations' | 'Applications' | 'Content'>('Reservations');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');

  useEffect(() => {
    fetchMenus();
    fetchCorporateData();
  }, []);

  const fetchCorporateData = async () => {
    try {
      const [bookingsRes, driversRes, appsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/corporate/bookings'),
        fetch('/api/admin/corporate/drivers'),
        fetch('/api/admin/driver/applications'),
        fetch('/api/corporate/settings')
      ]);
      const bookingsData = await bookingsRes.json();
      const driversData = await driversRes.json();
      const appsData = await appsRes.json();
      const settingsData = await settingsRes.json();
      
      setCorporateBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setAvailableDrivers(Array.isArray(driversData) ? driversData : []);
      setDriverApplications(Array.isArray(appsData) ? appsData : []);
      if (settingsData && Object.keys(settingsData).length > 0) {
        setCorporateContent(settingsData);
      }
    } catch (error) {
      console.error('Error fetching corporate data:', error);
    }
  };

  const handleSaveCorporateSettings = async () => {
    try {
      const res = await fetch('/api/admin/corporate/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corporateContent)
      });
      if (res.ok) {
        toast.success(language === 'bn' ? 'কর্পোরেট সেটিংস সফলভাবে সংরক্ষিত হয়েছে' : 'Corporate settings saved successfully!');
      }
    } catch (error) {
      toast.error('Failed to save settings');
    }
  };

  const handleAssignDriver = async (bookingId: number, driverId: number) => {
    try {
      const res = await fetch(`/api/admin/corporate/bookings/${bookingId}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driver_id: driverId })
      });
      if (res.ok) {
        toast.success(language === 'bn' ? 'ড্রাইভার সফলভাবে নিযুক্ত করা হয়েছে' : 'Driver assigned successfully');
        fetchCorporateData();
      } else {
        toast.error('Failed to assign driver');
      }
    } catch (error) {
      toast.error('Error assigning driver');
    }
  };

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/menus');
      const data = await res.json();
      setMenus(data);
    } catch (error) {
      console.error('Error fetching menus:', error);
    }
  };

  const handleAddMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newMenu, order_index: menus.length })
      });
      if (res.ok) {
        toast.success('Menu item added successfully');
        setIsMenuModalOpen(false);
        setNewMenu({ label_en: '', label_bn: '', path: '', is_active: 1 });
        fetchMenus();
      }
    } catch (error) {
      toast.error('Failed to add menu item');
    }
  };

  const handleUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/menus/${editingMenu.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMenu)
      });
      if (res.ok) {
        toast.success('Menu item updated successfully');
        setEditingMenu(null);
        fetchMenus();
      }
    } catch (error) {
      toast.error('Failed to update menu item');
    }
  };

  const handleDeleteMenu = async (id: number) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const res = await fetch(`/api/menus/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Menu item deleted successfully');
        fetchMenus();
      }
    } catch (error) {
      toast.error('Failed to delete menu item');
    }
  };

  const onDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(menus);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index
    }));

    setMenus(updatedItems);

    try {
      await fetch('/api/menus/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems.map(i => ({ id: i.id, order_index: i.order_index })) })
      });
      toast.success('Menu order updated');
    } catch (error) {
      toast.error('Failed to update menu order');
      fetchMenus();
    }
  };
  const [owners, setOwners] = useState<any[]>([]);
  const [staffs, setStaffs] = useState<any[]>([]);
  const [newBus, setNewBus] = useState({
    name: '',
    regNo: '',
    driver: '',
    driverPhone: '',
    lastMaintenance: '',
    nextMaintenance: '',
    status: 'Active',
    route: '',
    capacity: 40,
    imageUrl: ''
  });
  const [routes, setRoutes] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    bus_id: '',
    route_id: '',
    departure_time: '',
    arrival_time: '',
    date: new Date().toISOString().split('T')[0],
    status: 'On Time',
    available_seats: 40
  });
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editScheduleData, setEditScheduleData] = useState<any>(null);

  // Editing States
  const [editingBusId, setEditingBusId] = useState<string | null>(null);
  const [editBusData, setEditBusData] = useState<any>(null);
  const [editingCounterId, setEditingCounterId] = useState<string | null>(null);
  const [editCounterData, setEditCounterData] = useState<any>(null);
  const [editingRouteId, setEditingRouteId] = useState<string | null>(null);
  const [editRouteData, setEditRouteData] = useState<any>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState<any>(null);
  const [bookingView, setBookingView] = useState<'summary' | 'detailed'>('summary');
  const [selectedCounterForDetails, setSelectedCounterForDetails] = useState<string | null>(null);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [ownerPayments, setOwnerPayments] = useState<any[]>([]);
  const [isPayOwnerModalOpen, setIsPayOwnerModalOpen] = useState(false);
  const [selectedOwnerForPayment, setSelectedOwnerForPayment] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [accountSummary, setAccountSummary] = useState({
    totalSales: 0,
    onlineSales: 0,
    counterSales: 0,
    totalPaidToOwners: 0,
    netBalance: 0
  });
  const [sslSettings, setSslSettings] = useState({
    ssl_store_id: '',
    ssl_store_password: '',
    ssl_is_sandbox: 'true',
    banner_title: 'Best Discount!',
    banner_subtitle: 'Weekly Mega Offer',
    banner_button: 'AIRTEL NETWORK',
    banner_image: 'https://picsum.photos/seed/promo/1200/400'
  });

  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    theme_mode: 'light',
    color_primary: '#2563eb',
    color_secondary: '#475569',
    color_text: '#0f172a',
    color_bg: '#f8fafc',
    custom_css: '/* Custom styles here */',
    font_family: 'Inter',
    base_font_size: '16'
  });

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await fetch('/api/settings/theme');
        if (res.ok) {
          const data = await res.json();
          setThemeSettings(data);
        }
      } catch (error) {
        console.error('Error fetching theme settings:', error);
      }
    };
    fetchTheme();
  }, []);

  useEffect(() => {
    applyTheme(themeSettings);
  }, [themeSettings]);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Booking', message: 'Tanvir Rahman booked a seat on Dhaka-Chittagong route.', time: '5 mins ago', unread: true },
    { id: 2, title: 'Maintenance Alert', message: 'Bus #REG-1234 is due for maintenance tomorrow.', time: '1 hour ago', unread: true },
    { id: 3, title: 'Schedule Update', message: 'Dhaka-Sylhet 09:00 AM trip has been delayed by 15 mins.', time: '2 hours ago', unread: false },
  ]);

  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [ledgerFilterUserId, setLedgerFilterUserId] = useState('');
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [currentLedgerPage, setCurrentLedgerPage] = useState(1);
  const ledgerEntriesPerPage = 20;

  const fetchLedgerEntries = async () => {
    try {
      const url = ledgerFilterUserId ? `/api/ledger?userId=${ledgerFilterUserId}` : '/api/ledger';
      const res = await fetch(url);
      const data = await res.json();
      setLedgerEntries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching ledger entries:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'Ledger') {
      fetchLedgerEntries();
    }
  }, [activeTab, ledgerFilterUserId]);

  const handleImageUpload = async (file: File, type: 'new' | 'edit' | 'banner') => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.imageUrl) {
        if (type === 'new') {
          setNewBus({ ...newBus, imageUrl: data.imageUrl });
        } else if (type === 'edit') {
          setEditBusData({ ...editBusData, imageUrl: data.imageUrl });
        } else if (type === 'banner') {
          setSslSettings({ ...sslSettings, banner_image: data.imageUrl });
        }
        toast.success('Image uploaded successfully');
      } else {
        toast.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  // Load data from API
  const fetchData = async () => {
    try {
      const [busesRes, countersRes, usersRes, routesRes, bookingsRes, schedulesRes, paymentsRes, summaryRes, settingsRes, ledgerRes] = await Promise.all([
        fetch(`/api/buses?lang=${language}`),
        fetch(`/api/counters?lang=${language}`),
        fetch(`/api/users?lang=${language}`),
        fetch(`/api/routes?lang=${language}`),
        fetch(`/api/bookings?lang=${language}`),
        fetch(`/api/schedules?lang=${language}`),
        fetch(`/api/owner-payments`),
        fetch(`/api/accounts/summary`),
        fetch(`/api/settings`),
        fetch(`/api/ledger`)
      ]);

      const [busesData, countersData, usersData, routesData, bookingsData, schedulesData, paymentsData, summaryData, settingsData, ledgerData] = await Promise.all([
        busesRes.json(),
        countersRes.json(),
        usersRes.json(),
        routesRes.json(),
        bookingsRes.json(),
        schedulesRes.json(),
        paymentsRes.json(),
        summaryRes.json(),
        settingsRes.json(),
        ledgerRes.json()
      ]);

      setBuses(Array.isArray(busesData) ? busesData : []);
      setCounters(Array.isArray(countersData) ? countersData : []);
      setAllUsers(Array.isArray(usersData) ? usersData : []);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      setSchedules(Array.isArray(schedulesData) ? schedulesData : []);
      setOwnerPayments(Array.isArray(paymentsData) ? paymentsData : []);
      setAccountSummary(summaryData);
      setSslSettings(settingsData);
      setLedgerEntries(Array.isArray(ledgerData) ? ledgerData : []);

      // Filter owners and staffs
      if (Array.isArray(usersData)) {
        setOwners(usersData.filter((u: any) => u.role === 'owner'));
        setStaffs(usersData.filter((u: any) => u.role === 'counter'));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sslSettings)
      });
      if (res.ok) {
        toast.success('Settings saved successfully');
        fetchData();
      } else {
        toast.error('Failed to save settings');
      }
    } catch (error) {
      toast.error('Error saving settings');
    }
  };

  const handleSaveThemeSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(themeSettings)
      });
      if (res.ok) {
        toast.success(language === 'bn' ? 'থিম সেটিংস সফলভাবে সংরক্ষিত হয়েছে' : 'Theme settings saved successfully');
      } else {
        toast.error(language === 'bn' ? 'থিম সেটিংস সংরক্ষণ ব্যর্থ হয়েছে' : 'Failed to save theme settings');
      }
    } catch (error) {
      toast.error(language === 'bn' ? 'ত্রুটি ঘটেছে' : 'Error saving theme settings');
    }
  };

  const handleResetThemeSettings = () => {
    if (confirm(language === 'bn' ? 'আপনি কি থিম ডিফল্ট রিসেট করতে চান?' : 'Are you sure you want to reset themes to default?')) {
      setThemeSettings(defaultThemeSettings);
      toast.success(language === 'bn' ? 'ডিফল্ট থিম রিসেট সম্পন্ন হয়েছে' : 'Theme reset to default successfully');
    }
  };

  const handlePayOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwnerForPayment || !paymentAmount) return;

    try {
      const res = await fetch('/api/owner-payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner_id: selectedOwnerForPayment.id,
          amount: parseFloat(paymentAmount),
          reference: paymentReference
        })
      });

      if (res.ok) {
        toast.success('Payment recorded successfully');
        setIsPayOwnerModalOpen(false);
        setPaymentAmount('');
        setPaymentReference('');
        fetchData();
      } else {
        toast.error('Failed to record payment');
      }
    } catch (error) {
      toast.error('Error recording payment');
    }
  };

  const parseAmount = (amt: any) => {
    if (!amt) return 0;
    const bengaliToEnglish: { [key: string]: string } = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
    };
    const amountStr = amt.toString().replace(/[৳,]/g, '').split('').map((char: string) => bengaliToEnglish[char] || char).join('');
    return parseInt(amountStr) || 0;
  };

  const getOwnerStats = (ownerId: number) => {
    const ownerBuses = buses.filter(b => b.ownerId === ownerId || b.owner_id === ownerId);
    const ownerBusIds = ownerBuses.map(b => b.id);
    const ownerBookings = bookings.filter(b => ownerBusIds.includes(b.bus_id) || ownerBusIds.includes(b.busId));
    
    const onlineSales = ownerBookings
      .filter(b => !b.counter || b.counter === 'Online')
      .reduce((sum, b) => sum + parseAmount(b.amount), 0);
    
    const paid = ownerPayments
      .filter(p => p.owner_id === ownerId)
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    
    return { onlineSales, paid, balance: onlineSales - paid };
  };

  useEffect(() => {
    fetchData();
  }, [language]);

  useEffect(() => {
    fetchLedgerEntries();
  }, [ledgerFilterUserId]);

  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [newRoute, setNewRoute] = useState({ from: '', to: '', distance: '', duration: '', fare: '', status: 'Active' });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [currentRoutePage, setCurrentRoutePage] = useState(1);
  const routesPerPage = 20;

  const totalPages = Math.ceil(bookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;

  const totalRoutePages = Math.ceil(routes.length / routesPerPage);
  const routeStartIndex = (currentRoutePage - 1) * routesPerPage;
  const paginatedRoutes = routes.slice(routeStartIndex, routeStartIndex + routesPerPage);
  
  const filteredBookings = bookings.filter(b => {
    const matchesCounter = !selectedCounterForDetails || (b.counter || 'Online') === selectedCounterForDetails;
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
    const matchesSearch = !searchQuery || 
      String(b.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.passenger.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.phone || b.phone_number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.passengerId || b.passenger_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.passengersJson ? b.passengersJson.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
      b.route.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCounter && matchesSearch && matchesStatus;
  });

  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  const [busSearchQuery, setBusSearchQuery] = useState('');
  const filteredBuses = buses.filter(bus => {
    const isOwnerMatch = userProfile?.role === 'owner' ? bus.ownerId === userProfile.id : true;
    const isSearchMatch = !busSearchQuery || 
      bus.name.toLowerCase().includes(busSearchQuery.toLowerCase()) ||
      bus.regNo.toLowerCase().includes(busSearchQuery.toLowerCase()) ||
      (bus.driver || '').toLowerCase().includes(busSearchQuery.toLowerCase());
    return isOwnerMatch && isSearchMatch;
  });

  const getBookingSummary = () => {
    const summary: { [key: string]: { count: number, total: number } } = {};
    
    bookings.forEach(b => {
      const counterName = b.counter || 'Online';
      if (!summary[counterName]) {
        summary[counterName] = { count: 0, total: 0 };
      }
      summary[counterName].count += 1;
      
      const bengaliToEnglish: { [key: string]: string } = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
      };
      const amountStr = (b.amount || '').toString().replace(/[৳,]/g, '').split('').map(char => bengaliToEnglish[char] || char).join('');
      const amount = parseInt(amountStr) || 0;
      summary[counterName].total += amount;
    });
    
    return Object.entries(summary).map(([name, data]) => ({
      name,
      ...data
    }));
  };

  const today = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.travel_date === today || b.date === today);
  const totalRevenue = todayBookings.reduce((sum, b) => {
    const amountStr = (b.amount || '').toString().replace(/[৳,]/g, '');
    return sum + (parseInt(amountStr) || 0);
  }, 0);
  const onlineRevenue = todayBookings.filter(b => b.payment_method === 'Online').reduce((sum, b) => {
    const amountStr = (b.amount || '').toString().replace(/[৳,]/g, '');
    return sum + (parseInt(amountStr) || 0);
  }, 0);
  const offlineRevenue = todayBookings.filter(b => b.payment_method === 'Offline' || !b.payment_method).reduce((sum, b) => {
    const amountStr = (b.amount || '').toString().replace(/[৳,]/g, '');
    return sum + (parseInt(amountStr) || 0);
  }, 0);

  const DYNAMIC_STATS = [
    { label: t('admin.stats.totalRevenue'), value: formatCurrency(totalRevenue), icon: <TrendingUp />, change: "+১২.৫%", color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: t('admin.stats.onlineSales'), value: formatCurrency(onlineRevenue), icon: <Globe />, change: "Digital", color: "text-purple-600", bg: "bg-purple-50" },
    { label: t('admin.stats.offlineSales'), value: formatCurrency(offlineRevenue), icon: <Ticket />, change: "Cash", color: "text-blue-600", bg: "bg-blue-50" },
    { label: t('admin.stats.ticketsSold'), value: formatNumber(todayBookings.length), icon: <Users />, change: "+৮.২%", color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Saving profile...', tempProfile);
    if (!adminProfile.id) {
      console.warn('No admin profile ID found, updating local state only');
      setAdminProfile({ ...tempProfile });
      if (onProfileUpdate) onProfileUpdate({ ...tempProfile, role: 'admin' });
      setIsProfileModalOpen(false);
      return;
    }
    try {
      const res = await fetch(`/api/users/${adminProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tempProfile.name,
          email: tempProfile.email,
          phone: tempProfile.phone,
          role: 'admin'
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdminProfile({ ...tempProfile });
        if (onProfileUpdate) onProfileUpdate({ ...tempProfile, id: adminProfile.id, role: 'admin' });
        setIsProfileModalOpen(false);
        toast.success(t('admin.alert.user_update_success'));
        fetchData();
      } else {
        toast.error(data.message || t('admin.alert.user_update_fail'));
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(t('admin.alert.user_update_fail'));
    }
  };

  const handleAddCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/counters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCounter)
      });
      if (res.ok) {
        fetchData();
        setNewCounter({ name: '', location: '', phone: '' });
        setIsCounterModalOpen(false);
        toast.success(t('admin.alert.counter_success'));
      }
    } catch (error) {
      toast.error(t('admin.alert.counter_fail'));
    }
  };

  const handleAddCounterUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newCounterUser.email,
          password: newCounterUser.password,
          name: newCounterUser.name,
          email: newCounterUser.email,
          role: 'counter',
          counter_id: newCounterUser.counterId
        })
      });
      if (res.ok) {
        fetchData();
        setNewCounterUser({ name: '', email: '', password: '', counterId: '' });
        setIsCounterUserModalOpen(false);
        toast.success(t('admin.alert.counter_user_success'));
      }
    } catch (error) {
      toast.error(t('admin.alert.counter_user_fail'));
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUser.email,
          password: newUser.password,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          owner_id: newUser.ownerId || null
        })
      });
      if (res.ok) {
        fetchData();
        setNewUser({ name: '', email: '', password: '', role: 'user', ownerId: '' });
        setIsAddUserModalOpen(false);
        toast.success(t('admin.alert.user_success'));
      }
    } catch (error) {
      toast.error(t('admin.alert.user_fail'));
    }
  };

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newOwner.email,
          password: newOwner.password,
          name: newOwner.name,
          email: newOwner.email,
          role: 'owner'
        })
      });
      if (res.ok) {
        fetchData();
        setNewOwner({ name: '', email: '', password: '' });
        setIsOwnerModalOpen(false);
        toast.success(t('admin.alert.user_success'));
      }
    } catch (error) {
      toast.error(t('admin.alert.user_fail'));
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newCompany.email,
          password: newCompany.password,
          name: newCompany.name,
          email: newCompany.email,
          role: 'company'
        })
      });
      if (res.ok) {
        fetchData();
        setNewCompany({ name: '', email: '', password: '' });
        setIsCompanyModalOpen(false);
        toast.success(t('admin.alert.user_success'));
      }
    } catch (error) {
      toast.error(t('admin.alert.user_fail'));
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
          last_maintenance: newBus.lastMaintenance,
          next_maintenance: newBus.nextMaintenance,
          capacity: newBus.capacity,
          owner_id: (newBus as any).ownerId || null,
          image_url: newBus.imageUrl
        })
      });
      if (res.ok) {
        fetchData();
        setNewBus({
          name: '',
          regNo: '',
          driver: '',
          driverPhone: '',
          lastMaintenance: '',
          nextMaintenance: '',
          status: 'Active',
          route: '',
          capacity: 40,
          imageUrl: ''
        });
        setIsRegisterBusModalOpen(false);
        toast.success(t('admin.alert.bus_success'));
      }
    } catch (error) {
      toast.error(t('admin.alert.bus_fail'));
    }
  };

  const handleAddRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_city: newRoute.from,
          to_city: newRoute.to,
          distance: newRoute.distance,
          duration: newRoute.duration,
          fare: newRoute.fare,
          status: newRoute.status
        })
      });
      if (res.ok) {
        fetchData();
        setNewRoute({ from: '', to: '', distance: '', duration: '', fare: '', status: 'Active' });
        setIsRouteModalOpen(false);
        toast.success(t('admin.alert.route_success'));
      }
    } catch (error) {
      toast.error(t('admin.alert.route_fail'));
    }
  };

  const handleDelete = async (collectionName: string, id: string) => {
    toast(t('common.confirm_delete'), {
      action: {
        label: t('common.delete'),
        onClick: async () => {
          try {
            const res = await fetch(`/api/${collectionName}/${id}`, {
              method: 'DELETE'
            });
            if (res.ok) {
              fetchData();
              toast.success(t('admin.alert.item_delete_success'));
            }
          } catch (error) {
            toast.error(t('admin.alert.item_delete_fail'));
          }
        }
      }
    });
  };

  const handleUpdateUserRole = (userId: string, newRole: string) => {
    setAllUsers(allUsers.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleUpdateUserCounter = (userId: string, counterId: string, counterName: string) => {
    setAllUsers(allUsers.map(u => u.id === userId ? { ...u, counterId, counterName } : u));
  };

  const handleSaveUserChanges = async (userId: string) => {
    if (!editUserData) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editUserData.name,
          email: editUserData.email,
          role: editUserData.role,
          phone: editUserData.phone,
          counter_id: editUserData.counterId,
          counter_name: editUserData.counterName,
          owner_id: editUserData.ownerId,
          password: editUserData.password
        })
      });
      if (res.ok) {
        fetchData();
        setEditingUserId(null);
        setEditUserData(null);
        toast.success(t('admin.alert.user_update_success'));
      }
    } catch (error) {
      toast.error(t('admin.alert.user_update_fail'));
    }
  };

  const handleSaveBusEdit = async (id: string) => {
    if (!editBusData) return;
    try {
      const res = await fetch(`/api/buses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editBusData.name,
          reg_no: editBusData.regNo,
          driver: editBusData.driver,
          driver_phone: editBusData.driverPhone,
          status: editBusData.status,
          route: editBusData.route,
          last_maintenance: editBusData.lastMaintenance,
          next_maintenance: editBusData.nextMaintenance,
          capacity: editBusData.capacity,
          image_url: editBusData.imageUrl
        })
      });
      if (res.ok) {
        fetchData();
        setEditingBusId(null);
        setEditBusData(null);
        toast.success(t('admin.alert.bus_update_success'));
      }
    } catch (error) {
      toast.error(t('admin.alert.bus_update_fail'));
    }
  };

  const handleSaveCounterEdit = async (id: string) => {
    if (!editCounterData) return;
    try {
      const res = await fetch(`/api/counters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editCounterData.name,
          location: editCounterData.location,
          phone: editCounterData.phone,
          status: editCounterData.status
        })
      });
      if (res.ok) {
        fetchData();
        setEditingCounterId(null);
        setEditCounterData(null);
        toast.success(t('admin.alert.counter_update_success'));
      }
    } catch (error) {
      toast.error(t('admin.alert.counter_update_fail'));
    }
  };

  const handleSaveRouteEdit = async (id: string) => {
    if (!editRouteData) return;
    try {
      const res = await fetch(`/api/routes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_city: editRouteData.from,
          to_city: editRouteData.to,
          distance: editRouteData.distance,
          duration: editRouteData.duration,
          fare: editRouteData.fare,
          status: editRouteData.status
        })
      });
      if (res.ok) {
        fetchData();
        setEditingRouteId(null);
        setEditRouteData(null);
        toast.success(t('admin.alert.route_update_success'));
      }
    } catch (error) {
      toast.error(t('admin.alert.route_update_fail'));
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
      });
      if (res.ok) {
        fetchData();
        setIsScheduleModalOpen(false);
        setNewSchedule({
          bus_id: '',
          route_id: '',
          departure_time: '',
          arrival_time: '',
          date: new Date().toISOString().split('T')[0],
          status: 'On Time',
          available_seats: 40
        });
        toast.success(t('admin.alert.schedule_success'));
      }
    } catch (error) {
      toast.error(t('admin.alert.schedule_fail'));
    }
  };

  const handleSaveScheduleEdit = async (id: string) => {
    if (!editScheduleData) return;
    try {
      const res = await fetch(`/api/schedules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editScheduleData)
      });
      if (res.ok) {
        fetchData();
        setEditingScheduleId(null);
        setEditScheduleData(null);
        toast.success(t('admin.alert.schedule_update_success'));
      }
    } catch (error) {
      toast.error(t('admin.alert.schedule_update_fail'));
    }
  };

  const handleDeleteSchedule = (id: string) => handleDelete('schedules', id);

  const handleInitializeDefaultUsers = () => {
    toast.info(t('admin.alert.init_success'));
  };

  const handleGenerateReport = async (type: string) => {
    try {
      toast.loading(t('admin.report.generating') || 'Generating report...', { id: 'report-gen' });
      
      // Filter data based on selected filters
      const now = new Date();
      let filteredBookingsForReport = [...bookings];
      
      // Filter by period
      if (reportPeriod === 'daily') {
        const todayStr = now.toISOString().split('T')[0];
        filteredBookingsForReport = filteredBookingsForReport.filter(b => (b.date || b.travel_date) === todayStr);
      } else if (reportPeriod === 'weekly') {
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredBookingsForReport = filteredBookingsForReport.filter(b => new Date(b.date || b.travel_date) >= lastWeek);
      } else if (reportPeriod === 'monthly') {
        const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredBookingsForReport = filteredBookingsForReport.filter(b => new Date(b.date || b.travel_date) >= lastMonth);
      }

      // Filter by Bus Owner (requires bus mapping)
      if (reportOwnerId) {
        const ownerBuses = buses.filter(b => b.ownerId === parseInt(reportOwnerId)).map(b => b.name);
        filteredBookingsForReport = filteredBookingsForReport.filter(b => ownerBuses.includes(b.busName || b.bus));
      }

      // Filter by Bus
      if (reportBusId) {
        const busName = buses.find(b => b.id === parseInt(reportBusId))?.name;
        if (busName) {
          filteredBookingsForReport = filteredBookingsForReport.filter(b => (b.busName || b.bus) === busName);
        }
      }

      // Filter by Counter
      if (reportCounterId) {
        filteredBookingsForReport = filteredBookingsForReport.filter(b => b.counter === reportCounterId);
      }

      // Filter by Staff
      if (reportStaffId) {
        filteredBookingsForReport = filteredBookingsForReport.filter(b => b.staff === reportStaffId);
      }

      // Create a temporary div for rendering the report with proper fonts
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '800px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = '"Inter", "Noto Sans BN", sans-serif';
      
      let contentHtml = `
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px;">
          <div>
            <div style="color: #2563eb; font-size: 28px; font-weight: 800; margin-bottom: 4px;">
              ${t('brand.name')}
            </div>
            <div style="color: #64748b; font-size: 14px; font-weight: 600;">
              ${language === 'bn' ? 'অ্যাডমিন পোর্টাল' : 'Admin Portal'}
            </div>
          </div>
          <div style="text-align: right;">
            <div style="color: #64748b; font-size: 12px; margin-bottom: 2px;">
              ${t('booking.confirmation.date_issued')} / ${language === 'bn' ? 'প্রদানের তারিখ' : 'Date Issued'}: ${new Date().toLocaleString()}
            </div>
            <div style="color: #2563eb; font-size: 14px; font-weight: 700;">
              ${type} (${reportPeriod.toUpperCase()})
            </div>
          </div>
        </div>

        <div style="margin-bottom: 20px; padding: 15px; background-color: #f8fafc; border-radius: 12px; font-size: 12px; color: #475569; display: flex; flex-wrap: wrap; gap: 20px;">
          <div><strong>Period:</strong> ${reportPeriod}</div>
          ${reportOwnerId ? `<div><strong>Owner:</strong> ${owners.find(o => o.id === parseInt(reportOwnerId))?.name}</div>` : ''}
          ${reportBusId ? `<div><strong>Bus:</strong> ${buses.find(b => b.id === parseInt(reportBusId))?.name}</div>` : ''}
          ${reportCounterId ? `<div><strong>Counter:</strong> ${reportCounterId}</div>` : ''}
          ${reportStaffId ? `<div><strong>Staff:</strong> ${reportStaffId}</div>` : ''}
        </div>
      `;

      if (type === 'General Dashboard Summary') {
        contentHtml += `
          <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 20px;">
            ${language === 'bn' ? 'সাধারণ ড্যাশবোর্ড সারাংশ' : 'General Dashboard Summary'}
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 15px; text-align: left; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase;">${language === 'bn' ? 'মেট্রিক' : 'Metric'}</th>
                <th style="padding: 15px; text-align: left; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase;">${language === 'bn' ? 'মান' : 'Value'}</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 15px; font-size: 14px; font-weight: 600; color: #334155;">${language === 'bn' ? 'মোট বুকিং' : 'Total Bookings'}</td>
                <td style="padding: 15px; font-size: 14px; font-weight: 700; color: #0f172a;">${filteredBookingsForReport.length}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 15px; font-size: 14px; font-weight: 600; color: #334155;">${language === 'bn' ? 'মোট রাজস্ব' : 'Total Revenue'}</td>
                <td style="padding: 15px; font-size: 14px; font-weight: 700; color: #0f172a;">${formatCurrency(filteredBookingsForReport.reduce((sum, b) => sum + (parseInt(b.amount?.toString().replace(/[৳,]/g, '')) || 0), 0))}</td>
              </tr>
            </tbody>
          </table>
        `;
      } else if (type === 'Revenue Report') {
        contentHtml += `
          <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 20px;">
            ${language === 'bn' ? 'রাজস্ব রিপোর্ট' : 'Revenue Report'}
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background-color: #2563eb; color: white;">
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'তারিখ' : 'Date'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'যাত্রী' : 'Passenger'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'রুট' : 'Route'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'পরিমাণ' : 'Amount'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'অবস্থা' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBookingsForReport.length > 0 ? filteredBookingsForReport.map(b => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 12px;">${b.date || b.travel_date}</td>
                  <td style="padding: 12px;">${b.passenger}</td>
                  <td style="padding: 12px;">${b.route}</td>
                  <td style="padding: 12px; font-weight: bold;">${formatCurrency(b.amount)}</td>
                  <td style="padding: 12px;">${b.status}</td>
                </tr>
              `).join('') : `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #94a3b8;">No data available for the selected filters</td></tr>`}
            </tbody>
          </table>
        `;
      } else if (type === 'Bus Efficiency') {
        // Filter buses if owner is selected
        const filteredBuses = reportOwnerId ? buses.filter(b => b.ownerId === parseInt(reportOwnerId)) : buses;
        
        contentHtml += `
          <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 20px;">
            ${language === 'bn' ? 'বাসের দক্ষতা' : 'Bus Efficiency'}
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background-color: #4f46e5; color: white;">
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'বাসের নাম' : 'Bus Name'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'রেজিস্ট্রেশন' : 'Reg No'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'অবস্থা' : 'Status'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'বুকিং' : 'Bookings'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'রাজস্ব' : 'Revenue'}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredBuses.map(bus => {
                const busBookings = filteredBookingsForReport.filter(b => (b.busName || b.bus) === bus.name);
                const busRev = busBookings.reduce((sum, b) => sum + (parseInt(b.amount?.toString().replace(/[৳,]/g, '')) || 0), 0);
                return `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px;">${bus.name}</td>
                    <td style="padding: 12px;">${bus.regNo}</td>
                    <td style="padding: 12px;">${bus.status}</td>
                    <td style="padding: 12px;">${busBookings.length}</td>
                    <td style="padding: 12px; font-weight: bold;">${formatCurrency(busRev)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      } else if (type === 'Counter Performance') {
        const filteredCounters = reportCounterId ? counters.filter(c => c.name === reportCounterId) : counters;

        contentHtml += `
          <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 20px;">
            ${language === 'bn' ? 'কাউন্টার পারফরম্যান্স' : 'Counter Performance'}
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background-color: #10b981; color: white;">
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'কাউন্টার' : 'Counter'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'অবস্থান' : 'Location'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'রাজস্ব' : 'Revenue'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'টিকিট' : 'Tickets'}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredCounters.map(counter => {
                const counterBookings = filteredBookingsForReport.filter(b => b.counter === counter.name);
                const counterRev = counterBookings.reduce((sum, b) => sum + (parseInt(b.amount?.toString().replace(/[৳,]/g, '')) || 0), 0);
                return `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px;">${counter.name}</td>
                    <td style="padding: 12px;">${counter.location}</td>
                    <td style="padding: 12px; font-weight: bold;">${formatCurrency(counterRev)}</td>
                    <td style="padding: 12px;">${counterBookings.length}</td>
                  </tr>
                `;
              }).join('')}
              <tr style="background-color: #f8fafc; font-weight: bold;">
                <td style="padding: 12px;">${language === 'bn' ? 'অনলাইন' : 'Online'}</td>
                <td style="padding: 12px;">Website</td>
                <td style="padding: 12px;">${formatCurrency(filteredBookingsForReport.filter(b => !b.counter || b.counter === 'Online').reduce((sum, b) => sum + (parseInt(b.amount?.toString().replace(/[৳,]/g, '')) || 0), 0))}</td>
                <td style="padding: 12px;">${filteredBookingsForReport.filter(b => !b.counter || b.counter === 'Online').length}</td>
              </tr>
            </tbody>
          </table>
        `;
      } else if (type === 'Staff Sales Report') {
        const filteredStaffs = reportStaffId ? staffs.filter(s => s.name === reportStaffId) : staffs;

        contentHtml += `
          <h2 style="font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 20px;">
            ${language === 'bn' ? 'স্টাফ সেলস রিপোর্ট' : 'Staff Sales Report'}
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background-color: #f59e0b; color: white;">
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'স্টাফের নাম' : 'Staff Name'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'কাউন্টার' : 'Counter'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'বুকিং' : 'Bookings'}</th>
                <th style="padding: 12px; text-align: left;">${language === 'bn' ? 'রাজস্ব' : 'Revenue'}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredStaffs.map(staff => {
                const staffBookings = filteredBookingsForReport.filter(b => b.staff === staff.name);
                const staffRev = staffBookings.reduce((sum, b) => sum + (parseInt(b.amount?.toString().replace(/[৳,]/g, '')) || 0), 0);
                return `
                  <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 12px;">${staff.name}</td>
                    <td style="padding: 12px;">${staff.counterName || 'N/A'}</td>
                    <td style="padding: 12px;">${staffBookings.length}</td>
                    <td style="padding: 12px; font-weight: bold;">${formatCurrency(staffRev)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      } else {
        contentHtml += `
          <div style="padding: 40px; text-align: center; color: #64748b;">
            Detailed report content for ${type}
          </div>
        `;
      }

      tempDiv.innerHTML = contentHtml;
      document.body.appendChild(tempDiv);

      const canvas = await html2canvas(tempDiv, { 
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${type.replace(/\s+/g, '-')}-${reportPeriod}-${new Date().getTime()}.pdf`);
      
      document.body.removeChild(tempDiv);
      toast.success(t('admin.report.success') || 'Report generated successfully!', { id: 'report-gen' });
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error(t('admin.report.fail') || 'Failed to generate report.', { id: 'report-gen' });
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      {/* Pay Owner Modal */}
      <AnimatePresence>
        {isPayOwnerModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Pay Bus Owner</h3>
                  <p className="text-slate-400 text-xs mt-1">Record a payment to {selectedOwnerForPayment?.name}</p>
                </div>
                <button onClick={() => setIsPayOwnerModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handlePayOwner} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Amount (৳)</label>
                  <input 
                    type="number" 
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold"
                    placeholder="Enter amount"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{language === 'bn' ? 'রেফারেন্স' : 'Reference'}</label>
                  <input 
                    type="text" 
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                    placeholder="e.g. Online sales settlement March"
                  />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsPayOwnerModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                  >
                    Record Payment
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{t('admin.profile.edit')}</h2>
                <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.profile.name')}</label>
                  <input 
                    type="text" 
                    value={tempProfile.name}
                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.profile.email')}</label>
                  <input 
                    type="email" 
                    value={tempProfile.email}
                    onChange={(e) => setTempProfile({ ...tempProfile, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.profile.phone') || 'Phone'}</label>
                  <input 
                    type="tel" 
                    value={tempProfile.phone}
                    onChange={(e) => setTempProfile({ ...tempProfile, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    {t('admin.profile.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Counter Modal */}
      <AnimatePresence>
        {isCounterModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{t('admin.counter.add')}</h2>
                <button onClick={() => setIsCounterModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddCounter} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.counter.name')}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Mohakhali Counter"
                    value={newCounter.name}
                    onChange={(e) => setNewCounter({ ...newCounter, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.counter.location')}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Dhaka"
                    value={newCounter.location}
                    onChange={(e) => setNewCounter({ ...newCounter, location: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.counter.phone')}</label>
                  <input 
                    type="tel" 
                    placeholder="01XXXXXXXXX"
                    value={newCounter.phone}
                    onChange={(e) => setNewCounter({ ...newCounter, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    {t('admin.counter.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Counter User Modal */}
      <AnimatePresence>
        {isBusModalOpen && selectedBusDetail && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{t('admin.modal.busDetails')} - {selectedBusDetail.name}</h2>
                <button onClick={() => setIsBusModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <div className="space-y-6">
                {selectedBusDetail.imageUrl && (
                  <div className="w-full h-40 rounded-2xl overflow-hidden border border-slate-200">
                    <img src={selectedBusDetail.imageUrl} alt={selectedBusDetail.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.modal.regNo')}</p>
                    <p className="text-sm font-bold text-slate-900 font-mono">{selectedBusDetail.regNo}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.modal.status')}</p>
                    <p className={`text-sm font-bold ${selectedBusDetail.status === 'Active' ? 'text-emerald-600' : 'text-amber-600'}`}>{selectedBusDetail.status}</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.modal.capacity')}</p>
                    <p className="text-sm font-bold text-slate-900">{selectedBusDetail.capacity} {t('admin.modal.seats')}</p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">{t('admin.modal.driverInfo')}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                      {selectedBusDetail.driver.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{selectedBusDetail.driver}</p>
                      <p className="text-xs text-slate-500">{selectedBusDetail.driverPhone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{t('admin.modal.maintenanceHistory')}</p>
                  <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
                    <div className="relative before:absolute before:-left-[1.35rem] before:top-1.5 before:w-3 before:h-3 before:rounded-full before:bg-emerald-500 before:border-2 before:border-white">
                      <p className="text-xs font-bold text-slate-900">{t('admin.modal.lastServiced')}</p>
                      <p className="text-[10px] text-slate-500">{selectedBusDetail.lastMaintenance || 'Not recorded'}</p>
                    </div>
                    <div className="relative before:absolute before:-left-[1.35rem] before:top-1.5 before:w-3 before:h-3 before:rounded-full before:bg-blue-500 before:border-2 before:border-white">
                      <p className="text-xs font-bold text-slate-900">{t('admin.modal.nextScheduled')}</p>
                      <p className="text-[10px] text-slate-500">{selectedBusDetail.nextMaintenance || 'Not scheduled'}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => {
                      setEditingBusId(selectedBusDetail.id);
                      setEditBusData({
                        name: selectedBusDetail.name,
                        regNo: selectedBusDetail.regNo,
                        driver: selectedBusDetail.driver,
                        driverPhone: selectedBusDetail.driverPhone,
                        status: selectedBusDetail.status,
                        route: selectedBusDetail.route,
                        lastMaintenance: selectedBusDetail.lastMaintenance,
                        nextMaintenance: selectedBusDetail.nextMaintenance,
                        capacity: selectedBusDetail.capacity
                      });
                      setActiveTab('Buses');
                      setIsBusModalOpen(false);
                    }}
                    className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit size={18} />
                    {t('admin.modal.editBus')}
                  </button>
                  <button 
                    onClick={() => setIsBusModalOpen(false)}
                    className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all"
                  >
                    {t('admin.action.close')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Register New Bus Modal */}
      <AnimatePresence>
        {isRegisterBusModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{t('admin.modal.registerBus')}</h2>
                <button onClick={() => setIsRegisterBusModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleRegisterBus} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.busName')}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Hanif-A1"
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                      value={newBus.name}
                      onChange={(e) => setNewBus({...newBus, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.regNo')}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Dhaka Metro-Ba..."
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm font-mono"
                      value={newBus.regNo}
                      onChange={(e) => setNewBus({...newBus, regNo: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.driverName')}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Full Name"
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                      value={newBus.driver}
                      onChange={(e) => setNewBus({...newBus, driver: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.driverPhone')}</label>
                    <input 
                      type="tel" 
                      required
                      placeholder="017..."
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                      value={newBus.driverPhone}
                      onChange={(e) => setNewBus({...newBus, driverPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.assignedRoute')}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Dhaka - Chattogram"
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                    value={newBus.route}
                    onChange={(e) => setNewBus({...newBus, route: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.capacitySeats')}</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    placeholder="e.g. 40"
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                    value={newBus.capacity}
                    onChange={(e) => setNewBus({...newBus, capacity: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.manage.owner')}</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                    value={(newBus as any).ownerId || ''}
                    onChange={(e) => setNewBus({...newBus, ownerId: e.target.value} as any)}
                  >
                    <option value="">Select Owner</option>
                    {allUsers.filter(u => u.role === 'owner').map(owner => (
                      <option key={owner.id} value={owner.id}>{owner.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.lastMaintenance')}</label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                      value={newBus.lastMaintenance}
                      onChange={(e) => setNewBus({...newBus, lastMaintenance: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.nextMaintenance')}</label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                      value={newBus.nextMaintenance}
                      onChange={(e) => setNewBus({...newBus, nextMaintenance: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Bus Image</label>
                  <div className="flex items-center gap-4">
                    {newBus.imageUrl ? (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                        <img src={newBus.imageUrl} alt="Bus" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => setNewBus({ ...newBus, imageUrl: '' })}
                          className="absolute top-1 right-1 p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-all"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, 'new');
                          }}
                          className="hidden"
                          id="bus-image-upload"
                        />
                        <label 
                          htmlFor="bus-image-upload"
                          className="flex flex-col items-center justify-center w-full h-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 transition-all"
                        >
                          {isUploading ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              <span className="text-xs font-bold text-slate-400">Uploading...</span>
                            </div>
                          ) : (
                            <>
                              <Plus size={20} className="text-slate-400 mb-1" />
                              <span className="text-xs font-bold text-slate-400">Upload Bus Image</span>
                            </>
                          )}
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    {t('admin.bus.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Route Modal */}
      <AnimatePresence>
        {isRouteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{t('admin.modal.addRoute')}</h2>
                <button onClick={() => setIsRouteModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddRoute} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.from')}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Dhaka"
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                      value={newRoute.from}
                      onChange={(e) => setNewRoute({...newRoute, from: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.to')}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Sylhet"
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                      value={newRoute.to}
                      onChange={(e) => setNewRoute({...newRoute, to: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.distance')}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 240 km"
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                      value={newRoute.distance}
                      onChange={(e) => setNewRoute({...newRoute, distance: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.duration')}</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 6h"
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                      value={newRoute.duration}
                      onChange={(e) => setNewRoute({...newRoute, duration: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.fareBdt')}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 700 BDT"
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                    value={newRoute.fare}
                    onChange={(e) => setNewRoute({...newRoute, fare: e.target.value})}
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    {t('admin.route.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isScheduleModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{t('admin.modal.addSchedule')}</h2>
                <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddSchedule} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.selectBus')}</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                    value={newSchedule.bus_id}
                    onChange={(e) => setNewSchedule({...newSchedule, bus_id: e.target.value})}
                  >
                    <option value="">{t('admin.modal.selectBus')}</option>
                    {buses.map(bus => (
                      <option key={bus.id} value={bus.id}>{bus.name} ({bus.reg_no})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.selectRoute')}</label>
                  <select 
                    required
                    className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                    value={newSchedule.route_id}
                    onChange={(e) => setNewSchedule({...newSchedule, route_id: e.target.value})}
                  >
                    <option value="">{t('admin.modal.selectRoute')}</option>
                    {routes.map(route => (
                      <option key={route.id} value={route.id}>{route.from} {t('home.fare.to')} {route.to} ({route.fare})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.date')}</label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                      value={newSchedule.date}
                      onChange={(e) => setNewSchedule({...newSchedule, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.seats')}</label>
                    <input 
                      type="number" 
                      required
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                      value={newSchedule.available_seats}
                      onChange={(e) => setNewSchedule({...newSchedule, available_seats: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.departure')}</label>
                    <input 
                      type="time" 
                      required
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                      value={newSchedule.departure_time}
                      onChange={(e) => setNewSchedule({...newSchedule, departure_time: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.arrival')}</label>
                    <input 
                      type="time" 
                      required
                      className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-blue-600 transition-all text-sm"
                      value={newSchedule.arrival_time}
                      onChange={(e) => setNewSchedule({...newSchedule, arrival_time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                  >
                    {t('admin.schedule.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Counter User Modal */}
      <AnimatePresence>
        {isCounterUserModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{t('admin.modal.addCounterUser')}</h2>
                <button onClick={() => setIsCounterUserModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddCounterUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.fullName')}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    value={newCounterUser.name}
                    onChange={(e) => setNewCounterUser({ ...newCounterUser, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.email')}</label>
                  <input 
                    type="email" 
                    placeholder="user@counter.com"
                    value={newCounterUser.email}
                    onChange={(e) => setNewCounterUser({ ...newCounterUser, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.password')}</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={newCounterUser.password}
                    onChange={(e) => setNewCounterUser({ ...newCounterUser, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.assignCounter')}</label>
                  <select 
                    value={newCounterUser.counterId}
                    onChange={(e) => setNewCounterUser({ ...newCounterUser, counterId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  >
                    <option value="">{t('admin.modal.assignCounter')}</option>
                    {counters.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.location})</option>
                    ))}
                  </select>
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    {t('admin.user.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{t('admin.modal.addNewUser')}</h2>
                <button onClick={() => setIsAddUserModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.fullName')}</label>
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.email')}</label>
                  <input 
                    type="email" 
                    placeholder="user@example.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.password')}</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.role')}</label>
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="counter">Counter Staff</option>
                    <option value="owner">Bus Owner</option>
                    <option value="company">Bus Company</option>
                  </select>
                </div>
                {newUser.role === 'counter' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.manage.owner')}</label>
                    <select 
                      value={newUser.ownerId}
                      onChange={(e) => setNewUser({ ...newUser, ownerId: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                      required
                    >
                      <option value="">Select Owner</option>
                      {allUsers.filter(u => u.role === 'owner').map(owner => (
                        <option key={owner.id} value={owner.id}>{owner.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    {t('admin.user.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Owner Modal */}
      <AnimatePresence>
        {isOwnerModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{t('admin.manage.owner')}</h2>
                <button onClick={() => setIsOwnerModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddOwner} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.profile.name')}</label>
                  <input 
                    type="text" 
                    placeholder="Owner Name"
                    value={newOwner.name}
                    onChange={(e) => setNewOwner({ ...newOwner, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.profile.email')}</label>
                  <input 
                    type="email" 
                    placeholder="owner@example.com"
                    value={newOwner.email}
                    onChange={(e) => setNewOwner({ ...newOwner, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.password')}</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={newOwner.password}
                    onChange={(e) => setNewOwner({ ...newOwner, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    {t('admin.user.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCompanyModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{language === 'bn' ? 'বাস কোম্পানি যোগ করুন' : 'Add Bus Company'}</h2>
                <button onClick={() => setIsCompanyModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddCompany} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.profile.name')}</label>
                  <input 
                    type="text" 
                    placeholder="Company Name"
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.profile.email')}</label>
                  <input 
                    type="email" 
                    placeholder="company@example.com"
                    value={newCompany.email}
                    onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('admin.modal.password')}</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={newCompany.password}
                    onChange={(e) => setNewCompany({ ...newCompany, password: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    required
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    {t('admin.user.save')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        sticky top-0 left-0 z-[80] h-screen w-[4.5rem] lg:w-64 bg-slate-900 text-slate-400 flex flex-col shrink-0 transition-all duration-300
      `}>
        <div className="p-4 lg:p-6 flex items-center justify-center lg:justify-start border-b border-slate-800 h-14 lg:h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <Bus size={20} />
            </div>
            <span className="text-xl font-bold text-white tracking-tight hidden lg:block">{t('brand.name')} <span className="text-blue-500">Admin</span></span>
          </div>
        </div>

        <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label={t('admin.nav.dashboard')} 
            active={activeTab === 'Dashboard'} 
            onClick={() => setActiveTab('Dashboard')}
          />
          
          {(userProfile?.role === 'admin' || userProfile?.role === 'owner') && (
            <SidebarItem 
              icon={<Bus size={20} />} 
              label={t('admin.nav.buses')} 
              active={activeTab === 'Buses'}
              onClick={() => setActiveTab('Buses')}
            />
          )}

          {userProfile?.role === 'admin' && (
            <>
              <SidebarItem 
                icon={<Map size={20} />} 
                label={t('admin.nav.routes')} 
                active={activeTab === 'Routes'}
                onClick={() => setActiveTab('Routes')}
              />
              <SidebarItem 
                icon={<Clock size={20} />} 
                label={t('admin.nav.schedules')} 
                active={activeTab === 'Schedules'}
                onClick={() => setActiveTab('Schedules')}
              />
              <SidebarItem 
                icon={<Store size={20} />} 
                label={t('admin.nav.counters')} 
                active={activeTab === 'Counters'} 
                onClick={() => setActiveTab('Counters')}
              />
              <SidebarItem 
                icon={<Users size={20} />} 
                label={t('admin.nav.users')} 
                active={activeTab === 'UserManagement'} 
                onClick={() => setActiveTab('UserManagement')}
              />
              <SidebarItem 
                icon={<ShieldCheck size={20} />} 
                label={t('admin.manage.owner')} 
                active={activeTab === 'Owners'} 
                onClick={() => setActiveTab('Owners')}
              />
              <SidebarItem 
                icon={<Building2 size={20} />} 
                label={language === 'bn' ? 'বাস কোম্পানি' : 'Bus Company'} 
                active={activeTab === 'Companies'} 
                onClick={() => setActiveTab('Companies')}
              />
            </>
          )}

          {(userProfile?.role === 'admin' || userProfile?.role === 'counter') && (
            <SidebarItem 
              icon={<Ticket size={20} />} 
              label={t('admin.nav.bookings')} 
              active={activeTab === 'Bookings'}
              onClick={() => setActiveTab('Bookings')}
            />
          )}

          {(userProfile?.role === 'admin' || userProfile?.role === 'owner') && (
            <SidebarItem 
              icon={<CreditCard size={20} />} 
              label={language === 'bn' ? 'হিসাব' : 'Accounts'} 
              active={activeTab === 'Accounts'}
              onClick={() => setActiveTab('Accounts')}
            />
          )}

          {(userProfile?.role === 'admin' || userProfile?.role === 'owner' || userProfile?.role === 'counter') && (
            <SidebarItem 
              icon={<BarChart3 size={20} />} 
              label={language === 'bn' ? 'লেজার' : 'Ledger'} 
              active={activeTab === 'Ledger'}
              onClick={() => {
                setActiveTab('Ledger');
                fetchLedgerEntries();
              }}
            />
          )}

          {(userProfile?.role === 'admin' || userProfile?.role === 'owner' || userProfile?.role === 'counter') && (
            <SidebarItem 
              icon={<TrendingUp size={20} />} 
              label={t('admin.nav.reports')} 
              active={activeTab === 'Reports'}
              onClick={() => setActiveTab('Reports')}
            />
          )}
          
          {userProfile?.role === 'admin' && (
            <>
              <div className="pt-8 pb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-600 hidden lg:block">{t('admin.nav.settings')}</div>
              <SidebarItem 
                icon={<Settings size={20} />} 
                label={t('admin.nav.settings')} 
                active={activeTab === 'Settings'}
                onClick={() => setActiveTab('Settings')}
              />
              <SidebarItem 
                icon={<Menu size={20} />} 
                label={language === 'bn' ? 'মেনু ব্যবস্থাপনা' : 'Menu Management'} 
                active={activeTab === 'Menu'}
                onClick={() => setActiveTab('Menu')}
              />
              <SidebarItem 
                icon={<Briefcase size={20} />} 
                label={language === 'bn' ? 'কর্পোরেট ব্যবস্থাপনা' : 'Corporate Management'} 
                active={activeTab === 'Corporate'}
                onClick={() => setActiveTab('Corporate')}
              />
            </>
          )}
          <SidebarItem 
            icon={<Home size={20} />} 
            label={t('dashboard.header.backToHome')} 
            onClick={onBack} 
          />
          <SidebarItem icon={<LogOut size={20} />} label={t('nav.logout')} onClick={onLogout} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => {
              setTempProfile({ ...adminProfile });
              setIsProfileModalOpen(true);
            }}
            className="w-full flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-all text-left justify-center lg:justify-start"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
              {adminProfile.name.charAt(0)}
            </div>
            <div className="hidden lg:block overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{adminProfile.name}</p>
              <p className="text-xs truncate text-slate-500">{adminProfile.email}</p>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-x-hidden">
        {/* Top Header */}
        <header className="h-[74px] bg-emerald-600 border-b border-emerald-700/20 px-3 lg:px-8 flex items-center justify-between sticky top-0 z-10 shadow-md">
          <div className="flex items-center gap-2 lg:gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-xl text-white transition-all"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center bg-white/10 rounded-full px-3 lg:px-4 py-1.5 lg:py-2 w-full max-w-[160px] sm:max-w-md border border-white/20 focus-within:ring-2 focus-within:ring-white/30 transition-all">
              <Search size={16} className="text-white/60" />
              <input 
                type="text" 
                placeholder={t('admin.search.placeholder')} 
                className="bg-transparent border-none outline-none ml-2 text-xs lg:text-sm w-full text-white placeholder:text-white/50" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 lg:gap-4 relative">
            <button 
              onClick={onBack}
              className="flex items-center gap-2 bg-white text-emerald-600 px-2.5 lg:px-4 py-2 rounded-xl text-[10px] lg:text-xs font-bold transition-all shadow-sm hover:bg-emerald-50"
            >
              <Home size={14} />
              <span className="hidden sm:inline">{t('dashboard.header.backToHome')}</span>
            </button>
            <div className="relative">
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={`p-1.5 lg:p-2 rounded-full transition-all relative ${isNotificationsOpen ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-white/80'}`}
              >
                <Bell className="w-[18px] h-[18px] lg:w-5 lg:h-5" />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>
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
                        <h3 className="font-bold text-slate-900 text-sm">{t('admin.notifications')}</h3>
                        <button 
                          onClick={() => setNotifications(notifications.map(n => ({ ...n, unread: false })))}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider"
                        >
                          {t('dashboard.header.markAllRead')}
                        </button>
                      </div>
                      <div className="max-h-[350px] overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notification) => (
                            <div 
                              key={notification.id} 
                              className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer relative ${notification.unread ? 'bg-blue-50/30' : ''}`}
                            >
                              {notification.unread && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
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
                            <p className="text-sm text-slate-400">{t('admin.notifications.empty')}</p>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-slate-50/50 border-t border-slate-50 text-center">
                        <button className="text-xs font-bold text-slate-500 hover:text-slate-700 transition-all">
                          {t('admin.notifications.viewAll')}
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
            <div className="h-6 lg:h-8 w-[1px] bg-slate-200 mx-1 lg:mx-2"></div>
            <button 
              onClick={() => {
                setTempProfile({ ...adminProfile });
                setIsProfileModalOpen(true);
              }}
              className="flex items-center gap-2 hover:bg-slate-50 p-1.5 lg:p-2 rounded-xl transition-all"
            >
              <p className="text-xs lg:text-sm font-bold text-slate-700">{adminProfile.name}</p>
              <User size={20} />
            </button>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 lg:p-8 space-y-4 lg:space-y-8">
          {activeTab === 'Dashboard' ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{t('admin.dashboard.overview')}</h1>
                  <p className="text-slate-500 text-[11px] lg:text-sm">{t('admin.dashboard.welcome')}</p>
                </div>
                {(userProfile?.role === 'admin' || userProfile?.role === 'owner') && (
                  <button 
                    onClick={() => handleGenerateReport('General Dashboard Summary')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs lg:text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all w-full sm:w-auto"
                  >
                    {t('admin.dashboard.generateReport')}
                  </button>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                {DYNAMIC_STATS.filter(stat => {
                  if (userProfile?.role === 'counter') {
                    return ['Total Tickets', 'Today Sales'].includes(stat.label);
                  }
                  return true;
                }).map((stat, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white p-3 lg:p-6 rounded-2xl border border-slate-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-2 lg:mb-4">
                      <div className={`p-2 lg:p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                        {React.cloneElement(stat.icon as React.ReactElement, { size: 16 } as any)}
                      </div>
                      <span className={`text-[9px] lg:text-[10px] font-bold px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full ${stat.color} ${stat.bg}`}>
                        {stat.change}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[10px] lg:text-sm font-medium">{stat.label}</p>
                    <h3 className="text-lg lg:text-2xl font-bold text-slate-900 mt-0.5 lg:mt-1">{stat.value}</h3>
                  </motion.div>
                ))}
              </div>

              {/* Table Section */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 lg:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-4">
                  <h3 className="font-bold text-sm lg:text-base text-slate-900">{t('admin.dashboard.todaySummary')}</h3>
                  <div className="flex flex-wrap gap-2">
                    <div className="relative min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder={language === 'bn' ? 'যাত্রী বা ফোন দিয়ে খুঁজুন' : 'Search passenger...'} 
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-100 transition-all font-medium"
                      />
                    </div>
                    <select 
                      value={statusFilter}
                      onChange={(e) => {
                        setStatusFilter(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-blue-100 transition-all font-bold text-slate-600 appearance-none min-w-[100px]"
                    >
                      <option value="All">{language === 'bn' ? 'সকল স্ট্যাটাস' : 'All Status'}</option>
                      <option value="Confirmed">{language === 'bn' ? 'কনফার্ম' : 'Confirmed'}</option>
                      <option value="Cancelled">{language === 'bn' ? 'বাতিল' : 'Cancelled'}</option>
                    </select>
                    <button 
                      onClick={() => {
                        setSearchQuery('');
                        setStatusFilter('All');
                        setCurrentPage(1);
                      }}
                      className="text-[10px] lg:text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all text-blue-600"
                    >
                      {t('common.clear')}
                    </button>
                    <button className="hidden sm:flex text-[10px] lg:text-xs font-bold px-2 py-1.5 lg:px-3 lg:py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all">{t('common.export')}</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px] lg:min-w-0">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.bookingId')}</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.passenger')}</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.phoneId')}</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.route')}</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.time')}</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.status')}</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.amount')}</th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-wider text-right">{t('admin.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedBookings.filter(b => {
                        if (userProfile?.role === 'counter') {
                          return b.counter === userProfile.counterName;
                        }
                        return true;
                      }).map((booking, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-bold text-blue-600">BK-{formatNumber(booking.id)}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <div className="flex items-center gap-2 lg:gap-3">
                              <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px] lg:text-xs">
                                {booking.passenger.charAt(0)}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs lg:text-sm font-semibold text-slate-700">{booking.passenger}</span>
                                <span className="text-[10px] text-slate-400">{booking.address || t('common.noAddress')}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-700">{booking.phone || booking.phone_number}</span>
                              <span className="text-[10px] text-slate-400">{t('common.id')}: {formatNumber(booking.passengerId || booking.passenger_id) || t('common.na')}</span>
                            </div>
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-slate-600 font-medium">{booking.route}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm text-slate-500">{booking.time}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4">
                            <span className={`text-[9px] lg:text-[10px] font-bold px-1.5 py-0.5 lg:px-2 lg:py-1 rounded-full uppercase tracking-wider ${
                              booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {booking.status === 'Confirmed' ? t('status.confirmed') : t('status.cancelled')}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-xs lg:text-sm font-bold text-slate-900">{formatCurrency(booking.amount)}</td>
                          <td className="px-4 lg:px-6 py-3 lg:py-4 text-right">
                            <button className="p-1 rounded hover:bg-slate-200 text-slate-400 transition-all">
                              <MoreVertical size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 lg:p-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-[10px] lg:text-xs font-bold text-slate-500">
                    {t('common.showing')} {formatNumber(startIndex + 1)} {t('common.to')} {formatNumber(Math.min(startIndex + itemsPerPage, bookings.length))} {t('common.of')} {formatNumber(bookings.length)}
                  </div>
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 lg:p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-6 h-6 lg:w-8 lg:h-8 rounded-lg text-[10px] lg:text-xs font-bold transition-all ${
                              currentPage === page 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                                : 'hover:bg-white border border-transparent hover:border-slate-200 text-slate-600'
                            }`}
                          >
                            {formatNumber(page)}
                          </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 lg:p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Bus Status Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="lg:col-span-2 bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-sm lg:text-base text-slate-900 mb-4 lg:mb-6">{t('admin.dashboard.liveBusStatus')}</h3>
                  <div className="space-y-3 lg:space-y-4">
                    <BusStatusItem bus="Hanif-A1" route="Dhaka - CTG" progress={75} status={t('status.onTime')} formatNumber={formatNumber} t={t} />
                    <BusStatusItem bus="Ena-B4" route="Dhaka - Sylhet" progress={30} status={t('status.delayed')} formatNumber={formatNumber} t={t} />
                    <BusStatusItem bus="Green-C9" route="Dhaka - Rajshahi" progress={95} status={t('common.arriving')} formatNumber={formatNumber} t={t} />
                  </div>
                </div>
                <div className="bg-white p-4 lg:p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-sm lg:text-base text-slate-900 mb-4 lg:mb-6">{t('admin.dashboard.quickActions')}</h3>
                  <div className="grid grid-cols-2 gap-2 lg:gap-3">
                    {userProfile?.role === 'admin' && (
                      <>
                        <QuickActionBtn icon={<Bus size={16} />} label={t('admin.dashboard.addBus')} onClick={() => setIsRegisterBusModalOpen(true)} />
                        <QuickActionBtn icon={<Map size={16} />} label={t('admin.dashboard.newRoute')} onClick={() => setIsRouteModalOpen(true)} />
                        <QuickActionBtn 
                          icon={<Store size={16} />} 
                          label={t('admin.dashboard.addCounter')} 
                          onClick={() => setIsCounterModalOpen(true)} 
                        />
                      </>
                    )}
                    {(userProfile?.role === 'admin' || userProfile?.role === 'counter') && (
                      <QuickActionBtn icon={<Ticket size={16} />} label={t('admin.dashboard.bookTicket')} onClick={() => onBack()} />
                    )}
                    {userProfile?.role === 'owner' && (
                      <QuickActionBtn icon={<BarChart3 size={16} />} label="View Reports" onClick={() => setActiveTab('Reports')} />
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'Counters' && userProfile?.role === 'admin' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{t('admin.manage.counters.title')}</h1>
                  <p className="text-slate-500 text-[11px] lg:text-sm">{t('admin.manage.counters.desc')}</p>
                </div>
                <button 
                  onClick={() => setIsCounterModalOpen(true)}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs lg:text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  {t('admin.modal.addCounter')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {counters.map(counter => (
                  <motion.div 
                    key={counter.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Store size={24} />
                      </div>
                      <div className="flex-1">
                        {editingCounterId === counter.id ? (
                          <input 
                            type="text" 
                            value={editCounterData.name}
                            onChange={(e) => setEditCounterData({ ...editCounterData, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        ) : (
                          <h3 className="font-bold text-slate-900">{counter.name}</h3>
                        )}
                        {editingCounterId === counter.id ? (
                          <input 
                            type="text" 
                            value={editCounterData.location}
                            onChange={(e) => setEditCounterData({ ...editCounterData, location: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs mt-1 outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        ) : (
                          <p className="text-xs text-slate-500">{counter.location}</p>
                        )}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                      <div className="text-xs font-medium text-slate-600 flex-1">
                        <p className="text-slate-400 uppercase tracking-widest text-[10px] font-bold mb-1">{t('admin.table.phone')}</p>
                        {editingCounterId === counter.id ? (
                          <input 
                            type="text" 
                            value={editCounterData.phone}
                            onChange={(e) => setEditCounterData({ ...editCounterData, phone: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-100"
                          />
                        ) : (
                          counter.phone
                        )}
                      </div>
                      <div className="flex gap-2">
                        {editingCounterId === counter.id ? (
                          <>
                            <button 
                              onClick={() => handleSaveCounterEdit(counter.id)}
                              className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
                            >
                              {t('common.save')}
                            </button>
                            <button 
                              onClick={() => { setEditingCounterId(null); setEditCounterData(null); }}
                              className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-300 transition-all"
                            >
                              {t('common.cancel')}
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => { setEditingCounterId(counter.id); setEditCounterData({ ...counter }); }}
                            className="text-blue-600 text-xs font-bold hover:underline"
                          >
                            {t('admin.table.editDetails')}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : activeTab === 'Buses' && (userProfile?.role === 'admin' || userProfile?.role === 'owner') ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{t('admin.manage.buses.title')}</h1>
                  <p className="text-slate-500 text-[11px] lg:text-sm">{t('admin.manage.buses.desc')}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder={language === 'bn' ? 'বাস অথবা ডাইভার দিয়ে খুঁজুন' : 'Search bus...'} 
                      value={busSearchQuery}
                      onChange={(e) => setBusSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                  {userProfile?.role === 'admin' && (
                    <button 
                      onClick={() => setIsRegisterBusModalOpen(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs lg:text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all w-full sm:w-auto"
                    >
                      {t('admin.modal.registerBus')}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.busNameReg')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.driverDetails')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.maintenance')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.capacity')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.status')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">{t('admin.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBuses.map((bus) => (
                        <tr key={bus.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center overflow-hidden border border-slate-100 cursor-zoom-in"
                                onClick={() => {
                                  if (bus.imageUrl) {
                                    setPreviewImage(bus.imageUrl);
                                    setIsPreviewOpen(true);
                                  }
                                }}
                              >
                                {bus.imageUrl ? (
                                  <img src={bus.imageUrl} alt={bus.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <Bus size={20} />
                                )}
                              </div>
                              <div>
                                {editingBusId === bus.id ? (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <input 
                                        type="text" 
                                        value={editBusData.name}
                                        onChange={(e) => setEditBusData({ ...editBusData, name: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                      />
                                      <div className="relative shrink-0">
                                        <input 
                                          type="file" 
                                          accept="image/*"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(file, 'edit');
                                          }}
                                          className="hidden"
                                          id={`edit-bus-image-${bus.id}`}
                                        />
                                        <label 
                                          htmlFor={`edit-bus-image-${bus.id}`}
                                          className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all cursor-pointer block"
                                        >
                                          {isUploading ? (
                                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                          ) : (
                                            <Edit size={12} />
                                          )}
                                        </label>
                                      </div>
                                    </div>
                                    <input 
                                      type="text" 
                                      value={editBusData.regNo}
                                      onChange={(e) => setEditBusData({ ...editBusData, regNo: e.target.value })}
                                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm font-bold text-slate-900">{bus.name}</p>
                                    <p className="text-[10px] text-slate-500 font-mono">{bus.regNo}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {editingBusId === bus.id ? (
                              <div className="space-y-1">
                                <input 
                                  type="text" 
                                  value={editBusData.driver}
                                  onChange={(e) => setEditBusData({ ...editBusData, driver: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100"
                                />
                                <input 
                                  type="text" 
                                  value={editBusData.driverPhone}
                                  onChange={(e) => setEditBusData({ ...editBusData, driverPhone: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-100"
                                />
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-semibold text-slate-700">{bus.driver}</p>
                                <p className="text-xs text-slate-500">{bus.driverPhone}</p>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingBusId === bus.id ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] font-bold text-slate-400 uppercase">{t('admin.table.last')}:</span>
                                  <input 
                                    type="date" 
                                    value={editBusData.lastMaintenance}
                                    onChange={(e) => setEditBusData({ ...editBusData, lastMaintenance: e.target.value })}
                                    className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] outline-none focus:ring-2 focus:ring-blue-100"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] font-bold text-blue-400 uppercase">{t('admin.table.next')}:</span>
                                  <input 
                                    type="date" 
                                    value={editBusData.nextMaintenance}
                                    onChange={(e) => setEditBusData({ ...editBusData, nextMaintenance: e.target.value })}
                                    className="bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[10px] outline-none focus:ring-2 focus:ring-blue-100"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">{t('admin.table.last')}: {bus.lastMaintenance}</p>
                                <p className="text-[10px] text-blue-600 uppercase font-bold">{t('admin.table.next')}: {bus.nextMaintenance}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingBusId === bus.id ? (
                              <input 
                                type="number" 
                                value={editBusData.capacity}
                                onChange={(e) => setEditBusData({ ...editBusData, capacity: parseInt(e.target.value) || 0 })}
                                className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                              />
                            ) : (
                              <p className="text-sm font-bold text-slate-700">{formatNumber(bus.capacity)} {t('common.seats')}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingBusId === bus.id ? (
                              <select 
                                value={editBusData.status}
                                onChange={(e) => setEditBusData({ ...editBusData, status: e.target.value })}
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-100"
                              >
                                <option value="Active">{t('status.active')}</option>
                                <option value="Maintenance">{t('status.maintenance')}</option>
                                <option value="Inactive">{t('status.inactive')}</option>
                              </select>
                            ) : (
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                bus.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                              }`}>
                                {bus.status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {editingBusId === bus.id ? (
                                <>
                                  <button 
                                    onClick={() => handleSaveBusEdit(bus.id)}
                                    className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
                                  >
                                    {t('common.save')}
                                  </button>
                                  <button 
                                    onClick={() => { setEditingBusId(null); setEditBusData(null); }}
                                    className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-300 transition-all"
                                  >
                                    {t('common.cancel')}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => { setEditingBusId(bus.id); setEditBusData({ ...bus }); }}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                                  >
                                    {t('common.edit')}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setSelectedBusDetail(bus);
                                      setIsBusModalOpen(true);
                                    }}
                                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                  >
                                    {t('common.view')}
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setTrackingBusId(bus.id);
                                      setIsTrackingModalOpen(true);
                                    }}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center gap-1"
                                  >
                                    <MapPin size={12} />
                                    {t('common.track') || 'Track'}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'Routes' && userProfile?.role === 'admin' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{t('admin.manage.routes.title')}</h1>
                  <p className="text-slate-500 text-[11px] lg:text-sm">{t('admin.manage.routes.desc')}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={async () => {
                      const POPULAR_ROUTES = [
                        { from: 'Dhaka', to: 'Chittagong', distance: '265KM', fare: '680' },
                        { from: 'Dhaka', to: "Cox's Bazar", distance: '390 KM', fare: '1050' },
                        { from: 'Dhaka', to: 'Barisal', distance: '247 KM', fare: '500' },
                        { from: 'Dhaka', to: 'Patuakhali', distance: '281 KM', fare: '650' },
                        { from: 'Dhaka', to: 'Kuakata', distance: '349 KM', fare: '750' },
                        { from: 'Dhaka', to: 'Barguna', distance: '293 KM', fare: '670' },
                        { from: 'Dhaka', to: 'Teknaf', distance: '458 KM', fare: '1200' },
                        { from: 'Dhaka', to: 'Khagrachari', distance: '270 KM', fare: '750' },
                        { from: 'Dhaka', to: 'Bandarban', distance: '376 KM', fare: '850' },
                        { from: 'Dhaka', to: 'Rangamati', distance: '304 KM', fare: '850' },
                        { from: 'Dhaka', to: 'Bagerhat', distance: '216KM', fare: '650' },
                        { from: 'Dhaka', to: 'Pirojpur', distance: '205KM', fare: '650' },
                        { from: 'Dhaka', to: 'Faridpur', distance: '119 KM', fare: '400' },
                        { from: 'Dhaka', to: 'Gopalganj', distance: '158 KM', fare: '500' },
                        { from: 'Dhaka', to: 'Sirajganj', distance: '127 KM', fare: '350' },
                        { from: 'Dhaka', to: 'Natore', distance: '164KM', fare: '600' },
                        { from: 'Dhaka', to: 'Rajshahi', distance: '245 KM', fare: '700' },
                        { from: 'Dhaka', to: 'Chapainawabganj', distance: '316 KM', fare: '800' },
                        { from: 'Dhaka', to: 'Jhalokathi', distance: '240KM', fare: '550' },
                        { from: 'Dhaka', to: 'Moulvibazar', distance: '198KM', fare: '550' },
                        { from: 'Dhaka', to: 'Magura', distance: '167KM', fare: '500' },
                        { from: 'Dhaka', to: 'Jessore', distance: '192KM', fare: '550' },
                        { from: 'Dhaka', to: 'Dinajpur', distance: '330 KM', fare: '700' },
                        { from: 'Dhaka', to: 'Bogura', distance: '192KM', fare: '550' },
                        { from: 'Dhaka', to: 'Panchagarh', distance: '408 KM', fare: '1050' },
                        { from: 'Dhaka', to: 'Rangpur', distance: '316 KM', fare: '700' },
                        { from: 'Dhaka', to: 'Naogaon', distance: '240K', fare: '680' },
                        { from: 'Dhaka', to: 'Gaibandha', distance: '264KM', fare: '700' },
                        { from: 'Dhaka', to: 'Nilphamari', distance: '354KM', fare: '700' },
                        { from: 'Dhaka', to: 'Kushtia', distance: '248KM', fare: '650' },
                        { from: 'Dhaka', to: 'Jhenaidah', distance: '196KM', fare: '650' },
                        { from: 'Dhaka', to: 'Meherpur', distance: '269KM', fare: '650' },
                        { from: 'Dhaka', to: 'Tangail', distance: '96KM', fare: '300' },
                        { from: 'Dhaka', to: 'Comilla', distance: '109 KM', fare: '500' },
                        { from: 'Dhaka', to: 'Satkhira', distance: '274KM', fare: '650' },
                        { from: 'Dhaka', to: 'Pabna', distance: '160KM', fare: '500' },
                        { from: 'Dhaka', to: 'Sherpur', distance: '187 KM', fare: '600' },
                        { from: 'Dhaka', to: 'Sylhet', distance: '245KM', fare: '700' },
                        { from: 'Dhaka', to: 'Sunamganj', distance: '260KM', fare: '800' },
                        { from: 'Dhaka', to: 'Khulna', distance: '246KM', fare: '600' },
                        { from: 'Chittagong', to: 'Dhaka', distance: '265KM', fare: '550' },
                        { from: 'Chittagong', to: "Cox's Bazar", distance: '145 KM', fare: '350' },
                        { from: 'Chittagong', to: 'Rajshahi', distance: '502KM', fare: '800' },
                        { from: 'Chittagong', to: 'Chapainawabganj', distance: '551KM', fare: '900' },
                        { from: "Cox's Bazar", to: 'Dhaka', distance: '402KM', fare: '900' },
                        { from: "Cox's Bazar", to: 'Chittagong', distance: '150 KM', fare: '500' },
                        { from: "Cox's Bazar", to: 'Khagrachari', distance: '256K', fare: '720' },
                        { from: 'Khulna', to: 'Dhaka', distance: '246KM', fare: '600' },
                        { from: 'Khulna', to: 'Chittagong', distance: '442 KM', fare: '900' },
                        { from: 'Jessore', to: 'Dhaka', distance: '186KM', fare: '550' },
                        { from: 'Magura', to: 'Dhaka', distance: '169KM', fare: '500' },
                        { from: 'Gazipur', to: 'Barisal', distance: '205KM', fare: '650' },
                        { from: 'Bandarban', to: 'Dhaka', distance: '376KM', fare: '870' },
                        { from: 'Barisal', to: 'Gazipur', distance: '205KM', fare: '650' },
                        { from: 'Barisal', to: 'Dhaka', distance: '180KM', fare: '500' },
                        { from: 'Jhalokathi', to: 'Dhaka', distance: '205KM', fare: '600' },
                        { from: 'Barguna', to: 'Dhaka', distance: '293KM', fare: '700' },
                        { from: 'Patuakhali', to: 'Dhaka', distance: '225KM', fare: '600' },
                        { from: 'Rangpur', to: 'Dhaka', distance: '294 KM', fare: '700' }
                      ];

                      const toastId = toast.loading('Initializing popular routes...');
                      try {
                        const normalizeCity = (name: string) => {
                          const lower = (name || '').toLowerCase().trim();
                          if (lower === 'chittagong') return 'chattogram';
                          return lower;
                        };

                        const cityTranslations: Record<string, { en: string; bn: string }> = {
                          'Dhaka': { en: 'Dhaka', bn: 'ঢাকা' },
                          'Chittagong': { en: 'Chattogram', bn: 'চট্টগ্রাম' },
                          "Cox's Bazar": { en: "Cox's Bazar", bn: 'কক্সবাজার' },
                          'Barisal': { en: 'Barisal', bn: 'বরিশাল' },
                          'Patuakhali': { en: 'Patuakhali', bn: 'পটুয়াখালী' },
                          'Kuakata': { en: 'Kuakata', bn: 'কুয়াকাটা' },
                          'Barguna': { en: 'Barguna', bn: 'বরগুনা' },
                          'Teknaf': { en: 'Teknaf', bn: 'টেকনাফ' },
                          'Khagrachari': { en: 'Khagrachari', bn: 'খাগড়াছড়ি' },
                          'Bandarban': { en: 'Bandarban', bn: 'বান্দরবান' },
                          'Rangamati': { en: 'Rangamati', bn: 'রাঙ্গামাটি' },
                          'Bagerhat': { en: 'Bagerhat', bn: 'বাগেরহাট' },
                          'Pirojpur': { en: 'Pirojpur', bn: 'পিরোজপুর' },
                          'Faridpur': { en: 'Faridpur', bn: 'ফریدপুর' },
                          'Gopalganj': { en: 'Gopalganj', bn: 'গোপালগঞ্জ' },
                          'Sirajganj': { en: 'Sirajganj', bn: 'সিরাজগঞ্জ' },
                          'Natore': { en: 'Natore', bn: 'নাটোর' },
                          'Rajshahi': { en: 'Rajshahi', bn: 'রাজশাহী' },
                          'Chapainawabganj': { en: 'Chapainawabganj', bn: 'চাঁপাইনবাবগঞ্জ' },
                          'Jhalokathi': { en: 'Jhalokathi', bn: 'ঝালকাঠি' },
                          'Moulvibazar': { en: 'Moulvibazar', bn: 'মৌলভীবাজার' },
                          'Magura': { en: 'Magura', bn: 'মাগুরা' },
                          'Jessore': { en: 'Jessore', bn: 'যশোর' },
                          'Dinajpur': { en: 'Dinajpur', bn: 'দিনাজপুর' },
                          'Bogura': { en: 'Bogra', bn: 'বগুড়া' },
                          'Panchagarh': { en: 'Panchagarh', bn: 'পঞ্চগড়' },
                          'Rangpur': { en: 'Rangpur', bn: 'রংপুর' },
                          'Naogaon': { en: 'Naogaon', bn: 'নওগাঁ' },
                          'Gaibandha': { en: 'Gaibandha', bn: 'গাইবান্ধা' },
                          'Nilphamari': { en: 'Nilphamari', bn: 'নীলফামারী' },
                          'Kushtia': { en: 'Kushtia', bn: 'কুষ্টিয়া' },
                          'Jhenaidah': { en: 'Jhenaidah', bn: 'ঝিনাইদহ' },
                          'Meherpur': { en: 'Meherpur', bn: 'মেহেরপুর' },
                          'Tangail': { en: 'Tangail', bn: 'টাঙ্গাইল' },
                          'Comilla': { en: 'Cumilla', bn: 'কুমিল্লা' },
                          'Satkhira': { en: 'Satkhira', bn: 'সাতক্ষীরা' },
                          'Pabna': { en: 'Pabna', bn: 'পাবনা' },
                          'Sherpur': { en: 'Sherpur', bn: 'শেরপুর' },
                          'Sylhet': { en: 'Sylhet', bn: 'সিলেট' },
                          'Sunamganj': { en: 'Sunamganj', bn: 'সুনামগঞ্জ' },
                          'Khulna': { en: 'Khulna', bn: 'খুলনা' },
                          'Gazipur': { en: 'Gazipur', bn: 'গাজীপুর' }
                        };

                        const routesToCreate = POPULAR_ROUTES.filter(route => {
                          const exists = routes.some(r => {
                            const rFrom = normalizeCity(r.from_city_en || r.from || '');
                            const rTo = normalizeCity(r.to_city_en || r.to || '');
                            const routeFrom = normalizeCity(route.from);
                            const routeTo = normalizeCity(route.to);
                            return rFrom === routeFrom && rTo === routeTo;
                          });
                          return !exists;
                        });

                        if (routesToCreate.length === 0) {
                          toast.success('All popular routes are already initialized!', { id: toastId });
                          return;
                        }

                        // Call concurrently in parallel for dramatic speedup
                        await Promise.all(routesToCreate.map(async (route) => {
                          const fromTrans = cityTranslations[route.from] || { en: route.from, bn: route.from };
                          const toTrans = cityTranslations[route.to] || { en: route.to, bn: route.to };
                          return fetch('/api/routes', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              from_city: fromTrans.en,
                              from_city_en: fromTrans.en,
                              from_city_bn: fromTrans.bn,
                              to_city: toTrans.en,
                              to_city_en: toTrans.en,
                              to_city_bn: toTrans.bn,
                              distance: route.distance,
                              duration: '6h',
                              fare: route.fare,
                              status: 'Active'
                            })
                          });
                        }));

                        await fetchData();
                        toast.success(`Successfully initialized ${routesToCreate.length} popular routes!`, { id: toastId });
                      } catch (error) {
                        console.error('Failed to initialize routes:', error);
                        toast.error('Failed to initialize routes', { id: toastId });
                      }
                    }}
                    className="w-full sm:w-auto bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-xs lg:text-sm shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                  >
                    Initialize Popular Routes
                  </button>
                  <button 
                    onClick={() => setIsRouteModalOpen(true)}
                    className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs lg:text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                  >
                    {t('admin.modal.addRoute')}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.routePath')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.distanceDuration')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.fare')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.status')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">{t('admin.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedRoutes.map((route) => (
                        <tr key={route.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Map size={20} />
                              </div>
                              <div>
                                {editingRouteId === route.id ? (
                                  <div className="flex gap-2 items-center">
                                    <input 
                                      type="text" 
                                      value={editRouteData.from}
                                      onChange={(e) => setEditRouteData({ ...editRouteData, from: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                    <span className="text-xs text-slate-400">{t('common.to')}</span>
                                    <input 
                                      type="text" 
                                      value={editRouteData.to}
                                      onChange={(e) => setEditRouteData({ ...editRouteData, to: e.target.value })}
                                      className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                    />
                                  </div>
                                ) : (
                                  <p className="text-sm font-bold text-slate-900">{route.from} {t('common.to')} {route.to}</p>
                                )}
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{t('admin.table.standardRoute')}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {editingRouteId === route.id ? (
                              <div className="space-y-1">
                                <input 
                                  type="text" 
                                  value={editRouteData.distance}
                                  onChange={(e) => setEditRouteData({ ...editRouteData, distance: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100"
                                />
                                <input 
                                  type="text" 
                                  value={editRouteData.duration}
                                  onChange={(e) => setEditRouteData({ ...editRouteData, duration: e.target.value })}
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-blue-100"
                                />
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-semibold text-slate-700">{route.distance}</p>
                                <p className="text-xs text-slate-500">{t('common.est')} {route.duration}</p>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingRouteId === route.id ? (
                              <input 
                                type="text" 
                                value={editRouteData.fare}
                                onChange={(e) => setEditRouteData({ ...editRouteData, fare: e.target.value })}
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold text-blue-600 outline-none focus:ring-2 focus:ring-blue-100"
                              />
                            ) : (
                              <p className="text-sm font-bold text-blue-600">{route.fare}</p>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingRouteId === route.id ? (
                              <select 
                                value={editRouteData.status}
                                onChange={(e) => setEditRouteData({ ...editRouteData, status: e.target.value })}
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-100"
                              >
                                <option value="Active">{t('status.active')}</option>
                                <option value="Inactive">{t('status.inactive')}</option>
                              </select>
                            ) : (
                              <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                {route.status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {editingRouteId === route.id ? (
                                <>
                                  <button 
                                    onClick={() => handleSaveRouteEdit(route.id)}
                                    className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
                                  >
                                    {t('common.save')}
                                  </button>
                                  <button 
                                    onClick={() => { setEditingRouteId(null); setEditRouteData(null); }}
                                    className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-300 transition-all"
                                  >
                                    {t('common.cancel')}
                                  </button>
                                </>
                              ) : (
                                <button 
                                  onClick={() => { setEditingRouteId(route.id); setEditRouteData({ ...route }); }}
                                  className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Route Pagination */}
                {totalRoutePages > 1 && (
                  <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-500">
                      Showing {routeStartIndex + 1} to {Math.min(routeStartIndex + routesPerPage, routes.length)} of {routes.length} routes
                    </p>
                    <div className="flex items-center gap-2">
                      <button 
                        disabled={currentRoutePage === 1}
                        onClick={() => setCurrentRoutePage(prev => Math.max(1, prev - 1))}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <div className="flex items-center gap-1">
                        {[...Array(totalRoutePages)].map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setCurrentRoutePage(i + 1)}
                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                              currentRoutePage === i + 1 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </div>
                      <button 
                        disabled={currentRoutePage === totalRoutePages}
                        onClick={() => setCurrentRoutePage(prev => Math.min(totalRoutePages, prev + 1))}
                        className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'Schedules' && userProfile?.role === 'admin' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{t('admin.manage.schedules.title')}</h1>
                  <p className="text-slate-500 text-[11px] lg:text-sm">{t('admin.manage.schedules.desc')}</p>
                </div>
                <button 
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs lg:text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                >
                  {t('admin.modal.addSchedule')}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.busRoute')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.dateTime')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.availability')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.status')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">{t('admin.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {schedules.map((schedule) => (
                        <tr key={schedule.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Bus size={20} />
                              </div>
                              <div>
                                {editingScheduleId === schedule.id ? (
                                  <div className="space-y-1">
                                    <select 
                                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                      value={editScheduleData.bus_id}
                                      onChange={(e) => setEditScheduleData({ ...editScheduleData, bus_id: e.target.value })}
                                    >
                                      {buses.map(bus => (
                                        <option key={bus.id} value={bus.id}>{bus.name}</option>
                                      ))}
                                    </select>
                                    <select 
                                      className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] outline-none focus:ring-2 focus:ring-blue-100"
                                      value={editScheduleData.route_id}
                                      onChange={(e) => setEditScheduleData({ ...editScheduleData, route_id: e.target.value })}
                                    >
                                      {routes.map(route => (
                                        <option key={route.id} value={route.id}>{route.from} to {route.to}</option>
                                      ))}
                                    </select>
                                  </div>
                                ) : (
                                  <>
                                    <p className="text-sm font-bold text-slate-900">{schedule.busName}</p>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{schedule.routeFrom} to {schedule.routeTo}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {editingScheduleId === schedule.id ? (
                              <div className="space-y-1">
                                <input 
                                  type="date" 
                                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-100"
                                  value={editScheduleData.date}
                                  onChange={(e) => setEditScheduleData({ ...editScheduleData, date: e.target.value })}
                                />
                                <div className="flex gap-1">
                                  <input 
                                    type="time" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-1 py-1 text-[10px] outline-none focus:ring-2 focus:ring-blue-100"
                                    value={editScheduleData.departure_time}
                                    onChange={(e) => setEditScheduleData({ ...editScheduleData, departure_time: e.target.value })}
                                  />
                                  <input 
                                    type="time" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-1 py-1 text-[10px] outline-none focus:ring-2 focus:ring-blue-100"
                                    value={editScheduleData.arrival_time}
                                    onChange={(e) => setEditScheduleData({ ...editScheduleData, arrival_time: e.target.value })}
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 text-slate-700">
                                  <Calendar size={14} className="text-slate-400" />
                                  <span className="text-sm font-semibold">{schedule.date}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500 mt-1">
                                  <Clock size={14} className="text-slate-400" />
                                  <span className="text-xs">{schedule.departure_time} - {schedule.arrival_time}</span>
                                </div>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingScheduleId === schedule.id ? (
                              <input 
                                type="number" 
                                className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                value={editScheduleData.available_seats}
                                onChange={(e) => setEditScheduleData({ ...editScheduleData, available_seats: parseInt(e.target.value) })}
                              />
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden max-w-[100px]">
                                  <div 
                                    className="bg-blue-600 h-full rounded-full" 
                                    style={{ width: `${(schedule.available_seats / 40) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-bold text-slate-600">{schedule.available_seats}/40</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingScheduleId === schedule.id ? (
                              <select 
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                value={editScheduleData.status}
                                onChange={(e) => setEditScheduleData({ ...editScheduleData, status: e.target.value })}
                              >
                                <option value="On Time">{t('status.onTime')}</option>
                                <option value="Delayed">{t('status.delayed')}</option>
                                <option value="Cancelled">{t('status.cancelled')}</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                schedule.status === 'On Time' ? 'bg-emerald-50 text-emerald-600' :
                                schedule.status === 'Delayed' ? 'bg-amber-50 text-amber-600' :
                                'bg-rose-50 text-rose-600'
                              }`}>
                                {schedule.status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {editingScheduleId === schedule.id ? (
                                <>
                                  <button 
                                    onClick={() => handleSaveScheduleEdit(schedule.id)}
                                    className="text-emerald-600 hover:text-emerald-800 text-xs font-bold"
                                  >
                                    {t('common.save')}
                                  </button>
                                  <button 
                                    onClick={() => { setEditingScheduleId(null); setEditScheduleData(null); }}
                                    className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                                  >
                                    {t('common.cancel')}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => { setEditingScheduleId(schedule.id); setEditScheduleData({ ...schedule }); }}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                                  >
                                    {t('common.edit')}
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                    className="text-rose-600 hover:text-rose-800 text-xs font-bold"
                                  >
                                    {t('common.delete')}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'UserManagement' && userProfile?.role === 'admin' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{t('admin.manage.users.title')}</h1>
                  <p className="text-slate-500 text-[11px] lg:text-sm">{t('admin.manage.users.desc')}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <button 
                    onClick={handleInitializeDefaultUsers}
                    className="w-full sm:w-auto bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs lg:text-sm hover:bg-slate-200 transition-all"
                  >
                    {t('admin.manage.users.initialize')}
                  </button>
                  <button 
                    onClick={() => setIsAddUserModalOpen(true)}
                    className="w-full sm:w-auto bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs lg:text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <UserPlus size={16} />
                    {t('admin.modal.addUser')}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.user')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.email')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.modal.password') || 'Password'}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.role')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.counter')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">{t('admin.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                                {user.name?.charAt(0) || 'U'}
                              </div>
                              {editingUserId === user.id ? (
                                <input 
                                  type="text" 
                                  value={editUserData.name}
                                  onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                                  className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100"
                                />
                              ) : (
                                <p className="text-sm font-bold text-slate-900">{user.name}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {editingUserId === user.id ? (
                              <input 
                                type="email" 
                                value={editUserData.email}
                                onChange={(e) => setEditUserData({ ...editUserData, email: e.target.value })}
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                              />
                            ) : (
                              user.email
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {editingUserId === user.id ? (
                              <input 
                                type="text" 
                                value={editUserData.password || ''}
                                onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-100"
                              />
                            ) : (
                              user.password || '••••••••'
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingUserId === user.id ? (
                              <select 
                                value={editUserData.role}
                                onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                              >
                                <option value="user">Passenger</option>
                                <option value="counter">Counter Staff</option>
                                <option value="owner">Bus Owner</option>
                                <option value="admin">Administrator</option>
                              </select>
                            ) : (
                              <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                user.role === 'admin' ? 'bg-purple-50 text-purple-600' :
                                user.role === 'owner' ? 'bg-blue-50 text-blue-600' :
                                user.role === 'counter' ? 'bg-emerald-50 text-emerald-600' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {user.role}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {editingUserId === user.id ? (
                              <div className="space-y-2">
                                {editUserData.role === 'counter' && (
                                  <>
                                    <select
                                      value={editUserData.counterId || ''}
                                      onChange={(e) => {
                                        const counter = counters.find(c => c.id === e.target.value);
                                        setEditUserData({ ...editUserData, counterId: e.target.value, counterName: counter?.name || '' });
                                      }}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                                    >
                                      <option value="">Select Counter</option>
                                      {counters.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                      ))}
                                    </select>
                                    <select
                                      value={editUserData.ownerId || ''}
                                      onChange={(e) => setEditUserData({ ...editUserData, ownerId: e.target.value })}
                                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                                    >
                                      <option value="">Select Owner</option>
                                      {allUsers.filter(u => u.role === 'owner').map(owner => (
                                        <option key={owner.id} value={owner.id}>{owner.name}</option>
                                      ))}
                                    </select>
                                  </>
                                )}
                              </div>
                            ) : (
                              <div className="text-xs font-medium text-slate-500">
                                {user.role === 'counter' ? (
                                  <>
                                    <p className="font-bold text-slate-700">{user.counterName || 'No Counter'}</p>
                                    {user.ownerId && (
                                      <p className="text-[10px]">Owner: {allUsers.find(u => u.id === user.ownerId)?.name || 'Unknown'}</p>
                                    )}
                                  </>
                                ) : '-'}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {editingUserId === user.id ? (
                                <>
                                  <button 
                                    onClick={() => {
                                      setAllUsers(allUsers.map(u => u.id === user.id ? { ...editUserData } : u));
                                      handleSaveUserChanges(user.id);
                                    }}
                                    className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all"
                                  >
                                    {t('common.save')}
                                  </button>
                                  <button 
                                    onClick={() => { setEditingUserId(null); setEditUserData(null); }}
                                    className="bg-slate-200 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold hover:bg-slate-300 transition-all"
                                  >
                                    {t('common.cancel')}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => { setEditingUserId(user.id); setEditUserData({ ...user }); }}
                                    className="text-blue-600 hover:text-blue-800 text-xs font-bold"
                                  >
                                    {t('common.edit')}
                                  </button>
                                  <button 
                                    onClick={() => handleDelete('users', user.id)}
                                    className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-all"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'Owners' && userProfile?.role === 'admin' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{t('admin.manage.owner')}</h1>
                  <p className="text-slate-500 text-[11px] lg:text-sm">{t('admin.manage.owner.desc')}</p>
                </div>
                <button 
                  onClick={() => setIsOwnerModalOpen(true)}
                  className="w-full sm:w-auto bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs lg:text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  {t('admin.modal.addUser')}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.user')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.email')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Online Sales</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Paid</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Balance</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">{t('admin.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allUsers.filter(u => u.role === 'owner').map((owner) => {
                        const stats = getOwnerStats(owner.id);
                        return (
                          <tr key={owner.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                  {owner.name?.charAt(0) || 'O'}
                                </div>
                                <p className="text-sm font-bold text-slate-900">{owner.name}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{owner.email}</td>
                            <td className="px-6 py-4 text-sm font-bold text-blue-600">৳{formatNumber(stats.onlineSales)}</td>
                            <td className="px-6 py-4 text-sm font-bold text-emerald-600">৳{formatNumber(stats.paid)}</td>
                            <td className="px-6 py-4 text-sm font-bold text-rose-600">৳{formatNumber(stats.balance)}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setSelectedOwnerForPayment(owner);
                                    setPaymentAmount(stats.balance.toString());
                                    setIsPayOwnerModalOpen(true);
                                  }}
                                  className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all"
                                >
                                  Pay Owner
                                </button>
                                <button 
                                  onClick={() => handleDelete('users', owner.id)}
                                  className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'Companies' && userProfile?.role === 'admin' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{language === 'bn' ? 'বাস কোম্পানি ব্যবস্থাপনা' : 'Bus Company Management'}</h1>
                  <p className="text-slate-500 text-[11px] lg:text-sm">{language === 'bn' ? 'আপনার বাস কোম্পানি প্রোফাইল এবং তাদের বিবরণ পরিচালনা করুন' : 'Manage your bus company profiles and their details'}</p>
                </div>
                <button 
                  onClick={() => setIsCompanyModalOpen(true)}
                  className="w-full sm:w-auto bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs lg:text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={16} />
                  {language === 'bn' ? 'নতুন কোম্পানি যোগ করুন' : 'Add New Company'}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.user')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.email')}</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Online Sales</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Paid</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Balance</th>
                        <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">{t('admin.table.action')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allUsers.filter(u => u.role === 'company').map((company) => {
                        const stats = getOwnerStats(company.id);
                        return (
                          <tr key={company.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                  <Building2 size={16} />
                                </div>
                                <p className="text-sm font-bold text-slate-900">{company.name}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-slate-600">{company.email}</td>
                            <td className="px-6 py-4 text-sm font-bold text-blue-600">৳{formatNumber(stats.onlineSales)}</td>
                            <td className="px-6 py-4 text-sm font-bold text-emerald-600">৳{formatNumber(stats.paid)}</td>
                            <td className="px-6 py-4 text-sm font-bold text-rose-600">৳{formatNumber(stats.balance)}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => {
                                    setSelectedOwnerForPayment(company);
                                    setPaymentAmount(stats.balance.toString());
                                    setIsPayOwnerModalOpen(true);
                                  }}
                                  className="text-xs font-bold text-blue-600 hover:underline"
                                >
                                  Make Payment
                                </button>
                                <button 
                                  onClick={() => handleDelete('users', company.id)}
                                  className="text-rose-600 hover:text-rose-800 p-2 rounded-lg hover:bg-rose-50 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'Bookings' && (userProfile?.role === 'admin' || userProfile?.role === 'counter') ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">
                    {bookingView === 'summary' ? 'Booking Summary' : `Bookings: ${selectedCounterForDetails || 'All'}`}
                  </h1>
                  <p className="text-slate-500 text-[11px] lg:text-sm">
                    {bookingView === 'summary' 
                      ? 'Counter-wise ticket sales report and online bookings.' 
                      : 'Detailed passenger ticket booking records.'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative min-w-[150px] lg:min-w-[250px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder={language === 'bn' ? 'যাত্রী বা ফোন দিয়ে খুঁজুন' : 'Search bookings...'} 
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:ring-1 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                  {bookingView === 'detailed' && (
                    <button 
                      onClick={() => {
                        setBookingView('summary');
                        setSelectedCounterForDetails(null);
                        setCurrentPage(1);
                      }}
                      className="bg-white border border-slate-200 text-slate-700 px-3 lg:px-4 py-2 rounded-xl font-bold text-[10px] lg:text-sm hover:bg-slate-50 transition-all flex items-center gap-2"
                    >
                      <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      <span className="hidden sm:inline">Back to Summary</span>
                      <span className="sm:hidden">Back</span>
                    </button>
                  )}
                  <button className="bg-white border border-slate-200 text-slate-700 px-3 lg:px-4 py-2 rounded-xl font-bold text-[10px] lg:text-sm hover:bg-slate-50 transition-all">
                    Export CSV
                  </button>
                  <button className="bg-blue-600 text-white px-3 lg:px-4 py-2 rounded-xl font-bold text-[10px] lg:text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                    New Booking
                  </button>
                </div>
              </div>

              {bookingView === 'summary' ? (
                <div className="space-y-8">
                  {/* Overall Stats for Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.stats.totalSales')}</p>
                      <p className="text-2xl font-black text-slate-900">৳{formatNumber(getBookingSummary().reduce((acc, curr) => acc + curr.total, 0))}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.stats.totalTickets')}</p>
                      <p className="text-2xl font-black text-slate-900">{formatNumber(getBookingSummary().reduce((acc, curr) => acc + curr.count, 0))}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.stats.counterSales')}</p>
                      <p className="text-2xl font-black text-emerald-600">৳{formatNumber(getBookingSummary().filter(s => s.name !== 'Online').reduce((acc, curr) => acc + curr.total, 0))}</p>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('admin.stats.onlineSales')}</p>
                      <p className="text-2xl font-black text-blue-600">৳{formatNumber(getBookingSummary().find(s => s.name === 'Online')?.total || 0)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getBookingSummary().filter(item => {
                      if (userProfile?.role === 'counter') {
                        return item.name === userProfile.counterName;
                      }
                      return true;
                    }).map((item, idx) => (
                      <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-2xl ${item.name === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                            {item.name === 'Online' ? <Globe size={24} /> : <Store size={24} />}
                          </div>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('common.report')}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">{item.name}</h3>
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-2xl font-black text-slate-900">৳{formatNumber(item.total)}</span>
                          <span className="text-sm text-slate-500 font-medium">{t('admin.stats.totalSales')}</span>
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-slate-50">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-400 uppercase">{t('admin.stats.ticketsSold')}</span>
                            <span className="text-sm font-bold text-slate-700">{formatNumber(item.count)} {t('common.tickets')}</span>
                          </div>
                          <button 
                            onClick={() => {
                              setSelectedCounterForDetails(item.name);
                              setBookingView('detailed');
                              setCurrentPage(1);
                            }}
                            className="flex items-center gap-1 text-blue-600 text-xs font-bold group-hover:gap-2 transition-all"
                          >
                            {t('common.viewDetails')} <ArrowRight size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/50">
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.bookingId')}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.passenger')}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.routeTime')}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.counterStaff')}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.amount')}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">{t('admin.table.status')}</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">{t('admin.table.action')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedBookings.filter(b => {
                          if (userProfile?.role === 'counter') {
                            return b.counter === userProfile.counterName;
                          }
                          return true;
                        }).map((booking) => (
                          <tr key={booking.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="px-6 py-4 text-sm font-mono font-bold text-blue-600">{booking.id}</td>
                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">{booking.passenger}</td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-slate-900">{booking.route}</p>
                              <p className="text-xs text-slate-500">{t('common.travel')}: {booking.travelDate || booking.date} {booking.time && `${t('common.at')} ${booking.time}`}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-semibold text-slate-700">{booking.counter || t('common.online')}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-bold">
                                {booking.staff ? `${t('common.staff')}: ${booking.staff}` : t('admin.booking.directWeb')}
                              </p>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-slate-900">{booking.amount}</td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                booking.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                              }`}>
                                {booking.status === 'Confirmed' ? t('status.confirmed') : t('status.cancelled')}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-slate-400 hover:text-slate-600">
                                <MoreVertical size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination Footer */}
                  {filteredBookings.length > itemsPerPage && (
                    <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {t('common.showing')} {startIndex + 1} {t('common.to')} {Math.min(startIndex + itemsPerPage, filteredBookings.length)} {t('common.of')} {filteredBookings.length}
                      </p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                        >
                          <ChevronLeft size={16} />
                        </button>
                        <button 
                          onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredBookings.length / itemsPerPage), prev + 1))}
                          disabled={currentPage === Math.ceil(filteredBookings.length / itemsPerPage)}
                          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-all"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : activeTab === 'Accounts' && (userProfile?.role === 'admin' || userProfile?.role === 'owner') ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{language === 'bn' ? 'হিসাব ব্যবস্থাপনা' : 'Accounts Management'}</h1>
                  <p className="text-slate-500 text-[11px] lg:text-sm">{language === 'bn' ? 'আর্থিক ওভারভিউ এবং ব্যালেন্স ট্র্যাকিং' : 'Financial overview and balance tracking'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'মোট বিক্রয়' : 'Total Sales'}</p>
                  <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(accountSummary.totalSales)}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'অনলাইন বিক্রয়' : 'Online Sales'}</p>
                  <h3 className="text-2xl font-bold text-blue-600">{formatCurrency(accountSummary.onlineSales)}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'মালিকদের পরিশোধিত' : 'Paid to Owners'}</p>
                  <h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(accountSummary.totalPaidToOwners)}</h3>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'নিট ব্যালেন্স' : 'Net Balance'}</p>
                  <h3 className={`text-2xl font-bold ${accountSummary.netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                    {formatCurrency(accountSummary.netBalance)}
                  </h3>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">{language === 'bn' ? 'মালিক সেটেলমেন্ট ওভারভিউ' : 'Owner Settlement Overview'}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'মালিক' : 'Owner'}</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'অনলাইন বিক্রয়' : 'Online Sales'}</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'ব্যালেন্স' : 'Balance'}</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'অ্যাকশন' : 'Action'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {owners.filter(o => userProfile?.role === 'owner' ? o.id === userProfile.id : true).map(owner => {
                        const stats = getOwnerStats(owner.id);
                        return (
                          <tr key={owner.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="font-bold text-slate-900">{owner.name}</p>
                              <p className="text-xs text-slate-500">{owner.email}</p>
                            </td>
                            <td className="px-6 py-4 font-bold text-blue-600">{formatCurrency(stats.onlineSales)}</td>
                            <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(stats.paid)}</td>
                            <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(stats.balance)}</td>
                            <td className="px-6 py-4">
                              {userProfile?.role === 'admin' && (
                                <button 
                                  onClick={() => {
                                    setSelectedOwnerForPayment(owner);
                                    setIsPayOwnerModalOpen(true);
                                  }}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                                >
                                  {language === 'bn' ? 'পেমেন্ট করুন' : 'Pay Owner'}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'Reports' && (userProfile?.role === 'admin' || userProfile?.role === 'owner' || userProfile?.role === 'counter') ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{t('admin.nav.reports')}</h1>
                  <p className="text-slate-500 text-[11px] lg:text-sm">{language === 'bn' ? 'বিস্তারিত রিপোর্ট তৈরি করুন' : 'Generate and download detailed reports'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2">
                      <BarChart3 size={18} className="text-blue-600" />
                      {language === 'bn' ? 'ফিল্টার' : 'Filters'}
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'সময়কাল' : 'Period'}</label>
                        <select 
                          value={reportPeriod}
                          onChange={(e: any) => setReportPeriod(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                        >
                          <option value="daily">{language === 'bn' ? 'দৈনিক' : 'Daily'}</option>
                          <option value="weekly">{language === 'bn' ? 'সাপ্তাহিক' : 'Weekly'}</option>
                          <option value="monthly">{language === 'bn' ? 'মাসিক' : 'Monthly'}</option>
                        </select>
                      </div>

                      {userProfile?.role === 'admin' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'বাস মালিক' : 'Bus Owner'}</label>
                          <select 
                            value={reportOwnerId}
                            onChange={(e) => setReportOwnerId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                          >
                            <option value="">{language === 'bn' ? 'সকল মালিক' : 'All Owners'}</option>
                            {owners.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'বাস' : 'Bus'}</label>
                        <select 
                          value={reportBusId}
                          onChange={(e) => setReportBusId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                        >
                          <option value="">{language === 'bn' ? 'সকল বাস' : 'All Buses'}</option>
                          {buses.filter(b => userProfile?.role === 'owner' ? b.ownerId === userProfile.id : true).map(b => <option key={b.id} value={b.id}>{b.name} ({b.regNo})</option>)}
                        </select>
                      </div>

                      {userProfile?.role === 'admin' && (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'কাউন্টার' : 'Counter'}</label>
                            <select 
                              value={reportCounterId}
                              onChange={(e) => setReportCounterId(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            >
                              <option value="">{language === 'bn' ? 'সকল কাউন্টার' : 'All Counters'}</option>
                              {counters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'স্টাফ' : 'Staff'}</label>
                            <select 
                              value={reportStaffId}
                              onChange={(e) => setReportStaffId(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            >
                              <option value="">{language === 'bn' ? 'সকল স্টাফ' : 'All Staff'}</option>
                              {staffs.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(userProfile?.role === 'admin' || userProfile?.role === 'owner') && (
                    <ReportCard 
                      title="Revenue Report" 
                      titleBn="রাজস্ব রিপোর্ট"
                      desc="Detailed sales and income analysis"
                      descBn="বিস্তারিত বিক্রয় এবং আয় বিশ্লেষণ"
                      icon={<TrendingUp className="text-emerald-600" />}
                      onClick={() => handleGenerateReport('Revenue Report')}
                      t={t}
                    />
                  )}
                  {(userProfile?.role === 'admin' || userProfile?.role === 'owner') && (
                    <ReportCard 
                      title="Bus Efficiency" 
                      titleBn="বাসের দক্ষতা"
                      desc="Performance and maintenance tracking"
                      descBn="পারফরম্যান্স এবং রক্ষণাবেক্ষণ ট্র্যাকিং"
                      icon={<Bus className="text-blue-600" />}
                      onClick={() => handleGenerateReport('Bus Efficiency')}
                      t={t}
                    />
                  )}
                  {(userProfile?.role === 'admin' || userProfile?.role === 'counter') && (
                    <ReportCard 
                      title="Counter Performance" 
                      titleBn="কাউন্টার পারফরম্যান্স"
                      desc="Sales analysis by counter location"
                      descBn="কাউন্টার অবস্থান অনুযায়ী বিক্রয় বিশ্লেষণ"
                      icon={<Store className="text-indigo-600" />}
                      onClick={() => handleGenerateReport('Counter Performance')}
                      t={t}
                    />
                  )}
                  {(userProfile?.role === 'admin' || userProfile?.role === 'counter') && (
                    <ReportCard 
                      title="Staff Sales Report" 
                      titleBn="স্টাফ সেলস রিপোর্ট"
                      desc="Individual staff booking performance"
                      descBn="ব্যক্তিগত স্টাফ বুকিং পারফরম্যান্স"
                      icon={<Users className="text-amber-600" />}
                      onClick={() => handleGenerateReport('Staff Sales Report')}
                      t={t}
                    />
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'Ledger' && (userProfile?.role === 'admin' || userProfile?.role === 'owner' || userProfile?.role === 'counter') ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{language === 'bn' ? 'লেজার বুক' : 'Ledger Book'}</h1>
                  <p className="text-slate-500 text-[11px] lg:text-sm">{language === 'bn' ? 'ডেবিট এবং ক্রেডিট ট্র্যাকিং' : 'Track your debits and credits history'}</p>
                </div>
                <div className="flex items-center gap-3">
                  {userProfile?.role === 'admin' && (
                    <select 
                      value={ledgerFilterUserId}
                      onChange={(e) => setLedgerFilterUserId(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-100"
                    >
                      <option value="">{language === 'bn' ? 'সকল ব্যবহারকারী' : 'All Users'}</option>
                      {allUsers.map(user => (
                        <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                      ))}
                    </select>
                  )}
                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder={language === 'bn' ? 'লেনদেন খুঁজুন...' : 'Search transactions...'} 
                      value={ledgerSearchQuery}
                      onChange={(e) => setLedgerSearchQuery(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-blue-100 transition-all w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'তারিখ' : 'Date'}</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'বিবরণ' : 'Description'}</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-emerald-600">{language === 'bn' ? 'ডেবিট (ইন)' : 'Debit (In)'}</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-rose-600">{language === 'bn' ? 'ক্রেডিট (আউট)' : 'Credit (Out)'}</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'ব্যালেন্স' : 'Balance'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ledgerEntries
                        .filter(entry => entry.description.toLowerCase().includes(ledgerSearchQuery.toLowerCase()))
                        .map((entry) => (
                        <tr key={entry.id} className="hover:bg-slate-50 transition-all">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="font-bold text-slate-600 text-sm">{new Date(entry.date).toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400">{new Date(entry.date).toLocaleTimeString()}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900 text-sm">{entry.description}</p>
                            <p className="text-[10px] text-slate-400">Ref: #{entry.reference_id} ({entry.reference_type})</p>
                          </td>
                          <td className="px-6 py-4">
                            <span className={entry.debit > 0 ? "text-emerald-600 font-bold" : "text-slate-300"}>
                              {entry.debit > 0 ? formatCurrency(entry.debit) : '৳0'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={entry.credit > 0 ? "text-rose-600 font-bold" : "text-slate-300"}>
                              {entry.credit > 0 ? formatCurrency(entry.credit) : '৳0'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <p className={`font-black ${entry.balance >= 0 ? 'text-blue-600' : 'text-rose-600'}`}>
                              {formatCurrency(entry.balance)}
                            </p>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {ledgerEntries.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="text-slate-200" size={40} />
                    </div>
                    <p className="text-slate-400 font-medium tracking-tight">No ledger entries found</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'Settings' && userProfile?.role === 'admin' ? (
            <div className="space-y-6">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{t('admin.settings.title')}</h1>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 mb-4">{t('admin.settings.general')}</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2 border-b border-slate-50">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{t('admin.settings.maintenanceMode')}</p>
                        <p className="text-xs text-slate-500">{t('admin.settings.maintenanceMode.desc')}</p>
                      </div>
                      <div className="w-10 h-5 bg-slate-200 rounded-full relative cursor-pointer">
                        <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-all"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-50">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{t('admin.settings.emailNotifications')}</p>
                        <p className="text-xs text-slate-500">{t('admin.settings.emailNotifications.desc')}</p>
                      </div>
                      <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full transition-all"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-4">{language === 'bn' ? 'পেমেন্ট গেটওয়ে' : 'SSLCommerz Payment Gateway'}</h3>
                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'স্টোর আইডি' : 'Store ID'}</label>
                        <input 
                          type="text"
                          value={sslSettings.ssl_store_id}
                          onChange={(e) => setSslSettings({ ...sslSettings, ssl_store_id: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                          placeholder="Enter Store ID"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'স্টোর পাসওয়ার্ড' : 'Store Password'}</label>
                        <input 
                          type="password"
                          value={sslSettings.ssl_store_password}
                          onChange={(e) => setSslSettings({ ...sslSettings, ssl_store_password: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                          placeholder="Enter Store Password"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox"
                        id="ssl_is_sandbox"
                        checked={sslSettings.ssl_is_sandbox === 'true'}
                        onChange={(e) => setSslSettings({ ...sslSettings, ssl_is_sandbox: e.target.checked ? 'true' : 'false' })}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="ssl_is_sandbox" className="text-sm font-medium text-slate-700">{language === 'bn' ? 'স্যান্ডবক্স মোড' : 'Sandbox Mode'}</label>
                    </div>
                    <button 
                      type="submit"
                      className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                    >
                      {language === 'bn' ? 'সেভ করুন' : 'Save Settings'}
                    </button>
                  </form>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-4">{language === 'bn' ? 'ডিসকাউন্ট ব্যানার ব্যবস্থাপনা' : 'Discount Banner Management'}</h3>
                  <form onSubmit={handleSaveSettings} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'ব্যানার ইমেজ' : 'Banner Image'}</label>
                        <div className="flex items-center gap-4">
                          {sslSettings.banner_image && (
                            <div className="relative w-32 h-20 rounded-xl overflow-hidden border border-slate-200">
                              <img src={sslSettings.banner_image} alt="Banner" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button 
                                type="button"
                                onClick={() => setSslSettings({ ...sslSettings, banner_image: '' })}
                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                          <div className="flex-1">
                            <input 
                              type="file" 
                              id="banner_image_upload"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(file, 'banner');
                              }}
                            />
                            <label 
                              htmlFor="banner_image_upload"
                              className="flex items-center justify-center gap-2 w-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl py-6 px-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all group"
                            >
                              <div className="p-2 bg-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                <Upload size={16} className="text-blue-600" />
                              </div>
                              <span className="text-xs font-bold text-slate-500">{isUploading ? (language === 'bn' ? 'আপলোড হচ্ছে...' : 'Uploading...') : (language === 'bn' ? 'ইমেজ আপলোড করুন' : 'Upload Image')}</span>
                            </label>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'শিরোনাম' : 'Title'}</label>
                        <input 
                          type="text"
                          value={sslSettings.banner_title}
                          onChange={(e) => setSslSettings({ ...sslSettings, banner_title: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                          placeholder="e.g. Best Discount!"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'উপশিরোনাম' : 'Subtitle'}</label>
                        <input 
                          type="text"
                          value={sslSettings.banner_subtitle}
                          onChange={(e) => setSslSettings({ ...sslSettings, banner_subtitle: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                          placeholder="e.g. Weekly Mega Offer"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{language === 'bn' ? 'বাটন টেক্সট' : 'Button Text'}</label>
                        <input 
                          type="text"
                          value={sslSettings.banner_button}
                          onChange={(e) => setSslSettings({ ...sslSettings, banner_button: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                          placeholder="e.g. AIRTEL NETWORK"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      className="w-full sm:w-auto bg-blue-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                    >
                      {language === 'bn' ? 'ব্যানার সেভ করুন' : 'Save Banner Settings'}
                    </button>
                  </form>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h3 className="font-bold text-slate-950 mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-blue-600 rounded-full block"></span>
                    {language === 'bn' ? 'সিএসএস এবং থিম নিয়ন্ত্রণ' : 'CSS & Theme Control'}
                  </h3>
                  <form onSubmit={handleSaveThemeSettings} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Theme Selector */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                          {language === 'bn' ? 'থিম নির্বাচন করুন' : 'Theme Mode'}
                        </label>
                        <select
                          value={themeSettings.theme_mode}
                          onChange={(e) => {
                            const val = e.target.value as 'light' | 'dark' | 'custom';
                            let newColors = { ...themeSettings, theme_mode: val };
                            if (val === 'light') {
                              newColors.color_primary = '#2563eb';
                              newColors.color_secondary = '#475569';
                              newColors.color_text = '#0f172a';
                              newColors.color_bg = '#f8fafc';
                            } else if (val === 'dark') {
                              newColors.color_primary = '#3b82f6';
                              newColors.color_secondary = '#94a3b8';
                              newColors.color_text = '#f1f5f9';
                              newColors.color_bg = '#0f172a';
                            }
                            setThemeSettings(newColors);
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                        >
                          <option value="light">{language === 'bn' ? 'লাইট মোড (Light Mode)' : 'Light Mode'}</option>
                          <option value="dark">{language === 'bn' ? 'ডার্ক মোড (Dark Mode)' : 'Dark Mode'}</option>
                          <option value="custom">{language === 'bn' ? 'কাস্টম হিউ (Custom Hue)' : 'Custom Theme'}</option>
                        </select>
                        <p className="text-xs text-slate-500">
                          {themeSettings.theme_mode !== 'custom' 
                            ? (language === 'bn' ? 'কাস্টম মোড নির্বাচন করলে কালারসমূহ পরিবর্তন করা যাবে' : 'Select "Custom Theme" to fully change individual colors below') 
                            : (language === 'bn' ? 'কালার প্যালেট আপনার ইচ্ছামত কাস্টমাইজ করুন' : 'Unlock and customize your brand palettes freely!')}
                        </p>
                      </div>

                      {/* Typography - Font Family */}
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                          {language === 'bn' ? 'ফন্ট ফ্যামিলি' : 'Font Family'}
                        </label>
                        <select
                          value={themeSettings.font_family}
                          onChange={(e) => setThemeSettings({ ...themeSettings, font_family: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                        >
                          <option value="Inter">Inter (Default)</option>
                          <option value="Poppins">Poppins</option>
                          <option value="Roboto">Roboto</option>
                          <option value="Segoe UI">Segoe UI</option>
                          <option value="Arial">Arial</option>
                          <option value="Courier New">Courier New (Monospace)</option>
                        </select>
                      </div>

                      {/* Base Font Size Slider */}
                      <div className="space-y-2 md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                            {language === 'bn' ? 'বেস ফন্ট সাইজ (পিক্সেল)' : 'Base Font Size'}
                          </label>
                          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{themeSettings.base_font_size}px</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-slate-400 font-semibold">12px</span>
                          <input
                            type="range"
                            min="12"
                            max="24"
                            value={themeSettings.base_font_size}
                            onChange={(e) => setThemeSettings({ ...themeSettings, base_font_size: e.target.value })}
                            className="flex-1 accent-blue-600 cursor-pointer"
                          />
                          <span className="text-xs text-slate-400 font-semibold">24px</span>
                        </div>
                      </div>

                      {/* Color Pickers Panel */}
                      <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        {/* Primary Color */}
                        <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            {language === 'bn' ? 'প্রধান কালার' : 'Primary Color'}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeSettings.color_primary}
                              disabled={themeSettings.theme_mode !== 'custom'}
                              onChange={(e) => setThemeSettings({ ...themeSettings, color_primary: e.target.value })}
                              className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="text-xs font-mono text-slate-600 uppercase font-semibold">{themeSettings.color_primary}</span>
                          </div>
                        </div>

                        {/* Secondary Color */}
                        <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            {language === 'bn' ? 'সেকেন্ডারি কালার' : 'Secondary Color'}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeSettings.color_secondary}
                              disabled={themeSettings.theme_mode !== 'custom'}
                              onChange={(e) => setThemeSettings({ ...themeSettings, color_secondary: e.target.value })}
                              className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="text-xs font-mono text-slate-600 uppercase font-semibold">{themeSettings.color_secondary}</span>
                          </div>
                        </div>

                        {/* Text Color */}
                        <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100 font-sans">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            {language === 'bn' ? 'টেক্সট কালার' : 'Text Color'}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeSettings.color_text}
                              disabled={themeSettings.theme_mode !== 'custom'}
                              onChange={(e) => setThemeSettings({ ...themeSettings, color_text: e.target.value })}
                              className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="text-xs font-mono text-slate-600 uppercase font-semibold">{themeSettings.color_text}</span>
                          </div>
                        </div>

                        {/* Background Color */}
                        <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-100 font-sans">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                            {language === 'bn' ? 'ব্যাকগ্রাউন্ড কালার' : 'Background'}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={themeSettings.color_bg}
                              disabled={themeSettings.theme_mode !== 'custom'}
                              onChange={(e) => setThemeSettings({ ...themeSettings, color_bg: e.target.value })}
                              className="w-10 h-10 border border-slate-200 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <span className="text-xs font-mono text-slate-600 uppercase font-semibold">{themeSettings.color_bg}</span>
                          </div>
                        </div>
                      </div>

                      {/* Custom CSS Box */}
                      <div className="md:col-span-2 space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                          {language === 'bn' ? 'কাস্টম সিএসএস রুলস' : 'Custom CSS Sandbox'}
                        </label>
                        <textarea
                          rows={5}
                          value={themeSettings.custom_css}
                          onChange={(e) => setThemeSettings({ ...themeSettings, custom_css: e.target.value })}
                          className="w-full bg-slate-900 text-teal-400 font-mono text-xs rounded-xl p-4 border border-slate-800 outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-inner leading-relaxed"
                          placeholder="/* Write your raw CSS rules here. E.g: .btn { border-radius: 99px; } */"
                        />
                        <p className="text-[10px] text-slate-400 leading-normal">
                          {language === 'bn' ? '* সিএসএস রুলস সরাসরি গ্লোবাল স্কোপে প্রয়োগ হবে। ক্লাইন্ট সাইডের সাথে ইনস্ট্যান্ট রিয়েল-টাইম লাইভ প্রিভিউ দেখতে পাবেন।' : '* Standard CSS rules will be appended directly to style contexts. Changes trigger instant live preview.'}
                        </p>
                      </div>
                    </div>

                    {/* Form action buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                      >
                        <CheckCircle2 size={16} />
                        {language === 'bn' ? 'থিম পরিবর্তন সেভ করুন' : 'Save Theme Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={handleResetThemeSettings}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-all border border-slate-200"
                      >
                        {language === 'bn' ? 'ডিফল্ট থিম রিসেট' : 'Reset to Default'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : activeTab === 'Menu' && userProfile?.role === 'admin' ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{language === 'bn' ? 'মেনু ব্যবস্থাপনা' : 'Menu Management'}</h1>
                  <p className="text-slate-500 text-[11px] lg:text-sm">{language === 'bn' ? 'হেডার মেনু আইটেম এবং তাদের ক্রম পরিচালনা করুন' : 'Manage header menu items and their order'}</p>
                </div>
                <button 
                  onClick={() => setIsMenuModalOpen(true)}
                  className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs lg:text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  {language === 'bn' ? 'মেনু যোগ করুন' : 'Add Menu Item'}
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="menus">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="divide-y divide-slate-100">
                        {menus.map((menu, index) => (
                          <Draggable key={menu.id.toString()} draggableId={menu.id.toString()} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`p-4 flex items-center gap-4 transition-all ${snapshot.isDragging ? 'bg-blue-50 shadow-lg z-50' : 'hover:bg-slate-50'}`}
                              >
                                <div {...provided.dragHandleProps} className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing">
                                  <GripVertical size={20} />
                                </div>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Label (EN)</p>
                                    <p className="text-sm font-bold text-slate-900">{menu.label_en}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Label (BN)</p>
                                    <p className="text-sm font-bold text-slate-900 font-bn">{menu.label_bn}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{language === 'bn' ? 'পাথ / ইউআরএল' : 'Path / URL'}</p>
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{menu.path}</p>
                                      <ExternalLink size={12} className="text-slate-300" />
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${menu.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {menu.is_active ? 'Active' : 'Inactive'}
                                  </div>
                                  <div className="flex gap-1">
                                    <button 
                                      onClick={() => setEditingMenu(menu)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    >
                                      <Edit size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteMenu(menu.id)}
                                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                {menus.length === 0 && (
                  <div className="p-12 text-center">
                    <Menu size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-500 font-medium">No menu items found. Add your first menu item to get started.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'Corporate' && userProfile?.role === 'admin' ? (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{language === 'bn' ? 'কর্পোরেট ব্যবস্থাপনা' : 'Corporate Management'}</h1>
                  <p className="text-slate-500 text-sm">Manage corporate page content, inquiries, and driver assignments.</p>
                </div>
                <div className="flex gap-2">
                   <button 
                    onClick={() => fetchCorporateData()}
                    className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all"
                    title="Refresh Data"
                  >
                    <Clock size={20} />
                  </button>
                  <button 
                    onClick={handleSaveCorporateSettings}
                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              {/* Enhanced Corporate Management Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                {['Reservations', 'Applications', 'Content'].map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setCorporateSubTab(sub as any)}
                    className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                      corporateSubTab === sub 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>

              {corporateSubTab === 'Reservations' ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">Corporate Booking Requests</h3>
                    <p className="text-xs text-slate-500 mt-1">Review inquiries and assign drivers to confirmed bookings.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/30">
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Trip Details</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Vehicle</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Payment</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Driver Assignment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {corporateBookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-slate-50 transition-all group">
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                booking.status === 'Confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                                booking.status === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {booking.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-900 line-clamp-1">{booking.pickup_location} → {booking.drop_location}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                                  <Calendar size={12} />
                                  <span>{booking.date}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Bus size={16} className="text-blue-500" />
                                <span className="text-sm font-bold text-slate-700">{booking.vehicleName || 'N/A'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-0.5">
                                <p className="text-sm font-black text-slate-900">৳{booking.amount?.toLocaleString()}</p>
                                <p className="text-[10px] font-bold text-emerald-600">Advance: ৳{booking.advance_paid?.toLocaleString()}</p>
                                <p className="text-[9px] text-slate-400 uppercase tracking-widest">{booking.payment_method}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <select 
                                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-100 min-w-[140px]"
                                  value={booking.driver_id || ''}
                                  onChange={(e) => handleAssignDriver(booking.id, parseInt(e.target.value))}
                                >
                                  <option value="">Select Driver</option>
                                  {availableDrivers.map(driver => (
                                    <option key={driver.id} value={driver.id}>{driver.name}</option>
                                  ))}
                                </select>
                                {booking.driver_id && (
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600" title="Driver Assigned">
                                    <CheckCircle2 size={16} />
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {corporateBookings.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                              No corporate booking requests found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : corporateSubTab === 'Applications' ? (
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-900">Driver Profile Applications</h3>
                    <p className="text-xs text-slate-500 mt-1">Review new driver applications and photos.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/30">
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Photo</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Name</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Contact Info</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">License</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Address</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Applied At</th>
                          <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {driverApplications.map((app) => (
                          <tr key={app.id} className="hover:bg-slate-50 transition-all group">
                            <td className="px-6 py-4">
                              <div 
                                className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 cursor-zoom-in"
                                onClick={() => {
                                  if (app.profile_image) {
                                    setPreviewImage(app.profile_image);
                                    setIsPreviewOpen(true);
                                  }
                                }}
                              >
                                {app.profile_image ? (
                                  <img src={app.profile_image} alt={app.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <User size={20} />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-900">{app.name}</td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                                <Phone size={14} className="text-slate-400" />
                                {app.phone}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-xs text-slate-600 font-bold bg-slate-100 w-fit px-2 py-1 rounded-lg">
                                <CreditCard size={12} className="text-slate-400" />
                                {app.license_number}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-xs text-slate-500 max-w-[200px] line-clamp-2">{app.address}</p>
                            </td>
                            <td className="px-6 py-4 text-xs text-slate-500">{new Date(app.applied_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                app.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 
                                app.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {app.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                        {driverApplications.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold italic">
                              No driver applications found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* ... Hero and Stats (Keep original content from lines 4375-4484 but slightly modified for the sub-tab logic) ... */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Globe size={20} className="text-blue-600" />
                      Hero Section Content
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hero Title (English)</label>
                        <input 
                          type="text" 
                          value={corporateContent.heroTitle_en}
                          onChange={(e) => setCorporateContent({...corporateContent, heroTitle_en: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hero Title (Bengali)</label>
                        <input 
                          type="text" 
                          value={corporateContent.heroTitle_bn}
                          onChange={(e) => setCorporateContent({...corporateContent, heroTitle_bn: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hero Subtitle (English)</label>
                        <textarea 
                          value={corporateContent.heroSubtitle_en}
                          onChange={(e) => setCorporateContent({...corporateContent, heroSubtitle_en: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium h-24 resize-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hero Subtitle (Bengali)</label>
                        <textarea 
                          value={corporateContent.heroSubtitle_bn}
                          onChange={(e) => setCorporateContent({...corporateContent, heroSubtitle_bn: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium h-24 resize-none"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hero Background Image URL</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={corporateContent.heroImage}
                            onChange={(e) => setCorporateContent({...corporateContent, heroImage: e.target.value})}
                            placeholder="https://images.unsplash.com/..."
                            className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                          />
                          <button 
                            type="button"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e: any) => {
                                const file = e.target.files[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (re) => {
                                    setCorporateContent({...corporateContent, heroImage: re.target?.result as string});
                                    toast.success('Image uploaded successfully!');
                                  };
                                  reader.readAsDataURL(file);
                                }
                              };
                              input.click();
                            }}
                            className="bg-blue-600 text-white px-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center shrink-0"
                            title="Upload and change"
                          >
                            <ImageIcon size={20} />
                          </button>
                        </div>
                        {corporateContent.heroImage && (
                          <div 
                            className="mt-2 relative rounded-2xl overflow-hidden h-32 border border-slate-100 cursor-pointer group/prev"
                            onClick={() => {
                              setPreviewImage(corporateContent.heroImage);
                              setIsPreviewOpen(true);
                            }}
                          >
                            <img src={corporateContent.heroImage} alt="Hero Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/prev:opacity-100 transition-opacity">
                              <span className="text-white text-[10px] font-black bg-white/20 backdrop-blur-md px-4 py-2 rounded-full uppercase tracking-[0.2em] border border-white/30">
                                Full Preview
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <BarChart3 size={20} className="text-emerald-600" />
                      Statistics
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Corporate Clients</label>
                        <input 
                          type="text" 
                          value={corporateContent.stats_clients}
                          onChange={(e) => setCorporateContent({...corporateContent, stats_clients: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Trips Completed</label>
                        <input 
                          type="text" 
                          value={corporateContent.stats_trips}
                          onChange={(e) => setCorporateContent({...corporateContent, stats_trips: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified Drivers</label>
                        <input 
                          type="text" 
                          value={corporateContent.stats_drivers}
                          onChange={(e) => setCorporateContent({...corporateContent, stats_drivers: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">On-time Arrival</label>
                        <input 
                          type="text" 
                          value={corporateContent.stats_ontime}
                          onChange={(e) => setCorporateContent({...corporateContent, stats_ontime: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold"
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                      <h4 className="font-bold text-sm mb-4">Corporate Inquiries (Recent)</h4>
                      <div className="space-y-3">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold">Rahim Steel Mills Ltd.</p>
                            <p className="text-[10px] text-slate-500">Employee transport for 200 staff</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-600 rounded-full">New</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold">Square Pharmaceuticals</p>
                            <p className="text-[10px] text-slate-500">Executive car rental inquiry</p>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-1 bg-slate-200 text-slate-600 rounded-full">Contacted</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-sm text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
                  <LayoutDashboard size={40} />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Select a tab to view content</h2>
                <p className="text-slate-500">Please select a valid section from the sidebar to manage your bus service.</p>
              </div>
            </div>
          )
        }
        </div>
      </main>

      {/* Menu Modals */}
      <AnimatePresence>
        {isMenuModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{language === 'bn' ? 'মেনু যোগ করুন' : 'Add Menu Item'}</h2>
                <button onClick={() => setIsMenuModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleAddMenu} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Label (English)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Home"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    value={newMenu.label_en}
                    onChange={(e) => setNewMenu({...newMenu, label_en: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Label (Bengali)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="উদা: হোম"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium font-bn"
                    value={newMenu.label_bn}
                    onChange={(e) => setNewMenu({...newMenu, label_bn: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{language === 'bn' ? 'পাথ / ইউআরএল' : 'Path / URL'}</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. / or #offers"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-mono text-sm"
                    value={newMenu.path}
                    onChange={(e) => setNewMenu({...newMenu, path: e.target.value})}
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    Add Menu Item
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {editingMenu && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-slate-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{language === 'bn' ? 'মেনু সম্পাদনা' : 'Edit Menu Item'}</h2>
                <button onClick={() => setEditingMenu(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              
              <form onSubmit={handleUpdateMenu} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Label (English)</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    value={editingMenu.label_en}
                    onChange={(e) => setEditingMenu({...editingMenu, label_en: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Label (Bengali)</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium font-bn"
                    value={editingMenu.label_bn}
                    onChange={(e) => setEditingMenu({...editingMenu, label_bn: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{language === 'bn' ? 'পাথ / ইউআরএল' : 'Path / URL'}</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all font-mono text-sm"
                    value={editingMenu.path}
                    onChange={(e) => setEditingMenu({...editingMenu, path: e.target.value})}
                  />
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input 
                    type="checkbox" 
                    id="is_active"
                    checked={editingMenu.is_active === 1}
                    onChange={(e) => setEditingMenu({...editingMenu, is_active: e.target.checked ? 1 : 0})}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-bold text-slate-700">{language === 'bn' ? 'সক্রিয়' : 'Active'}</label>
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isPreviewOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 bg-slate-900/95 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="absolute top-0 right-0 m-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10"
              >
                <X size={24} />
              </button>
              <img 
                src={previewImage} 
                alt="Full Preview" 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
              />
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

function SidebarItem({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center lg:gap-3 justify-center lg:justify-start px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'hover:bg-slate-800 hover:text-white'
      }`}
      title={label}
    >
      <span className="shrink-0">{icon}</span>
      <span className="hidden lg:block truncate">{label}</span>
    </button>
  );
}

function BusStatusItem({ bus, route, progress, status, t, formatNumber }: { bus: string; route: string; progress: number; status: string; t: any; formatNumber: any }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-100">
      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-blue-600">
        <Bus size={20} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-sm font-bold text-slate-700">{bus} <span className="text-xs font-normal text-slate-400">({route})</span></span>
          <span className={`text-[10px] font-bold uppercase ${status === 'Delayed' ? 'text-blue-500' : 'text-emerald-500'}`}>
            {status === 'Delayed' ? t('status.delayed') : status === 'On Time' ? t('status.onTime') : status === 'Arriving' ? t('common.arriving') : status}
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${status === 'Delayed' ? 'bg-blue-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }}></div>
        </div>
        <div className="text-right mt-1">
          <span className="text-[10px] font-bold text-slate-500">{formatNumber(progress)}%</span>
        </div>
      </div>
    </div>
  );
}

function QuickActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group"
    >
      <div className="text-slate-400 group-hover:text-blue-600 transition-all">
        {icon}
      </div>
      <span className="text-xs font-bold text-slate-600 group-hover:text-blue-900">{label}</span>
    </button>
  );
}

function ReportCard({ title, titleBn, desc, descBn, icon, onClick, t }: { title: string; titleBn: string; desc: string; descBn: string; icon: React.ReactNode; onClick: () => void; t: any }) {
  const { language } = useLanguage();
  return (
    <div 
      onClick={onClick}
      className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all group cursor-pointer"
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-2">{language === 'bn' ? titleBn : title}</h3>
      <p className="text-sm text-slate-500 mb-6">{language === 'bn' ? descBn : desc}</p>
      <div className="flex items-center text-blue-600 font-bold text-sm">
        {t('common.generateReport') || 'Generate Report'} →
      </div>
    </div>
  );
}

function BusTrackingModal({ isOpen, onClose, location, isSocketConnected }: { isOpen: boolean; onClose: () => void; location: any; isSocketConnected?: boolean }) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-blue-600 text-white">
          <div className="flex items-center gap-3">
            <MapPin size={24} />
            <div className="flex flex-col">
              <h3 className="text-xl font-bold">Admin Tracking Panel</h3>
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
              <p className="mt-4 font-bold text-slate-400">Master Map View</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Fleet Status</p>
              <p className="font-bold text-emerald-600">{location?.status || 'On Track'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avg Speed</p>
              <p className="font-bold text-slate-900">{location?.speed || '45 km/h'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Waypoint</p>
              <p className="font-bold text-slate-900">{location?.nextStop || 'Updating...'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Telemetry</p>
              <p className="font-bold text-slate-900">Live Active</p>
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
