import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Clock, Shield, Star, Check, User, CreditCard, ChevronRight, Bus, Trash2, Eye, History, X, Printer, Mail, FileText, Home, Navigation, Hash, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useLanguage } from './context/LanguageContext';
import { generateTicketPDF } from './lib/pdfGenerator';
import { CountdownTimer } from './components/CountdownTimer';
import { TicketPreviewModal } from './components/TicketPreviewModal';;

const BUSES = [
  { id: 1, name: 'Green Line Paribahan', type: 'Scania Multi-Axle AC', departure: '08:00 AM', arrival: '02:00 PM', duration: '6h 00m', rating: 4.8, seats: 12 },
  { id: 2, name: 'Hanif Enterprise', type: 'Volvo Ocean Series AC', departure: '09:30 AM', arrival: '03:30 PM', duration: '6h 00m', rating: 4.5, seats: 8 },
  { id: 3, name: 'Ena Transport', type: 'Non-AC Hino 1J', departure: '10:00 AM', arrival: '04:30 PM', duration: '6h 30m', rating: 4.2, seats: 24 },
];

const HERO_IMAGES = [
  'https://picsum.photos/id/10/1920/1080',
  'https://picsum.photos/id/15/1920/1080',
  'https://picsum.photos/id/28/1920/1080',
  'https://picsum.photos/id/54/1920/1080',
];

const MOCK_BOOKINGS = [
  { id: 'SW-A1B2C3', route: 'Dhaka to Chattogram', date: '2024-03-15', bus: 'Green Line Paribahan', seats: ['A1', 'A2'], status: 'Upcoming', price: 2400 },
  { id: 'SW-D4E5F6', route: 'Dhaka to Sylhet', date: '2024-02-20', bus: 'Ena Transport', seats: ['B3'], status: 'Completed', price: 800 },
  { id: 'SW-G7H8I9', route: 'Dhaka to Rajshahi', date: '2024-03-25', bus: 'Hanif Enterprise', seats: ['C1', 'C2'], status: 'Upcoming', price: 3000 },
];

const ROUTES = [
  { id: 1, origin: 'Dhaka', destination: 'Chattogram', stops: ['Cumilla', 'Feni'], duration: '5h 30m', distance: 250, frequency: 'Every 30 mins', counters: ['Gabtoli', 'Sayedabad', 'Dampara', 'A.K. Khan'] },
  { id: 2, origin: 'Dhaka', destination: 'Sylhet', stops: ['Brahmanbaria', 'Habiganj'], duration: '6h 00m', distance: 240, frequency: 'Every 1 hour', counters: ['Gabtoli', 'Sayedabad', 'Kadamtoli', 'Humayun Rashid Chattar'] },
  { id: 3, origin: 'Dhaka', destination: 'Rajshahi', stops: ['Tangail', 'Sirajganj'], duration: '5h 45m', distance: 260, frequency: 'Every 45 mins', counters: ['Gabtoli', 'Kalyanpur', 'Shiroil', 'Rail Station'] },
  { id: 4, origin: 'Dhaka', destination: 'Cox\'s Bazar', stops: ['Cumilla', 'Chattogram'], duration: '10h 00m', distance: 400, frequency: 'Every 2 hours', counters: ['Gabtoli', 'Sayedabad', 'Kolatoli', 'Main Road'] },
  { id: 5, origin: 'Dhaka', destination: 'Khulna', stops: ['Faridpur', 'Magura'], duration: '7h 30m', distance: 220, frequency: 'Every 1 hour', counters: ['Gabtoli', 'Kalyanpur', 'Sonadanga', 'Royal Mor'] },
  { id: 6, origin: 'Dhaka', destination: 'Rangpur', stops: ['Bogra', 'Gaibandha'], duration: '8h 00m', distance: 300, frequency: 'Every 1.5 hours', counters: ['Gabtoli', 'Kalyanpur', 'Kamarpara', 'Medical Mor'] },
];

interface BookingPortalProps {
  onLogin?: () => void;
  isLoggedIn?: boolean;
  initialStep?: 'search' | 'results' | 'seats' | 'checkout' | 'confirmation' | 'my-bookings';
}

export default function BookingPortal({ onLogin, isLoggedIn, initialStep }: BookingPortalProps) {
  const { language, t } = useLanguage();
  const [step, setStep] = useState<'search' | 'results' | 'seats' | 'checkout' | 'confirmation' | 'my-bookings'>(initialStep || 'search');
  const [selectedBus, setSelectedBus] = useState<any>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [boardingPoint, setBoardingPoint] = useState('');
  const [droppingPoint, setDroppingPoint] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [fromCity, setFromCity] = useState('Dhaka');
  const [toCity, setToCity] = useState('Chattogram');
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  
  // Filtering States for Search Results
  const [acFilter, setAcFilter] = useState<'all' | 'ac' | 'non-ac'>('all');
  const [typeFilter, setTypeFilter] = useState<string[]>([]);
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'night'>('all');
  const [operatorSearch, setOperatorSearch] = useState('');
  const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'nagad' | 'card' | 'pay_later'>('bKash');
  const [sortBy, setSortBy] = useState<'time' | 'bus'>('time');
  const [settings, setSettings] = useState<any>({});

  const [passengerInfo, setPassengerInfo] = useState({ 
    name: '', 
    phone: '', 
    email: '', 
    identity: '', 
    address: '', 
    district: '', 
    thana: '', 
    postOffice: '', 
    village: '',
    gender: '',
    counter: ''
  });
  const [errors, setErrors] = useState<{ 
    name?: string; 
    phone?: string; 
    email?: string; 
    identity?: string; 
    address?: string; 
    district?: string; 
    thana?: string; 
    postOffice?: string; 
    village?: string; 
    gender?: string;
    counter?: string;
  }>({});
  const [confirmationNumber, setConfirmationNumber] = useState('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [apiRoutes, setApiRoutes] = useState<any[]>([]);
  const [apiBuses, setApiBuses] = useState<any[]>([]);
  const [allBuses, setAllBuses] = useState<any[]>([]);
  const [journeyDate, setJourneyDate] = useState('');
  const [carouselPivotDate, setCarouselPivotDate] = useState('2024-03-11');

  // Sync pivot date with journey date when searching or mounting
  useEffect(() => {
    setCarouselPivotDate(journeyDate);
  }, [journeyDate]);

  // Derived carousel dates around pivot
  const carouselDates = React.useMemo(() => {
    const dates = [];
    const base = new Date(carouselPivotDate);
    // Show 7 days window
    for (let i = -3; i <= 3; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const full = d.toISOString().split('T')[0];
      dates.push({
        full,
        day: d.getDate().toString(),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        month: d.toLocaleDateString('en-US', { month: 'short' })
      });
    }
    return dates;
  }, [carouselPivotDate]);

  const handleNextDates = () => {
    const d = new Date(carouselPivotDate);
    d.setDate(d.getDate() + 7);
    setCarouselPivotDate(d.toISOString().split('T')[0]);
  };

  const handlePrevDates = () => {
    const d = new Date(carouselPivotDate);
    d.setDate(d.getDate() - 7);
    setCarouselPivotDate(d.toISOString().split('T')[0]);
  };

  // Load data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [routesRes, busesRes, settingsRes] = await Promise.all([
          fetch(`/api/routes?lang=${language}`),
          fetch(`/api/buses?lang=${language}`),
          fetch(`/api/settings`)
        ]);
        const routesData = await routesRes.json();
        const busesData = await busesRes.json();
        const settingsData = await settingsRes.json();
        setApiRoutes(routesData);
        setApiBuses(busesData);
        setAllBuses(busesData);
        setSettings(settingsData);
      } catch (error) {
        console.error('Error fetching portal data:', error);
      }
    };
    fetchData();
  }, [language]);

  const fetchMyBookings = async () => {
    try {
      const response = await fetch(`/api/bookings?lang=${language}`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          const mappedDb = data.map((b: any) => ({
            id: 'BK-' + b.id,
            realId: b.id,
            route: b.route,
            date: b.travelDate || b.date,
            booking_date: b.date,
            bus: b.busName || b.bus || 'Premium Bus',
            seats: typeof b.seats === 'string' ? b.seats.split(', ') : (b.seats || []),
            status: b.status,
            price: b.amount ? String(b.amount).replace(/[৳, ]/g, '') : '800',
            phone: b.phone,
            passenger: b.passenger
          }));
          setBookings([...mappedDb, ...MOCK_BOOKINGS]);
        }
      }
    } catch (error) {
      console.error('Error fetching real bookings:', error);
      setBookings(MOCK_BOOKINGS);
    }
  };

  // Load bookings from local state on mount
  useEffect(() => {
    fetchMyBookings();
  }, [isLoggedIn, language]);
  const [viewingBooking, setViewingBooking] = useState<any>(null);
  const [ticketPreviewBooking, setTicketPreviewBooking] = useState<any>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Derived filtered results
  const filteredBusResults = React.useMemo(() => {
    // Start with all buses master list
    const source = allBuses.length > 0 ? allBuses : BUSES;
    
    // 1. Initial Route Filtering (What handleSearch used to do)
    let result = source.filter(bus => {
      // If no route assigned, include it for mock purposes
      if (!bus.route) return true;
      const busRoute = String(bus.route || '').toLowerCase();
      const from = String(fromCity || '').toLowerCase();
      const to = String(toCity || '').toLowerCase();
      return busRoute.includes(from) && busRoute.includes(to);
    });

    // 2. Date Filtering (Simulated for mock data if no date field)
    // In a real app, you'd compare with bus.travel_date
    // Here we simulate it by showing a slightly different list per day
    const dayHash = new Date(journeyDate).getDate();
    if (dayHash % 2 === 0) {
      // Simulate some buses not running on even days
      result = result.filter((_, idx) => idx % 2 === 0);
    }
    
    // 3. Side Filters (AC, Time, Type, Operator)
    result = result.filter(bus => {
      // Safety guards
      const type = bus.type || '';
      const departure = bus.departure || '';
      
      // AC Filter
      if (acFilter === 'ac' && !type.toLowerCase().includes('ac')) return false;
      if (acFilter === 'non-ac' && type.toLowerCase().includes('ac') && !type.toLowerCase().includes('non-ac')) return false;
      
      // Additional safety for route in side filters if needed
      if (!bus.route && source.length > 0) {
          // if it reached here it means it passed step 1
      }

      // Time Filter
      if (timeFilter !== 'all' && departure) {
        const timeParts = departure.split(':');
        if (timeParts.length < 1) return false;
        
        const hour = parseInt(timeParts[0]);
        const isPM = departure.includes('PM');
        const adjustedHour = isPM ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
        
        if (timeFilter === 'morning' && (adjustedHour < 6 || adjustedHour >= 12)) return false;
        if (timeFilter === 'night' && (adjustedHour < 18 && adjustedHour >= 6)) return false;
      }

      // Operator Filter
      if (selectedOperators.length > 0 && !selectedOperators.includes(bus.name)) return false;

      // Type Filter
      if (typeFilter.length > 0) {
        const busTypeSuffix = type.split(' ').pop();
        if (!busTypeSuffix || !typeFilter.includes(busTypeSuffix)) return false;
      }

      return true;
    });

    // 4. Pricing / Enrichment
    // Calculate price based on route if not already set
    const displayRoutes = apiRoutes.length > 0 ? apiRoutes : ROUTES;
    const currentRoute = displayRoutes.find(r => 
      (r.from || r.origin) === fromCity && (r.to || r.destination) === toCity
    );

    let calculatedPrice = 800;
    if (currentRoute) {
      if (currentRoute.fare) {
        calculatedPrice = parseInt(currentRoute.fare.toString().replace(/[৳,]/g, '')) || 800;
      } else if (currentRoute.distance) {
        const distanceNum = parseInt(currentRoute.distance.toString().replace(/[^0-9]/g, '')) || 0;
        calculatedPrice = Math.ceil(distanceNum * 2.90) || 800;
      }
    }

    result = result.map(bus => ({
      ...bus,
      price: bus.price || calculatedPrice
    }));

    // 5. Sorting
    if (sortBy === 'time') {
      result = [...result].sort((a, b) => {
        const getMinutes = (timeStr: string) => {
          if (!timeStr) return 0;
          const [time, period] = timeStr.split(' ');
          if (!time) return 0;
          let [hours, minutes] = time.split(':').map(Number);
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          return hours * 60 + (minutes || 0);
        };
        return getMinutes(a.departure) - getMinutes(b.departure);
      });
    } else if (sortBy === 'bus') {
      result = [...result].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return result;
  }, [allBuses, fromCity, toCity, journeyDate, apiRoutes, acFilter, typeFilter, timeFilter, selectedOperators, sortBy]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('results');
  };

  const validateCheckout = () => {
    const newErrors: { 
      name?: string; 
      phone?: string; 
      email?: string; 
      identity?: string; 
      address?: string; 
      district?: string; 
      thana?: string; 
      postOffice?: string; 
      village?: string; 
      gender?: string;
      counter?: string;
    } = {};
    
    if (!passengerInfo.name.trim()) {
      newErrors.name = t('booking.error.name_required');
    } else if (passengerInfo.name.trim().length < 3) {
      newErrors.name = t('booking.error.name_length');
    }

    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!passengerInfo.phone.trim()) {
      newErrors.phone = t('booking.error.phone_required');
    } else if (!phoneRegex.test(passengerInfo.phone.trim())) {
      newErrors.phone = t('booking.error.phone_invalid');
    }

    if (!passengerInfo.identity.trim()) {
      newErrors.identity = 'Identity (NID/Passport/Birth Cert) is required';
    }

    if (passengerInfo.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passengerInfo.email.trim())) {
      newErrors.email = 'Invalid email address';
    }

    if (!passengerInfo.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!passengerInfo.district.trim()) {
      newErrors.district = 'District is required';
    }

    if (!passengerInfo.thana.trim()) {
      newErrors.thana = 'Thana is required';
    }

    if (!passengerInfo.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!passengerInfo.counter) {
      newErrors.counter = 'Counter is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayNow = async (booking: any) => {
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.realId,
          amount: parseFloat(booking.price) || 800,
          customerName: booking.passenger || passengerInfo.name || 'Passenger',
          customerEmail: passengerInfo.email || 'customer@example.com',
          customerPhone: booking.phone || passengerInfo.phone,
          busName: booking.bus,
          seats: booking.seats.join(', ')
        })
      });

      const data = await response.json();
      const gatewayUrl = data.GatewayPageURL || data.gatewayUrl || data.gatewayURL;
      if (gatewayUrl) {
        window.location.href = gatewayUrl;
      } else {
        toast.error('Failed to initiate payment. Please try again.');
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error('An error occurred. Please try again.');
      setIsRedirecting(false);
    }
  };

  const handleBookingConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCheckout()) return;

    setIsRedirecting(true);

    try {
      const amountValue = Math.ceil((selectedSeats.length * (selectedBus?.price || 800)) * (1 - appliedDiscount));
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: null,
          passenger_name: passengerInfo.name,
          phone_number: passengerInfo.phone,
          passenger_id: passengerInfo.identity || 'N/A',
          address: `${passengerInfo.address || ''}, ${passengerInfo.village || ''}, ${passengerInfo.thana || ''}, ${passengerInfo.district || ''}`,
          bus_id: selectedBus.id,
          route: `${fromCity} to ${toCity}`,
          time: selectedBus.departure,
          travel_date: journeyDate,
          seats: selectedSeats.join(', '),
          status: 'Reserved',
          amount: amountValue,
          counter: passengerInfo.counter || 'Online',
          staff: 'Passenger Portal',
          passengers_json: JSON.stringify([passengerInfo])
        })
      });

      if (response.ok) {
        const data = await response.json();
        const realId = data.id;

        if (paymentMethod === 'pay_later') {
          setConfirmationNumber('BK-' + realId);
          toast.success(language === 'bn' ? 'বুকিং সফলভাবে সম্পন্ন হয়েছে!' : 'Booking completed successfully!');
          setStep('confirmation');
          setIsRedirecting(false);
          fetchMyBookings();
        } else {
          // Online Payment with exact DB booking ID
          const payResponse = await fetch('/api/payment/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: realId,
              amount: amountValue,
              customerName: passengerInfo.name,
              customerEmail: passengerInfo.email || 'customer@example.com',
              customerPhone: passengerInfo.phone,
              busName: selectedBus.name,
              seats: selectedSeats.join(', ')
            })
          });

          const payData = await payResponse.json();
          const gatewayUrl = payData.GatewayPageURL || payData.gatewayUrl || payData.gatewayURL;
          if (gatewayUrl) {
            window.location.href = gatewayUrl;
          } else {
            toast.error('Failed to initiate payment. Please try again.');
            setIsRedirecting(false);
          }
        }
      } else {
        toast.error(language === 'bn' ? 'বুকিং সম্পন্ন করতে ব্যর্থ হয়েছে।' : 'Failed to complete booking.');
        setIsRedirecting(false);
      }
    } catch (error) {
      console.error('Booking confirmation error:', error);
      toast.error('An error occurred. Please try again.');
      setIsRedirecting(false);
    }
  };

  const handleCancelBooking = (id: string) => {
    toast(t('booking.cancel_confirm'), {
      action: {
        label: t('common.confirm'),
        onClick: () => {
          setBookings(bookings.map(b => b.id === id ? { ...b, status: t('status.cancelled') } : b));
          toast.success(t('booking.cancel_success'));
        }
      }
    });
  };

  const toggleSeat = (seat: string) => {
    setSelectedSeats(prev => 
      prev.includes(seat) ? prev.filter(s => s !== seat) : [...prev, seat]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <main className="flex-1">
        {/* Compact Search Header (Visible in Results/Seats steps) */}
        {(step === 'results' || step === 'seats') && (
          <div className="bg-slate-900 pt-20 pb-6 px-6 no-print">
            <div className="max-w-7xl mx-auto">
              <form onSubmit={handleSearch} className="flex flex-wrap lg:flex-nowrap items-end gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-md">
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-2">Depart From</label>
                  <div className="flex items-center bg-white rounded-lg px-3 py-2">
                    <MapPin className="text-blue-600 mr-2" size={16} />
                    <select 
                      value={fromCity}
                      onChange={(e) => setFromCity(e.target.value)}
                      className="bg-transparent w-full outline-none font-bold text-sm h-6"
                    >
                      {Array.from(new Set([...ROUTES, ...apiRoutes].map(r => (r.origin || r.from || '').trim()))).filter(Boolean).map(city => (
                        <option key={`header-from-${city}`} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center justify-center pt-5">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-lg cursor-pointer hover:rotate-180 transition-transform duration-500">
                    <Navigation size={16} className="rotate-90" />
                  </div>
                </div>

                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-2">Going To</label>
                  <div className="flex items-center bg-white rounded-lg px-3 py-2">
                    <MapPin className="text-blue-600 mr-2" size={16} />
                    <select 
                      value={toCity}
                      onChange={(e) => setToCity(e.target.value)}
                      className="bg-transparent w-full outline-none font-bold text-sm h-6"
                    >
                      {Array.from(new Set([...ROUTES, ...apiRoutes]
                        .filter(r => (r.origin || r.from || '').trim() === fromCity.trim())
                        .map(r => (r.destination || r.to || '').trim())))
                        .filter(Boolean)
                        .map(city => (
                          <option key={`header-to-${city}`} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-2">Journey date</label>
                  <div className="flex items-center bg-white rounded-lg px-3 py-2">
                    <Calendar className="text-blue-600 mr-2" size={16} />
                    <input 
                      type="date" 
                      className="bg-transparent w-full outline-none font-bold text-sm h-6" 
                      value={journeyDate}
                      onChange={(e) => setJourneyDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-2">Return date</label>
                  <div className="flex items-center bg-white rounded-lg px-3 py-2">
                    <Calendar className="text-blue-600 mr-2" size={16} />
                    <input type="date" className="bg-transparent w-full outline-none font-bold text-sm h-6" />
                  </div>
                </div>

                <div className="w-24">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-2">Passenger(s)</label>
                  <div className="flex items-center bg-white rounded-lg px-3 py-2">
                    <User className="text-blue-600 mr-2" size={16} />
                    <select className="bg-transparent w-full outline-none font-bold text-sm h-6 appearance-none">
                      <option>1</option>
                      <option>2</option>
                      <option>3</option>
                      <option>4</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center">
                  <Search size={24} />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Hero Section */}
      {step === 'search' && (
        <section className="relative pt-24 pb-36 overflow-hidden min-h-[600px] flex items-center">
          {/* Background Slider */}
          <div className="absolute inset-0 -z-10">
            <AnimatePresence mode="wait">
              <motion.img
                key={currentHeroImage}
                src={HERO_IMAGES[currentHeroImage]}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </AnimatePresence>
            {/* Overlays */}
            <div className="absolute inset-0 bg-blue-900/60 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-blue-900/40"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-extrabold text-blue-600 mb-6 leading-tight drop-shadow-2xl"
            >
              {t('booking.hero.title')}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-blue-900/80 text-xl mb-12 max-w-2xl mx-auto font-medium drop-shadow-lg"
            >
              {t('booking.hero.subtitle')}
            </motion.p>

            {/* Search Form */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-5xl mx-auto bg-white p-4 md:p-8 rounded-3xl shadow-2xl"
            >
              <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <label className="block text-left text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('booking.from')}</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <MapPin className="text-blue-600 mr-3" size={20} />
                    <select 
                      value={fromCity}
                      onChange={(e) => setFromCity(e.target.value)}
                      className="bg-transparent w-full outline-none font-medium appearance-none"
                    >
                      {Array.from(new Set([...ROUTES, ...apiRoutes].map(r => (r.origin || r.from || '').trim()))).filter(Boolean).map(city => (
                        <option key={`hero-from-${city}`} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-left text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('booking.to')}</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <MapPin className="text-blue-600 mr-3" size={20} />
                    <select 
                      value={toCity}
                      onChange={(e) => setToCity(e.target.value)}
                      className="bg-transparent w-full outline-none font-medium appearance-none"
                    >
                      {Array.from(new Set([...ROUTES, ...apiRoutes]
                        .filter(r => (r.origin || r.from || '').trim() === fromCity.trim())
                        .map(r => (r.destination || r.to || '').trim())))
                        .filter(Boolean)
                        .map(city => (
                          <option key={`hero-to-${city}`} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-left text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">{t('booking.date')}</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Calendar className="text-blue-600 mr-3" size={20} />
                    <input 
                      type="date" 
                      className="bg-transparent w-full outline-none font-medium" 
                      value={journeyDate}
                      onChange={(e) => setJourneyDate(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                    <Search size={20} />
                    {t('booking.btn.search')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </section>
      )}

      {/* Routes Section */}
      {step === 'search' && (
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">{t('routes.title')}</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">{t('routes.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(apiRoutes.length > 0 ? apiRoutes : ROUTES).map((route, idx) => (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Bus size={24} />
                  </div>
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">{route.frequency || 'Daily'}</span>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <div className="w-[1px] h-8 bg-slate-200"></div>
                      <div className="w-2 h-2 rounded-full border-2 border-blue-600 bg-white"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('booking.route.origin')}</p>
                      <p className="text-lg font-bold text-slate-900 mb-2">{route.origin || route.from}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('booking.route.destination')}</p>
                      <p className="text-lg font-bold text-slate-900">{route.destination || route.to}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{t('booking.route.stops')}</p>
                    <div className="flex flex-wrap gap-2">
                      {route.stops.map(stop => (
                        <span key={stop} className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{stop}</span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.route.duration')}</p>
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <Clock size={14} className="text-blue-600" />
                        <span>{route.duration}</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.route.distance')}</p>
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <MapPin size={14} className="text-blue-600" />
                        <span>{route.distance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Results Section */}
      {step === 'results' && (
        <div className="bg-slate-50 min-h-screen no-print">
          {/* Date Selector Carousel */}
          <div className="bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
              <button 
                onClick={handlePrevDates}
                className="p-2 rounded-full hover:bg-slate-100 text-blue-600 transition-colors"
              >
                <ChevronRight size={24} className="rotate-180" />
              </button>
              <div className="flex-1 flex justify-center gap-4 overflow-x-auto no-scrollbar">
                {carouselDates.map((item, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      setJourneyDate(item.full);
                    }}
                    className={`flex flex-col items-center justify-center min-w-[60px] py-2 rounded-lg cursor-pointer transition-all ${
                      journeyDate === item.full ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <span className="text-lg font-bold">{item.day}</span>
                    <span className="text-[10px] font-medium uppercase">{item.weekday}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={handleNextDates}
                className="p-2 rounded-full hover:bg-slate-100 text-blue-600 transition-colors"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar Filters */}
            <aside className="w-full lg:w-72 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="flex items-center gap-2 font-bold text-slate-800">
                    <Trash2 size={18} className="text-slate-400" />
                    All Filters
                  </h3>
                  <button 
                    onClick={() => {
                      setAcFilter('all');
                      setTimeFilter('all');
                      setSelectedOperators([]);
                      setOperatorSearch('');
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-all"
                  >
                    Clear All
                  </button>
                </div>

                <div className="p-4 space-y-6">
                  {/* Category: AC/Non-AC */}
                  <div>
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex justify-between items-center cursor-pointer group">
                      AC/Non-AC
                      <ChevronRight size={14} className="rotate-90 text-slate-400 group-hover:text-blue-600" />
                    </h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setAcFilter(acFilter === 'ac' ? 'all' : 'ac')}
                        className={`flex-1 py-3 px-2 border-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                          acFilter === 'ac' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          acFilter === 'ac' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <Eye size={16} />
                        </div>
                        <span className="text-[10px] font-bold">AC</span>
                      </button>
                      <button 
                        onClick={() => setAcFilter(acFilter === 'non-ac' ? 'all' : 'non-ac')}
                        className={`flex-1 py-3 px-2 border-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                          acFilter === 'non-ac' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          acFilter === 'non-ac' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'
                        }`}>
                          <Clock size={16} />
                        </div>
                        <span className="text-[10px] font-bold">Non-AC</span>
                      </button>
                    </div>
                  </div>

                  {/* Category: Bus Type */}
                  <div className="pt-4 border-t border-slate-50">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex justify-between items-center cursor-pointer group">
                      Bus Type
                      <ChevronRight size={14} className="rotate-90 text-slate-400 group-hover:text-blue-600" />
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(apiBuses.filter(b => b.type).map(b => b.type.split(' ').pop()))).filter(Boolean).map(busType => (
                        <button 
                          key={busType as string}
                          onClick={() => {
                            if (typeFilter.includes(busType as string)) {
                              setTypeFilter(typeFilter.filter(t => t !== busType));
                            } else {
                              setTypeFilter([...typeFilter, busType as string]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                            typeFilter.includes(busType as string) 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                              : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {busType as string}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category: Time */}
                  <div className="pt-4 border-t border-slate-50">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex justify-between items-center cursor-pointer group">
                      Time
                      <ChevronRight size={14} className="rotate-90 text-slate-400 group-hover:text-blue-600" />
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                       <button 
                        onClick={() => setTimeFilter(timeFilter === 'morning' ? 'all' : 'morning')}
                        className={`py-2 px-3 rounded-xl border transition-all text-center group ${
                          timeFilter === 'morning' ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-50' : 'bg-slate-50 border-slate-100 hover:border-blue-200'
                        }`}
                       >
                         <div className={`flex justify-center mb-1 transition-all ${timeFilter === 'morning' ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`}>
                           <Clock size={16} />
                         </div>
                         <p className={`text-[10px] font-bold transition-all ${timeFilter === 'morning' ? 'text-blue-900' : 'text-slate-500 group-hover:text-blue-900'}`}>Morning</p>
                         <p className={`text-[8px] transition-all ${timeFilter === 'morning' ? 'text-blue-600' : 'text-slate-400'}`}>6AM-12PM</p>
                       </button>
                       <button 
                        onClick={() => setTimeFilter(timeFilter === 'night' ? 'all' : 'night')}
                        className={`py-2 px-3 rounded-xl border transition-all text-center group ${
                          timeFilter === 'night' ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-50' : 'bg-slate-50 border-slate-100 hover:border-blue-200'
                        }`}
                       >
                         <div className={`flex justify-center mb-1 transition-all ${timeFilter === 'night' ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`}>
                           <Clock size={16} />
                         </div>
                         <p className={`text-[10px] font-bold transition-all ${timeFilter === 'night' ? 'text-blue-900' : 'text-slate-500 group-hover:text-blue-900'}`}>Night</p>
                         <p className={`text-[8px] transition-all ${timeFilter === 'night' ? 'text-blue-600' : 'text-slate-400'}`}>6PM-12AM</p>
                       </button>
                    </div>
                  </div>

                  {/* Category: Bus Company */}
                  <div className="pt-4 border-t border-slate-50">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex justify-between items-center cursor-pointer group">
                      Bus Company
                      <ChevronRight size={14} className="rotate-90 text-slate-400 group-hover:text-blue-600" />
                    </h4>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input 
                        type="text" 
                        placeholder="Search Bus company" 
                        value={operatorSearch}
                        onChange={(e) => setOperatorSearch(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-100" 
                      />
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 no-scrollbar">
                      {Array.from(new Set(apiBuses.map(b => b.name)))
                        .filter(name => (name || '').toLowerCase().includes((operatorSearch || '').toLowerCase()))
                        .map(name => (
                        <label key={name} className="flex items-center gap-2 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            className="hidden"
                            checked={selectedOperators.includes(name)}
                            onChange={() => {
                              if (selectedOperators.includes(name)) {
                                setSelectedOperators(selectedOperators.filter(o => o !== name));
                              } else {
                                setSelectedOperators([...selectedOperators, name]);
                              }
                            }}
                          />
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            selectedOperators.includes(name) ? 'border-blue-600 bg-blue-600' : 'border-slate-300 group-hover:border-blue-400'
                          }`}>
                            <Check size={10} className={selectedOperators.includes(name) ? 'text-white' : 'text-transparent'} />
                          </div>
                          <span className={`text-xs transition-all ${selectedOperators.includes(name) ? 'text-blue-900 font-bold' : 'text-slate-600 group-hover:text-blue-900'}`}>{name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Category: Boarding Point */}
                  <div className="pt-4 border-t border-slate-50">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex justify-between items-center cursor-pointer group">
                      Boarding Point
                      <ChevronRight size={14} className="rotate-90 text-slate-400 group-hover:text-blue-600" />
                    </h4>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input type="text" placeholder="Search Boarding point" className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-100" />
                    </div>
                    <div className="space-y-2">
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <div className="w-4 h-4 rounded border border-slate-300 group-hover:border-blue-400"></div>
                          <span className="text-xs text-slate-600">Jamalpur counter</span>
                       </label>
                    </div>
                  </div>

                   {/* Category: Dropping Point */}
                   <div className="pt-4 border-t border-slate-50">
                    <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex justify-between items-center cursor-pointer group">
                      Dropping Point
                      <ChevronRight size={14} className="rotate-90 text-slate-400 group-hover:text-blue-600" />
                    </h4>
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input type="text" placeholder="Search Dropping point" className="w-full bg-slate-50 border border-slate-100 rounded-lg pl-9 pr-3 py-2 text-xs outline-none focus:ring-1 focus:ring-blue-100" />
                    </div>
                    <div className="space-y-2">
                       <label className="flex items-center gap-2 cursor-pointer group">
                          <div className="w-4 h-4 rounded border border-slate-300 group-hover:border-blue-400"></div>
                          <span className="text-xs text-slate-600">Dolphine counter</span>
                       </label>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right Main Content */}
            <main className="flex-1 space-y-6">
              {/* Sorting Bar */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-baseline gap-2">
                  <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Buses</h1>
                  <span className="text-xs font-bold text-blue-600">{filteredBusResults.length} Buses | {journeyDate}</span>
                </div>
                
                <div className="flex items-center gap-4 bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                   <div className="flex items-center gap-1 border-r border-slate-100 pr-3 pl-2">
                      <span className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded p-0.5"><History size={10} /></span>
                      <select className="bg-transparent text-xs font-bold outline-none cursor-pointer">
                        <option>Price</option>
                        <option>Rating</option>
                      </select>
                   </div>
                   <div className="flex items-center gap-1 border-r border-slate-100 pr-3">
                      <span className="text-[10px] font-bold text-blue-600 border border-blue-200 rounded p-0.5"><Clock size={10} className="text-blue-600" /></span>
                      <select className="bg-transparent text-xs font-bold text-blue-600 outline-none border-b border-blue-600 cursor-pointer">
                        <option>Time</option>
                        <option>Duration</option>
                      </select>
                   </div>
                   <div className="flex items-center gap-1 border-r border-slate-100 pr-3">
                      <span className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded p-0.5"><Bus size={10} /></span>
                      <select className="bg-transparent text-xs font-bold outline-none cursor-pointer">
                        <option>Seats</option>
                        <option>Available</option>
                      </select>
                   </div>
                   <div className="flex items-center gap-1 pr-3">
                      <span className="text-[10px] font-bold text-slate-400 border border-slate-200 rounded p-0.5"><Star size={10} /></span>
                      <select className="bg-transparent text-xs font-bold outline-none cursor-pointer">
                        <option>Offer</option>
                        <option>Discount</option>
                      </select>
                   </div>
                   
                   <div className="flex bg-slate-50 p-1 rounded-lg">
                      <button 
                        onClick={() => setSortBy('time')}
                        className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                          sortBy === 'time' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {language === 'bn' ? 'সময়' : 'Time'}
                      </button>
                      <button 
                        onClick={() => setSortBy('bus')}
                        className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                          sortBy === 'bus' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {language === 'bn' ? 'বাস' : 'Bus'}
                      </button>
                   </div>
                </div>
              </div>

              {/* Promo Banner Example */}
              <div className="relative h-44 rounded-2xl overflow-hidden shadow-xl group border-4 border-white">
                <img 
                  src={settings.banner_image || "https://picsum.photos/seed/promo/1200/400"} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Special Offer"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-transparent flex items-center p-8">
                  <div className="bg-white/95 backdrop-blur shadow-2xl p-4 rounded-xl rotate-[-2deg]">
                     <p className="text-blue-600 font-black text-xs uppercase tracking-[0.2em] mb-1">{settings.banner_subtitle || "Weekly Mega Offer"}</p>
                     <h2 className="text-2xl font-black text-slate-900">{settings.banner_title || "Best Discount!"}</h2>
                     <span className="inline-block mt-2 bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold">{settings.banner_button || "AIRTEL NETWORK"}</span>
                  </div>
                </div>
              </div>

              {/* Bus Results List */}
              <div className="space-y-4">
                {filteredBusResults.length > 0 ? (
                  filteredBusResults.map((bus) => (
                    <motion.div 
                      key={bus.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
                    >
                      <div className="p-5 flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-black text-slate-800 leading-none mb-1">{bus.name}</h3>
                                  <p className="text-[10px] italic font-medium text-slate-400 uppercase tracking-tight">
                                      {bus.type}
                                  </p>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-xl font-black text-slate-800">{bus.departure}</span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase">{fromCity} counter</span>
                                </div>
                                <div className="flex flex-col items-center flex-1 max-w-[120px]">
                                  <div className="flex items-center gap-2 w-full">
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                      <div className="flex-1 border-t border-dashed border-slate-300 relative">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                                            <Bus size={12} className="text-slate-300" />
                                        </div>
                                      </div>
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-400 mt-1">{bus.duration}</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-xl font-black text-slate-800">{bus.arrival}</span>
                                  <span className="text-[9px] text-slate-400 font-bold uppercase">{toCity} counter</span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1 cursor-help group/tip relative">
                                      <Navigation size={12} className="text-blue-600" />
                                      <span className="text-[10px] font-bold text-slate-500 border-b border-dashed border-slate-300">Boarding / Dropping Point</span>
                                  </div>
                                  <div className="flex gap-1.5">
                                      {(bus.type || '').toLowerCase().includes('ac') && (
                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black rounded border border-blue-100 uppercase">
                                            <Shield size={8} /> AC
                                        </span>
                                      )}
                                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded border border-emerald-100 uppercase">
                                          <CreditCard size={8} /> E-Class
                                      </span>
                                  </div>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400">
                                  Seats left: <span className="text-blue-600 text-xs">{bus.seats}</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-32 flex flex-col items-center md:items-end gap-2 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                            <div className="flex items-center gap-1">
                                <span className="text-blue-600 font-black text-lg">৳</span>
                                <span className="text-2xl font-black text-blue-600">{bus.price || 1800}</span>
                            </div>
                            <button 
                                onClick={() => { 
                                  setSelectedBus({ ...bus, price: bus.price || 1800 }); 
                                  setStep('seats'); 
                                }}
                                className="w-full py-2.5 bg-blue-600 text-white text-xs font-black rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-50 uppercase tracking-widest whitespace-nowrap"
                            >
                                View Seats
                            </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">No Buses Found</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-2">
                       We couldn't find any buses for <span className="font-bold text-slate-800">{fromCity} to {toCity}</span> on {journeyDate}.
                    </p>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">Try adjusting your filters or choosing a different date to find more available options.</p>
                    <button 
                      onClick={() => {
                        setAcFilter('all');
                        setTimeFilter('all');
                        setSelectedOperators([]);
                      }}
                      className="mt-6 text-blue-600 font-bold hover:underline"
                    >
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Seat Selection Section */}
      {step === 'seats' && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          {/* Bus Info Header */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-black text-slate-900">{selectedBus?.name || 'Bipul Enterprise'}</h2>
                </div>
                <p className="text-sm text-slate-500 font-medium mb-3">
                  206-রৌমারী-জামালপুর-টাঙ্গাইল-চট্টগ্রাম-কক্সবাজার
                </p>
                <div className="flex items-center gap-3">
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded border border-slate-200 flex items-center gap-1">
                    <div className="w-3 h-3 border border-slate-400 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                    </div>
                    NON AC
                  </span>
                  <button className="text-blue-600 text-xs font-bold italic hover:underline">
                    Cancellation policy
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Starting</p>
                  <p className="text-xl font-black text-slate-900">{selectedBus?.departure || '4:00 PM'}</p>
                  <p className="text-xs text-slate-500">Rowmari-Kurigram</p>
                </div>
                
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Bus size={20} />
                    <div className="h-[1px] w-12 bg-slate-200"></div>
                  </div>
                  <p className="text-xs font-bold text-slate-500">Seats Left: <span className="text-blue-600">{selectedBus?.seats || 28}</span></p>
                </div>

                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Arrival</p>
                  <p className="text-xl font-black text-slate-900">{selectedBus?.arrival || '9:00 AM'}</p>
                  <p className="text-xs text-slate-500">Cox\'s Bazar</p>
                </div>
              </div>

              <div className="w-full md:w-auto flex flex-col items-center md:items-end gap-3">
                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-3 py-1 rounded border border-emerald-100 uppercase tracking-wider">
                  No Extra Charge
                </span>
                <p className="text-3xl font-black text-blue-600">৳{selectedBus?.price || 1600}</p>
                <button 
                  onClick={() => setStep('results')}
                  className="bg-blue-600 text-white font-bold px-8 py-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
                >
                  Hide Seats
                </button>
              </div>
            </div>
          </div>

          {/* Seat Selection Panel */}
          <div className="bg-white rounded-3xl border-2 border-blue-100 shadow-xl overflow-hidden">
            <div className="p-8">
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-6 mb-12 pb-8 border-b border-dashed border-slate-200">
                <LegendItem color="bg-purple-600" label="BOOKED (M)" />
                <LegendItem color="bg-pink-600" label="BOOKED (F)" />
                <LegendItem color="bg-slate-600" label="BLOCKED" />
                <LegendItem color="bg-white border-2 border-slate-200" label="AVAILABLE" />
                <LegendItem color="bg-green-500" label="SELECTED" />
                <LegendItem color="bg-blue-500" label="SOLD (M)" />
                <LegendItem color="bg-pink-400" label="SOLD (F)" />
              </div>

              <div className="flex flex-col lg:flex-row gap-12">
                {/* Left: Seat Grid */}
                <div className="flex-1 flex justify-center lg:justify-start">
                  <div className="w-full max-w-[320px] border-2 border-slate-100 rounded-[2rem] p-6 relative">
                    {/* Steering Wheel */}
                    <div className="absolute top-6 right-6 text-slate-300">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
                        <path d="M12 2L12 9" />
                        <path d="M12 15L12 22" />
                        <path d="M2 12L9 12" />
                        <path d="M15 12L22 12" />
                      </svg>
                    </div>

                    <div className="mt-16 relative">
                      <div className="grid grid-cols-5 gap-y-6 gap-x-2">
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'].map((row) => {
                          const seatsInRow = row === 'J' ? [1, 2, 3, 4, 5] : [1, 2, null, 3, 4];
                          return seatsInRow.map((seatNum, idx) => {
                            if (seatNum === null) return <div key={`aisle-${row}`} className="w-8"></div>;
                            
                            const seatId = `${row}${seatNum}`;
                            const isBooked = [].includes(seatId);
                            const isBlocked = [].includes(seatId);
                            const isSelected = selectedSeats.includes(seatId);
                            
                            return (
                              <button
                                key={seatId}
                                onClick={() => !isBooked && !isBlocked && toggleSeat(seatId)}
                                disabled={isBooked || isBlocked}
                                className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all relative group ${
                                  isBooked ? 'bg-slate-400 cursor-not-allowed' :
                                  isBlocked ? 'bg-slate-600 cursor-not-allowed' :
                                  isSelected ? 'bg-green-500 text-white shadow-lg shadow-green-100' :
                                  'bg-white border-2 border-slate-200 hover:border-green-400 hover:bg-green-50'
                                }`}
                              >
                                <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-1.5 rounded-full ${
                                  isSelected ? 'bg-green-300' : isBooked || isBlocked ? 'bg-slate-300' : 'bg-slate-100 group-hover:bg-green-200'
                                }`}></div>
                                <span className={`text-[10px] font-bold ${isSelected ? 'text-white' : isBooked || isBlocked ? 'text-white/50' : 'text-slate-400'}`}>
                                  {seatId}
                                </span>
                              </button>
                            );
                          });
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle: Selection Info */}
                <div className="flex-1 space-y-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-blue-600 font-black text-sm uppercase tracking-wider mb-4">BOARDING/DROPPING:</h4>
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500">Boarding Point*</label>
                          <select 
                            value={boardingPoint}
                            onChange={(e) => setBoardingPoint(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                          >
                            <option value="">Select boarding point</option>
                            {ROUTES.find(r => r.origin === fromCity && r.destination === toCity)?.counters.map(counter => (
                              <option key={counter} value={counter}>{counter}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-500">Dropping Point*</label>
                          <select 
                            value={droppingPoint}
                            onChange={(e) => setDroppingPoint(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none"
                          >
                            <option value="">Select dropping point</option>
                            {ROUTES.find(r => r.origin === fromCity && r.destination === toCity)?.counters.map(counter => (
                              <option key={counter} value={counter}>{counter}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-blue-600 font-black text-sm uppercase tracking-wider mb-4">SEAT INFORMATION:</h4>
                      <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100">
                              <th className="px-4 py-3 font-bold text-slate-500">Seats</th>
                              <th className="px-4 py-3 font-bold text-slate-500">Class</th>
                              <th className="px-4 py-3 font-bold text-slate-500">Fare</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {selectedSeats.length > 0 ? (
                              selectedSeats.map(seat => (
                                <tr key={seat}>
                                  <td className="px-4 py-3 font-bold text-slate-700">{seat}</td>
                                  <td className="px-4 py-3 font-medium text-slate-600">E-Class</td>
                                  <td className="px-4 py-3 font-black text-slate-900">৳{selectedBus?.price || 1600}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={3} className="px-4 py-8 text-center text-slate-400 italic">No seats selected</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {selectedSeats.length > 0 && (
                      <div className="bg-slate-50 rounded-2xl p-6 border border-dashed border-slate-200 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Seat Fare:</span>
                          <span className="font-bold text-slate-900">৳{selectedSeats.length * (selectedBus?.price || 1600)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Platform Fee:</span>
                          <span className="font-bold text-emerald-600">৳20 (-৳20)</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Payment Fee:</span>
                          <span className="font-bold text-emerald-600">৳64 (-৳64)</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                          <span className="font-black text-emerald-600">Total Discount:</span>
                          <span className="font-black text-emerald-600">-৳84</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Submission */}
                <div className="flex-1">
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500">Mobile Number*</label>
                      <input 
                        type="tel"
                        placeholder="Enter mobile number"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                      />
                    </div>

                    <button 
                      onClick={() => {
                        if (selectedSeats.length === 0) {
                          toast.error(language === 'bn' ? 'অনুগ্রহ করে অন্তত একটি সিট সিলেক্ট করুন' : 'Please select at least one seat');
                          return;
                        }
                        if (!mobileNumber) {
                          toast.error(language === 'bn' ? 'অনুগ্রহ করে মোবাইল নম্বর দিন' : 'Please enter mobile number');
                          return;
                        }
                        setPassengerInfo({ ...passengerInfo, phone: mobileNumber });
                        setStep('checkout');
                      }}
                      className="w-full bg-blue-600 text-white font-black py-5 rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 text-lg uppercase tracking-widest"
                    >
                      Submit
                    </button>

                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      I have already verified my phone number, and have a password. Login with password. <button className="text-blue-600 font-bold hover:underline">Click here</button>
                    </p>

                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                      <p className="text-[10px] text-slate-600 leading-relaxed">
                        By logging in you are agreeing to the <button className="text-blue-600 font-bold hover:underline">Terms & Conditions</button> and <button className="text-blue-600 font-bold hover:underline">Privacy Notice</button> of bdtickets
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Checkout Section */}
      {step === 'checkout' && (
        <section className="max-w-4xl mx-auto px-6 py-12">
          <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-100 shadow-sm">
            <h2 className="text-3xl font-bold mb-8">{t('booking.passenger.details')}</h2>
            <form onSubmit={handleBookingConfirm} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('booking.passenger.fullname')}</label>
                  <div className={`flex items-center bg-slate-50 border ${errors.name ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-100'} rounded-2xl px-4 py-3 transition-all`}>
                    <User className={`${errors.name ? 'text-blue-500' : 'text-blue-600'} mr-3`} size={20} />
                    <input 
                      type="text" 
                      placeholder={t('booking.passenger.name_placeholder')} 
                      className="bg-transparent w-full outline-none font-medium" 
                      value={passengerInfo.name}
                      onChange={(e) => {
                        setPassengerInfo({ ...passengerInfo, name: e.target.value });
                        if (errors.name) setErrors({ ...errors, name: undefined });
                      }}
                    />
                  </div>
                  {errors.name && <p className="text-blue-500 text-[10px] font-bold ml-1 uppercase tracking-wider">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('booking.passenger.phone')}</label>
                  <div className={`flex items-center bg-slate-50 border ${errors.phone ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-100'} rounded-2xl px-4 py-3 transition-all`}>
                    <CreditCard className={`${errors.phone ? 'text-blue-500' : 'text-blue-600'} mr-3`} size={20} />
                    <input 
                      type="tel" 
                      placeholder={t('booking.passenger.phone_placeholder')} 
                      className="bg-transparent w-full outline-none font-medium" 
                      value={passengerInfo.phone}
                      onChange={(e) => {
                        setPassengerInfo({ ...passengerInfo, phone: e.target.value });
                        if (errors.phone) setErrors({ ...errors, phone: undefined });
                      }}
                    />
                  </div>
                  {errors.phone && <p className="text-blue-500 text-[10px] font-bold ml-1 uppercase tracking-wider">{errors.phone}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('booking.passenger.email')}</label>
                  <div className={`flex items-center bg-slate-50 border ${errors.email ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-100'} rounded-2xl px-4 py-3 transition-all`}>
                    <Mail className={`${errors.email ? 'text-blue-500' : 'text-blue-600'} mr-3`} size={20} />
                    <input 
                      type="email" 
                      placeholder="Enter email address" 
                      className="bg-transparent w-full outline-none font-medium" 
                      value={passengerInfo.email}
                      onChange={(e) => {
                        setPassengerInfo({ ...passengerInfo, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: undefined });
                      }}
                    />
                  </div>
                  {errors.email && <p className="text-blue-500 text-[10px] font-bold ml-1 uppercase tracking-wider">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('booking.passenger.identity')}</label>
                  <div className={`flex items-center bg-slate-50 border ${errors.identity ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-100'} rounded-2xl px-4 py-3 transition-all`}>
                    <FileText className={`${errors.identity ? 'text-blue-500' : 'text-blue-600'} mr-3`} size={20} />
                    <input 
                      type="text" 
                      placeholder="Enter identity number" 
                      className="bg-transparent w-full outline-none font-medium" 
                      value={passengerInfo.identity}
                      onChange={(e) => {
                        setPassengerInfo({ ...passengerInfo, identity: e.target.value });
                        if (errors.identity) setErrors({ ...errors, identity: undefined });
                      }}
                    />
                  </div>
                  {errors.identity && <p className="text-blue-500 text-[10px] font-bold ml-1 uppercase tracking-wider">{errors.identity}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Gender</label>
                  <div className={`flex items-center bg-slate-50 border ${errors.gender ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-100'} rounded-2xl px-4 py-3 transition-all`}>
                    <User className={`${errors.gender ? 'text-blue-500' : 'text-blue-600'} mr-3`} size={20} />
                    <select 
                      className="bg-transparent w-full outline-none font-medium appearance-none"
                      value={passengerInfo.gender}
                      onChange={(e) => {
                        setPassengerInfo({ ...passengerInfo, gender: e.target.value });
                        if (errors.gender) setErrors({ ...errors, gender: undefined });
                      }}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  {errors.gender && <p className="text-blue-500 text-[10px] font-bold ml-1 uppercase tracking-wider">{errors.gender}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Counter Name</label>
                  <div className={`flex items-center bg-slate-50 border ${errors.counter ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-100'} rounded-2xl px-4 py-3 transition-all`}>
                    <MapPin className={`${errors.counter ? 'text-blue-500' : 'text-blue-600'} mr-3`} size={20} />
                    <select 
                      className="bg-transparent w-full outline-none font-medium appearance-none"
                      value={passengerInfo.counter}
                      onChange={(e) => {
                        setPassengerInfo({ ...passengerInfo, counter: e.target.value });
                        if (errors.counter) setErrors({ ...errors, counter: undefined });
                      }}
                    >
                      <option value="">Select Counter</option>
                      {ROUTES.find(r => r.origin === fromCity && r.destination === toCity)?.counters.map(counter => (
                        <option key={counter} value={counter}>{counter}</option>
                      ))}
                    </select>
                  </div>
                  {errors.counter && <p className="text-blue-500 text-[10px] font-bold ml-1 uppercase tracking-wider">{errors.counter}</p>}
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('booking.passenger.address')}</label>
                  <div className={`flex items-center bg-slate-50 border ${errors.address ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-100'} rounded-2xl px-4 py-3 transition-all`}>
                    <Home className={`${errors.address ? 'text-blue-500' : 'text-blue-600'} mr-3`} size={20} />
                    <input 
                      type="text" 
                      placeholder="Enter full address" 
                      className="bg-transparent w-full outline-none font-medium" 
                      value={passengerInfo.address}
                      onChange={(e) => {
                        setPassengerInfo({ ...passengerInfo, address: e.target.value });
                        if (errors.address) setErrors({ ...errors, address: undefined });
                      }}
                    />
                  </div>
                  {errors.address && <p className="text-blue-500 text-[10px] font-bold ml-1 uppercase tracking-wider">{errors.address}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('booking.passenger.district')}</label>
                  <div className={`flex items-center bg-slate-50 border ${errors.district ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-100'} rounded-2xl px-4 py-3 transition-all`}>
                    <MapPin className={`${errors.district ? 'text-blue-500' : 'text-blue-600'} mr-3`} size={20} />
                    <input 
                      type="text" 
                      placeholder="Enter district" 
                      className="bg-transparent w-full outline-none font-medium" 
                      value={passengerInfo.district}
                      onChange={(e) => {
                        setPassengerInfo({ ...passengerInfo, district: e.target.value });
                        if (errors.district) setErrors({ ...errors, district: undefined });
                      }}
                    />
                  </div>
                  {errors.district && <p className="text-blue-500 text-[10px] font-bold ml-1 uppercase tracking-wider">{errors.district}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('booking.passenger.thana')}</label>
                  <div className={`flex items-center bg-slate-50 border ${errors.thana ? 'border-blue-300 ring-2 ring-blue-50' : 'border-slate-100'} rounded-2xl px-4 py-3 transition-all`}>
                    <Navigation className={`${errors.thana ? 'text-blue-500' : 'text-blue-600'} mr-3`} size={20} />
                    <input 
                      type="text" 
                      placeholder="Enter thana" 
                      className="bg-transparent w-full outline-none font-medium" 
                      value={passengerInfo.thana}
                      onChange={(e) => {
                        setPassengerInfo({ ...passengerInfo, thana: e.target.value });
                        if (errors.thana) setErrors({ ...errors, thana: undefined });
                      }}
                    />
                  </div>
                  {errors.thana && <p className="text-blue-500 text-[10px] font-bold ml-1 uppercase tracking-wider">{errors.thana}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('booking.passenger.postOffice')}</label>
                  <div className={`flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 transition-all`}>
                    <Hash className="text-blue-600 mr-3" size={20} />
                    <input 
                      type="text" 
                      placeholder="Enter post office and code" 
                      className="bg-transparent w-full outline-none font-medium" 
                      value={passengerInfo.postOffice}
                      onChange={(e) => {
                        setPassengerInfo({ ...passengerInfo, postOffice: e.target.value });
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('booking.passenger.village')}</label>
                  <div className={`flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 transition-all`}>
                    <Home className="text-blue-600 mr-3" size={20} />
                    <input 
                      type="text" 
                      placeholder="Enter village" 
                      className="bg-transparent w-full outline-none font-medium" 
                      value={passengerInfo.village}
                      onChange={(e) => {
                        setPassengerInfo({ ...passengerInfo, village: e.target.value });
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Discount & Promo Code</h3>
                </div>
                <div className="flex gap-4 mb-6">
                  <input 
                    type="text" 
                    placeholder="Enter promo code (e.g. SAVE10)" 
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (discountCode === 'SAVE10') {
                        setAppliedDiscount(0.1);
                        toast.success('10% Discount Applied!');
                      } else {
                        toast.error('Invalid Promo Code');
                      }
                    }}
                    className="bg-slate-900 text-white font-bold px-8 rounded-2xl hover:bg-blue-600 transition-all"
                  >
                    Apply
                  </button>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">{t('booking.payment.method')}</h3>
                  <div className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                    <Shield size={14} className="text-emerald-600" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('booking.payment.secured')}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod('bKash')}
                    className={`p-4 border-2 rounded-2xl transition-all flex flex-col items-center gap-2 group ${
                      paymentMethod === 'bKash' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      paymentMethod === 'bKash' ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-blue-100'
                    }`}>
                      <Check size={20} className={paymentMethod === 'bKash' ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'} />
                    </div>
                    <span className={`font-bold ${paymentMethod === 'bKash' ? 'text-blue-900' : 'text-slate-600 group-hover:text-blue-900'}`}>{t('booking.payment.bKash')}</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod('nagad')}
                    className={`p-4 border-2 rounded-2xl transition-all flex flex-col items-center gap-2 group ${
                      paymentMethod === 'nagad' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      paymentMethod === 'nagad' ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-blue-100'
                    }`}>
                      <Check size={20} className={paymentMethod === 'nagad' ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'} />
                    </div>
                    <span className={`font-bold ${paymentMethod === 'nagad' ? 'text-blue-900' : 'text-slate-600 group-hover:text-blue-900'}`}>{t('booking.payment.nagad')}</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 border-2 rounded-2xl transition-all flex flex-col items-center gap-2 group ${
                      paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      paymentMethod === 'card' ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-blue-100'
                    }`}>
                      <Check size={20} className={paymentMethod === 'card' ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'} />
                    </div>
                    <span className={`font-bold ${paymentMethod === 'card' ? 'text-blue-900' : 'text-slate-600 group-hover:text-blue-900'}`}>{t('booking.payment.card')}</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setPaymentMethod('pay_later')}
                    className={`p-4 border-2 rounded-2xl transition-all flex flex-col items-center gap-2 group text-center ${
                      paymentMethod === 'pay_later' ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      paymentMethod === 'pay_later' ? 'bg-blue-100' : 'bg-slate-100 group-hover:bg-blue-100'
                    }`}>
                      <Clock size={20} className={paymentMethod === 'pay_later' ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'} />
                    </div>
                    <span className={`font-bold text-xs ${paymentMethod === 'pay_later' ? 'text-blue-900' : 'text-slate-600 group-hover:text-blue-900'}`}>{t('booking.payment.pay_later')}</span>
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isRedirecting}
                className={`w-full ${isRedirecting ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-100 text-lg flex items-center justify-center gap-3`}
              >
                {isRedirecting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {paymentMethod === 'pay_later'
                      ? (language === 'bn' ? 'বুকিং সম্পন্ন করা হচ্ছে...' : 'Completing Booking...')
                      : t('booking.payment.redirecting')}
                  </>
                ) : (
                  paymentMethod === 'pay_later'
                    ? (language === 'bn' ? 'পেমেন্ট ছাড়া বুকিং সম্পন্ন করুন' : 'Complete Booking Without Payment')
                    : `${t('booking.payment.confirm_pay')} ৳${Math.ceil((selectedSeats.length * (selectedBus?.price || 800)) * (1 - appliedDiscount))}`
                )}
              </button>
            </form>
          </div>
        </section>
      )}

      {/* Confirmation Section */}
      {step === 'confirmation' && (
        <section className="max-w-3xl mx-auto px-6 py-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[40px] p-8 md:p-12 border border-slate-100 shadow-2xl text-center print-ticket-container"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 no-print">
              <Check size={40} strokeWidth={3} />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-2">{t('booking.confirmation.title')}</h2>
            <p className="text-slate-500 font-medium mb-6 no-print">{t('booking.confirmation.subtitle')}</p>

            {paymentMethod === 'pay_later' && (
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 text-left no-print">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shrink-0 mt-0.5">
                    <Clock size={24} className="animate-spin" style={{ animationDuration: '8s' }} />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-950 text-base leading-tight mb-1">
                      {language === 'bn' ? 'বুকিংটি সাময়িকভাবে সংরক্ষিত করা হয়েছে' : 'Booking Temporarily Reserved'}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium">
                      {language === 'bn' 
                        ? 'বুকিংটি সম্পূর্ণভাবে নিশ্চিত করতে অনুগ্রহ করে নিচের সময়ের মধ্যে পেমেন্ট সম্পন্ন করুন। অন্যথায় বুকিংটি স্বয়ংক্রিয়ভাবে বাতিল হয়ে যাবে।' 
                        : 'Please complete payment within the countdown duration below to confirm your booking. Otherwise, your reservation will be automatically cancelled.'}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <CountdownTimer 
                    bookingDate={new Date().toISOString()}
                    language={language}
                  />
                </div>
              </div>
            )}
            
            <div className="bg-slate-50 rounded-3xl p-8 text-left space-y-6 mb-10 border border-slate-100 print:bg-white print:border-slate-200">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('booking.confirmation.no')}</span>
                <span className="text-lg font-black text-blue-600">{confirmationNumber}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.confirmation.passenger')}</p>
                  <p className="font-bold text-slate-900">{passengerInfo.name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.confirmation.phone')}</p>
                  <p className="font-bold text-slate-900">{passengerInfo.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.confirmation.bus')}</p>
                  <p className="font-bold text-slate-900">{selectedBus?.name}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.confirmation.seats')}</p>
                  <p className="font-bold text-slate-900">{selectedSeats.join(', ')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.confirmation.departure')}</p>
                  <p className="font-bold text-slate-900">{selectedBus?.departure}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.confirmation.total')}</p>
                  <p className="font-bold text-slate-900">৳{Math.ceil((selectedSeats.length * (selectedBus?.price || 800)) * (1 - appliedDiscount))}</p>
                </div>
              </div>

              {/* Print-only Footer inside the ticket */}
              <div className="hidden print:block pt-8 border-t border-slate-200 mt-8">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('booking.confirmation.issued_by')}</p>
                    <p className="text-sm font-bold text-blue-900">{t('brand.name')} {t('booking.confirmation.portal')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('booking.confirmation.date_issued')}</p>
                    <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-[8px] text-slate-400 mt-6 text-center italic">{t('booking.confirmation.print_note')}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 no-print">
              <button 
                onClick={async () => {
                  const bookingData = {
                    ticketId: confirmationNumber || ('BK-' + Math.random().toString(36).substr(2, 9).toUpperCase()),
                    name: passengerInfo.name || 'Passenger',
                    phone: passengerInfo.phone || 'N/A',
                    fromCity: fromCity || 'Dhaka',
                    toCity: toCity || 'Khagrachari',
                    route: `${fromCity} to ${toCity}`,
                    seats: selectedSeats,
                    busName: selectedBus?.name || 'Bus',
                    departure: selectedBus?.departure || 'N/A',
                    journeyDate: journeyDate || new Date().toISOString().split('T')[0],
                    price: selectedBus?.price || 800,
                    appliedDiscount: appliedDiscount || 0,
                    totalAmount: Math.ceil((selectedSeats.length * (selectedBus?.price || 800)) * (1 - appliedDiscount)),
                    paymentMethod: paymentMethod || 'bKash',
                    counter: passengerInfo.counter || 'GABTOLI 11 NO COUNTER'
                  };
                  try {
                    await generateTicketPDF(bookingData, language, t);
                  } catch (err) {
                    toast.error(language === 'bn' ? 'ডাউনলোড করতে ব্যর্থ হয়েছে।' : 'Download failed.');
                  }
                }}
                className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Download size={20} />
                {t('button.downloadPDF')}
              </button>
              <button 
                onClick={() => {
                  const ongoingBooking = {
                    id: confirmationNumber || 'TL-MOCK123',
                    fromCity: fromCity || 'Dhaka',
                    toCity: toCity || 'Khagrachari',
                    route: `${fromCity} to ${toCity}`,
                    bus: selectedBus?.name || 'Bus',
                    passenger_name: passengerInfo.name || 'Passenger',
                    phone_number: passengerInfo.phone || 'N/A',
                    seats: selectedSeats,
                    travel_date: journeyDate,
                    time: selectedBus?.departure || 'N/A',
                    amount: Math.ceil((selectedSeats.length * (selectedBus?.price || 800)) * (1 - appliedDiscount)),
                    paymentMethod: paymentMethod || 'bKash',
                    counter: passengerInfo.counter || 'GABTOLI 11 NO COUNTER'
                  };
                  setTicketPreviewBooking(ongoingBooking);
                }}
                className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <Eye size={20} />
                {language === 'bn' ? 'টিকিট প্রিভিউ' : 'Ticket Preview'}
              </button>
              <button 
                onClick={() => {
                  setStep('search');
                  setSelectedSeats([]);
                  setSelectedBus(null);
                  setPassengerInfo({ 
                    name: '', 
                    phone: '', 
                    email: '', 
                    identity: '', 
                    address: '', 
                    district: '', 
                    thana: '', 
                    postOffice: '', 
                    village: '',
                    gender: '',
                    counter: ''
                  });
                }}
                className="flex-1 bg-white border-2 border-slate-200 text-slate-600 font-bold py-4 rounded-2xl hover:bg-slate-50 transition-all"
              >
                {t('booking.confirmation.back')}
              </button>
            </div>
          </motion.div>
        </section>
      )}

      {/* My Bookings Section */}
      {step === 'my-bookings' && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                <History size={24} />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900">{t('my_bookings.title')}</h2>
                <p className="text-slate-500 font-medium">{t('my_bookings.subtitle')}</p>
              </div>
            </div>
            <button 
              onClick={() => setStep('search')}
              className="bg-slate-100 text-slate-600 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-all"
            >
              {t('my_bookings.new_trip')}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {bookings.map((booking) => (
              <motion.div 
                key={booking.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all"
              >
                <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">{booking.id}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                        booking.status === 'Upcoming' ? 'bg-emerald-50 text-emerald-600' : 
                        booking.status === 'Completed' ? 'bg-slate-100 text-slate-500' : 
                        booking.status === 'Reserved' ? 'bg-amber-50 text-amber-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        {booking.status === 'Upcoming' ? t('my_bookings.upcoming') : 
                         booking.status === 'Completed' ? t('my_bookings.completed') : 
                         booking.status === 'Reserved' ? (language === 'bn' ? 'পেমেন্ট বাকি' : 'Pending Payment') :
                         t('my_bookings.cancelled')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{booking.route}</h3>
                    {booking.status === 'Reserved' && booking.booking_date && (
                      <div className="mt-1.5 mb-2.5">
                        <CountdownTimer 
                          bookingDate={booking.booking_date} 
                          language={language}
                          onExpired={fetchMyBookings}
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5"><Calendar size={14} /> {booking.date}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span className="flex items-center gap-1.5"><Bus size={14} /> {booking.bus}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right mr-4">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('my_bookings.total_paid')}</p>
                      <p className="text-xl font-black text-slate-900">৳{booking.price}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setViewingBooking(booking)}
                        className="p-3 bg-slate-50 text-slate-600 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                        title={t('my_bookings.view_details')}
                      >
                        <Eye size={20} />
                      </button>
                      <button 
                        onClick={() => setTicketPreviewBooking(booking)}
                        className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                        title={language === 'bn' ? 'টিকিট প্রিভিউ' : 'Ticket Preview'}
                      >
                        <FileText size={20} />
                      </button>
                      {booking.status === 'Reserved' && (
                        <button 
                          onClick={() => handlePayNow(booking)}
                          disabled={isRedirecting}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-black text-xs flex items-center gap-1.5 shadow-sm"
                          title={language === 'bn' ? 'পেমেন্ট করুন' : 'Pay Now'}
                        >
                          <CreditCard size={14} />
                          {language === 'bn' ? 'পেমেন্ট করুন' : 'Pay Now'}
                        </button>
                      )}
                      {booking.status === 'Upcoming' && (
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          className="p-3 bg-slate-50 text-blue-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all"
                          title={t('my_bookings.cancel_booking')}
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Booking Details Modal */}
          <AnimatePresence>
            {viewingBooking && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setViewingBooking(null)}
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
                >
                  <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-2xl font-black text-slate-900">{t('my_bookings.details_title')}</h3>
                    <button onClick={() => setViewingBooking(null)} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                      <X size={24} />
                    </button>
                  </div>
                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.confirmation.no')}</p>
                        <p className="font-bold text-blue-600">{viewingBooking.id}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.status')}</p>
                        <p className="font-bold text-slate-900">{viewingBooking.status === 'Upcoming' ? t('my_bookings.upcoming') : 
                                                                viewingBooking.status === 'Completed' ? t('my_bookings.completed') : 
                                                                t('my_bookings.cancelled')}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.route')}</p>
                        <p className="font-bold text-slate-900">{viewingBooking.route}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.date')}</p>
                        <p className="font-bold text-slate-900">{viewingBooking.date}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.confirmation.seats')}</p>
                        <p className="font-bold text-slate-900">{viewingBooking.seats.join(', ')}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t('booking.confirmation.bus')}</p>
                        <p className="font-bold text-slate-900">{viewingBooking.bus}</p>
                      </div>
                    </div>
                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                      <p className="text-lg font-black text-slate-900">{t('booking.confirmation.total')}</p>
                      <p className="text-2xl font-black text-blue-600">৳{viewingBooking.price}</p>
                    </div>
                  </div>
                  <div className="p-8 bg-slate-50">
                    <button 
                      onClick={() => setViewingBooking(null)}
                      className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all"
                    >
                      {t('my_bookings.close')}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </section>
      )}

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

      </main>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-5 h-5 rounded ${color} flex items-center justify-center`}>
        <Bus size={12} className={color.includes('white') ? 'text-slate-200' : 'text-white/40'} />
      </div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}
