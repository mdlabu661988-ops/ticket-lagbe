import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Users, Car, ShieldCheck, Clock, CheckCircle2, 
  Phone, Mail, ArrowRight, Briefcase, Globe, Zap, Search, 
  MapPin, Calendar, Filter, Truck, Tractor as Lorry, User as DriverIcon, 
  X, Star, Upload, Check, Navigation, CreditCard
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';

interface CorporateProps {
  onBack: () => void;
}

interface Vehicle {
  id: number;
  name: string;
  type: string;
  image_url: string;
  capacity: number;
  fare_per_km: number;
  status: string;
}

export default function Corporate({ onBack }: CorporateProps) {
  const { language } = useLanguage();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('All');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingStep, setBookingStep] = useState<'info' | 'payment'>('info');
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'nagad' | 'card'>('bkash');
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [bookingData, setBookingData] = useState({
    pickup: '',
    drop: '',
    date: ''
  });

  const [driverProfile, setDriverProfile] = useState({
    bio: '',
    experience: '',
    license: '',
    image: ''
  });

  const [isUploading, setIsUploading] = useState(false);
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

  const vehicleTypes = ['All', 'Sedan', 'SUV', 'Microbus', 'Truck', 'Pickup', 'Lorry'];

  useEffect(() => {
    fetchVehicles();
    fetchSettings();
  }, [selectedType]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/corporate/settings');
      const data = await res.json();
      if (data && Object.keys(data).length > 0) {
        setCorporateContent(data);
      }
    } catch (error) {
      console.error('Failed to load corporate settings');
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/corporate/vehicles?type=${selectedType}`);
      const data = await res.json();
      setVehicles(data);
    } catch (error) {
      toast.error('Failed to load fleet');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingStep === 'info') {
      setBookingStep('payment');
      return;
    }

    try {
      const estimatedTotal = selectedVehicle?.fare_per_km ? 50 * selectedVehicle.fare_per_km : 1000;
      const advancePaid = estimatedTotal * 0.25;

      const res = await fetch('/api/corporate/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1, // Mock user ID
          vehicle_id: selectedVehicle?.id,
          pickup_location: bookingData.pickup,
          drop_location: bookingData.drop,
          date: bookingData.date,
          amount: estimatedTotal,
          advance_paid: advancePaid,
          payment_method: paymentMethod
        })
      });
      if (res.ok) {
        toast.success('Reservation request sent successfully!');
        setShowBookingModal(false);
        setBookingStep('info');
      }
    } catch (error) {
      toast.error('Booking failed');
    }
  };

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/corporate/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 1, // Mock
          bio: driverProfile.bio,
          experience: driverProfile.experience,
          license_number: driverProfile.license,
          profile_image: driverProfile.image
        })
      });
      if (res.ok) {
        toast.success('Driver profile submitted successfully!');
        setShowDriverModal(false);
      }
    } catch (error) {
      toast.error('Failed to submit profile');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section with Integrated Search */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center bg-slate-900 pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src={corporateContent.heroImage} 
            alt="Corporate Office" 
            className="w-full h-full object-cover opacity-30"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/60 to-slate-900" />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] mb-6">
              {language === 'bn' ? 'কর্পোরেট লজিস্টিকস' : 'Corporate Logistics'}
            </span>
            <h1 className="text-4xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tight">
              {language === 'bn' ? corporateContent.heroTitle_bn : corporateContent.heroTitle_en}
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10 font-medium">
              {language === 'bn' ? corporateContent.heroSubtitle_bn : corporateContent.heroSubtitle_en}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search Bar Container */}
      <div className="relative z-20 w-full max-w-5xl px-6 mx-auto -mt-16">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[2.5rem] p-4 shadow-2xl shadow-slate-900/40 border border-slate-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600">
                <MapPin size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Pickup Location" 
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-emerald-600 transition-all font-bold text-sm"
              />
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600">
                <Navigation size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Drop Location" 
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-emerald-600 transition-all font-bold text-sm"
              />
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500">
                <Calendar size={20} />
              </div>
              <input 
                type="date" 
                className="w-full bg-slate-50 border-none rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-emerald-600 transition-all font-bold text-sm"
              />
            </div>
            <button className="bg-emerald-600 text-white font-black py-4 rounded-2xl hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2">
              <Search size={20} /> Search Fleet
            </button>
          </div>
        </motion.div>
      </div>

      {/* Fleet Section */}
      <section className="pt-32 pb-24 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-8">
          <div>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter">Choose Your <span className="text-emerald-600">Fleet</span></h2>
            <p className="text-slate-500 font-medium max-w-lg">Select from our verified range of corporate vehicles including trucks and logistics support.</p>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">
            {vehicleTypes.map(type => (
              <button 
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  selectedType === type 
                  ? 'bg-slate-900 text-white shadow-lg' 
                  : 'bg-white text-slate-400 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-slate-200 animate-pulse h-[400px] rounded-[2rem]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            <AnimatePresence mode="popLayout">
              {vehicles.map((vehicle, idx) => (
                <motion.div
                  layout
                  key={vehicle.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white group rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-emerald-200 transition-all overflow-hidden flex flex-col"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img 
                      src={vehicle.image_url} 
                      alt={vehicle.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{vehicle.type}</span>
                    </div>
                  </div>
                  
                  <div className="p-8 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{vehicle.name}</h3>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star size={14} fill="currentColor" />
                        <span className="text-xs font-black">4.8</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-8">
                      <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                        <Users size={16} className="text-emerald-600" />
                        <span>Up to {vehicle.capacity} Passengers</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                        <ShieldCheck size={16} className="text-emerald-600" />
                        <span>Verified Chauffeur</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                        <Zap size={16} className="text-emerald-600" />
                        <span>৳{vehicle.fare_per_km}/km or Monthly Basis</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setShowBookingModal(true);
                      }}
                      className="mt-auto w-full bg-slate-900 text-white font-black py-4 rounded-2xl group-hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 uppercase tracking-tighter"
                    >
                      Rent Now <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Driver Registration CTA */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-slate-900 rounded-[3.5rem] p-12 md:p-20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[40%] h-full opacity-10 pointer-events-none transition-transform duration-1000 group-hover:translate-x-10">
              <img src="https://images.unsplash.com/photo-1549194833-281b379361ad?auto=format&fit=crop&q=80&w=1000" alt="Truck" className="w-full h-full object-cover" />
            </div>
            
            <div className="relative z-10 max-w-2xl">
              <span className="inline-block px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] mb-8">
                Join Our Network
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-8 leading-tight tracking-tight">
                Own a vehicle? <br /> <span className="text-emerald-500">Become a Partner.</span>
              </h2>
              <p className="text-lg text-slate-400 mb-12 font-medium leading-relaxed">
                List your vehicle (Truck, Sedan, SUV, or Lorry) and start earning today. Professional drivers can share their profiles and get verified for corporate contracts.
              </p>
              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setShowDriverModal(true)}
                  className="bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-2xl shadow-emerald-600/30 flex items-center gap-2 group/btn"
                >
                  Create Driver Profile <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
                <button className="bg-white/10 text-white border border-white/20 px-10 py-5 rounded-2xl font-black hover:bg-white/20 transition-all backdrop-blur-md">
                  List Your Vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] p-10 overflow-hidden"
            >
              <button 
                onClick={() => setShowBookingModal(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="mb-10 text-center">
                <h3 className="text-2xl font-black text-slate-900 mb-2">
                  {bookingStep === 'info' ? `Reserve ${selectedVehicle?.name}` : 'Confirm 25% Advance Payment'}
                </h3>
                <p className="text-slate-500 font-medium">
                  {bookingStep === 'info' 
                    ? 'Please provide your trip details for the reservation.' 
                    : 'To confirm your reservation, a 25% advance payment is required.'}
                </p>
              </div>
              
              <form onSubmit={handleBooking} className="space-y-6">
                {bookingStep === 'info' ? (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Pickup Point</label>
                        <input 
                          required
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-bold"
                          value={bookingData.pickup}
                          onChange={(e) => setBookingData({...bookingData, pickup: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Drop Point</label>
                        <input 
                          required
                          type="text" 
                          className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-bold"
                          value={bookingData.drop}
                          onChange={(e) => setBookingData({...bookingData, drop: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Travel Date</label>
                      <input 
                        required
                        type="date" 
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-bold"
                        value={bookingData.date}
                        onChange={(e) => setBookingData({...bookingData, date: e.target.value})}
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      {['bkash', 'nagad', 'card'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method as any)}
                          className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                            paymentMethod === method 
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-600' 
                              : 'border-slate-100 bg-slate-50 text-slate-400 grayscale hover:grayscale-0'
                          }`}
                        >
                          <CreditCard size={24} />
                          <span className="text-[10px] font-black uppercase tracking-widest">{method}</span>
                        </button>
                      ))}
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-6 text-white">
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                        <span className="text-xs font-bold text-white/60">Estimated Total</span>
                        <span className="text-lg font-black font-mono">৳{selectedVehicle?.fare_per_km ? (50 * selectedVehicle.fare_per_km).toLocaleString() : '1,000'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="block text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Payable Now (25%)</span>
                          <span className="text-3xl font-black text-white">৳{(selectedVehicle?.fare_per_km ? (50 * selectedVehicle.fare_per_km * 0.25) : 250).toLocaleString()}</span>
                        </div>
                        <ShieldCheck className="text-emerald-500" size={32} />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between">
                  <div>
                    <p className="text-emerald-700 text-xs font-black uppercase tracking-widest mb-1">Estimated Fare</p>
                    <p className="text-emerald-900 text-2xl font-black">৳{selectedVehicle?.fare_per_km ? 50 * selectedVehicle.fare_per_km : '---'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-700 text-[10px] font-bold uppercase tracking-widest">Base Rate: ৳{selectedVehicle?.fare_per_km}/km</p>
                    <p className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest italic">Wait for confirmation</p>
                  </div>
                </div>
                
                <button type="submit" className="w-full bg-emerald-600 text-white font-black py-5 rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 text-lg uppercase tracking-tight">
                  {bookingStep === 'info' ? 'Next: Review & Pay' : 'Pay Advance & Confirm Request'}
                </button>
                {bookingStep === 'payment' && (
                  <button 
                    type="button"
                    onClick={() => setBookingStep('info')}
                    className="w-full text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                  >
                    Go Back to Details
                  </button>
                )}
              </form>
            </motion.div>
          </div>
        )}

        {/* Driver Profile Modal */}
        {showDriverModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDriverModal(false)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[3rem] p-10 overflow-hidden"
            >
              <button 
                onClick={() => setShowDriverModal(false)}
                className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="mb-10 text-center">
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Driver Profile Application</h3>
                <p className="text-slate-500 font-medium">Step into the future of logistics. Join our verified driver network.</p>
              </div>
              
              <form onSubmit={handleDriverSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">License Number</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-bold"
                      value={driverProfile.license}
                      onChange={(e) => setDriverProfile({...driverProfile, license: e.target.value})}
                      placeholder="DL-XXXX-XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Experience (Years)</label>
                    <input 
                      required
                      type="number" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-bold"
                      value={driverProfile.experience}
                      onChange={(e) => setDriverProfile({...driverProfile, experience: e.target.value})}
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Professional Bio</label>
                  <textarea 
                    required
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-bold h-32 resize-none"
                    value={driverProfile.bio}
                    onChange={(e) => setDriverProfile({...driverProfile, bio: e.target.value})}
                    placeholder="Tell us about your driving history and vehicle expertise..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Profile Image URL</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <Upload size={18} />
                    </div>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 outline-none focus:ring-2 focus:ring-emerald-600 transition-all font-bold"
                      value={driverProfile.image}
                      onChange={(e) => setDriverProfile({...driverProfile, image: e.target.value})}
                      placeholder="https://example.com/photo.jpg"
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="text-blue-600" size={24} />
                    <div>
                      <h4 className="text-sm font-bold text-blue-900">Safety Verification Involved</h4>
                      <p className="text-xs text-blue-700 font-medium mt-1">By submitting, you agree to our driver background check and safety compliance protocols.</p>
                    </div>
                  </div>
                </div>
                
                <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/20 text-lg uppercase tracking-tight flex items-center justify-center gap-3">
                  Submit Application <ArrowRight size={20} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <button 
        onClick={onBack}
        className="fixed bottom-8 right-8 bg-white/80 backdrop-blur text-slate-900 px-8 py-4 rounded-2xl font-black border border-slate-200 shadow-2xl hover:bg-white transition-all flex items-center gap-2 z-50 uppercase tracking-widest text-[10px]"
      >
        <ArrowRight size={16} className="rotate-180" /> Exit Corporate
      </button>
    </div>
  );
}

function ServiceCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div 
      whileHover={{ y: -12, scale: 1.02 }}
      className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 hover:border-emerald-100 transition-all relative group"
    >
      <div className="mb-8 w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed">{description}</p>
      
      <div className="mt-8 transition-opacity">
        <span className="text-emerald-600 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
          Learn More <ArrowRight size={14} />
        </span>
      </div>
    </motion.div>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-5 group">
      <div className="mt-1 w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
        <CheckCircle2 size={18} />
      </div>
      <div>
        <h4 className="font-black text-slate-900 mb-1 tracking-tight text-lg">{title}</h4>
        <p className="text-slate-500 font-medium text-sm leading-snug">{description}</p>
      </div>
    </div>
  );
}
