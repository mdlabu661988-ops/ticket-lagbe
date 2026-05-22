import React, { useState } from 'react';
import { Bus, Shield, Clock, Star, MapPin, Search, Phone, MessageSquare, ArrowRight, Users, Globe, Calendar, Info, Ticket, Sparkles, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

interface HomePageProps {
  onSearch: (searchData: any) => void;
  onOpenSupport: () => void;
  userRole?: string | null;
  onNavigate?: (view: string) => void;
  onLogin?: () => void;
  onProfile?: () => void;
  isLoggedIn?: boolean;
}

export default function HomePage({ 
  onSearch, 
  onOpenSupport, 
  userRole, 
  onNavigate,
  onLogin,
  onProfile,
  isLoggedIn 
}: HomePageProps) {
  const { t, formatNumber } = useLanguage();
  const [fareFrom, setFareFrom] = useState(t('city.dhaka'));
  const [fareTo, setFareTo] = useState(t('city.chattogram'));

  // Gemini Spark Travel Planner State and Handler
  const [sparkDest, setSparkDest] = useState('');
  const [sparkDays, setSparkDays] = useState(3);
  const [sparkLoading, setSparkLoading] = useState(false);
  const [sparkResult, setSparkResult] = useState('');

  const generateSparkPlan = async () => {
    if (!sparkDest.trim() || sparkLoading) return;
    setSparkLoading(true);
    setSparkResult('');
    try {
      const response = await fetch('/api/gemini/spark-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: sparkDest, days: sparkDays })
      });
      const data = await response.json();
      setSparkResult(data.text || 'Error preparing travel guide.');
    } catch (error) {
      console.error('Error generating guide:', error);
      setSparkResult('দুঃখিত, সংযোগ সমস্যার কারণে ট্যুর প্ল্যান তৈরি করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSparkLoading(false);
    }
  };

  const FARES = [
    { from: t('city.dhaka'), to: t('city.chattogram'), nonAc: 800, ac: 1200, premium: 1500 },
    { from: t('city.dhaka'), to: t('city.sylhet'), nonAc: 600, ac: 1000, premium: 1300 },
    { from: t('city.dhaka'), to: t('city.rajshahi'), nonAc: 700, ac: 1100, premium: 1400 },
    { from: t('city.dhaka'), to: t('city.coxsbazar'), nonAc: 1000, ac: 1500, premium: 2000 },
    { from: t('city.chattogram'), to: t('city.dhaka'), nonAc: 800, ac: 1200, premium: 1500 },
    { from: t('city.sylhet'), to: t('city.dhaka'), nonAc: 600, ac: 1000, premium: 1300 },
  ];

  const currentFare = FARES.find(f => f.from === fareFrom && f.to === fareTo);
  const stations = Array.from(new Set([...FARES.map(f => f.from), ...FARES.map(f => f.to)]));

  const POPULAR_ROUTES = [
    { id: 'dhaka-to-chittagong', from: 'Dhaka', to: 'Chittagong', distance: '265KM', price: '680', image: 'https://picsum.photos/id/10/400/300' },
    { id: 'dhaka-to-coxs-bazar', from: 'Dhaka', to: "Cox's Bazar", distance: '390 KM', price: '1050', image: 'https://picsum.photos/id/15/400/300' },
    { id: 'dhaka-to-barisal', from: 'Dhaka', to: 'Barisal', distance: '247 KM', price: '500', image: 'https://picsum.photos/id/28/400/300' },
    { id: 'dhaka-to-patuakhali', from: 'Dhaka', to: 'Patuakhali', distance: '281 KM', price: '650', image: 'https://picsum.photos/id/54/400/300' },
    { id: 'dhaka-to-kuakata', from: 'Dhaka', to: 'Kuakata', distance: '349 KM', price: '750', image: 'https://picsum.photos/id/60/400/300' },
    { id: 'dhaka-to-barguna', from: 'Dhaka', to: 'Barguna', distance: '293 KM', price: '670', image: 'https://picsum.photos/id/70/400/300' },
    { id: 'dhaka-to-teknaf', from: 'Dhaka', to: 'Teknaf', distance: '458 KM', price: '1200', image: 'https://picsum.photos/id/80/400/300' },
    { id: 'dhaka-to-khagrachari', from: 'Dhaka', to: 'Khagrachari', distance: '270 KM', price: '750', image: 'https://picsum.photos/id/90/400/300' },
    { id: 'dhaka-to-bandarban', from: 'Dhaka', to: 'Bandarban', distance: '376 KM', price: '850', image: 'https://picsum.photos/id/100/400/300' },
    { id: 'dhaka-to-rangamati', from: 'Dhaka', to: 'Rangamati', distance: '304 KM', price: '850', image: 'https://picsum.photos/id/110/400/300' },
    { id: 'dhaka-to-bagerhat', from: 'Dhaka', to: 'Bagerhat', distance: '216KM', price: '650', image: 'https://picsum.photos/id/120/400/300' },
    { id: 'dhaka-to-pirojpur', from: 'Dhaka', to: 'Pirojpur', distance: '205KM', price: '650', image: 'https://picsum.photos/id/130/400/300' },
    { id: 'dhaka-to-faridpur', from: 'Dhaka', to: 'Faridpur', distance: '119 KM', price: '400', image: 'https://picsum.photos/id/140/400/300' },
    { id: 'dhaka-to-gopalganj', from: 'Dhaka', to: 'Gopalganj', distance: '158 KM', price: '500', image: 'https://picsum.photos/id/150/400/300' },
    { id: 'dhaka-to-sirajganj', from: 'Dhaka', to: 'Sirajganj', distance: '127 KM', price: '350', image: 'https://picsum.photos/id/160/400/300' },
    { id: 'dhaka-to-natore', from: 'Dhaka', to: 'Natore', distance: '164KM', price: '600', image: 'https://picsum.photos/id/170/400/300' },
    { id: 'dhaka-to-rajshahi', from: 'Dhaka', to: 'Rajshahi', distance: '245 KM', price: '700', image: 'https://picsum.photos/id/180/400/300' },
    { id: 'dhaka-to-chapainawabganj', from: 'Dhaka', to: 'Chapainawabganj', distance: '316 KM', price: '800', image: 'https://picsum.photos/id/190/400/300' },
    { id: 'dhaka-to-jhalokathi', from: 'Dhaka', to: 'Jhalokathi', distance: '240KM', price: '550', image: 'https://picsum.photos/id/200/400/300' },
    { id: 'dhaka-to-moulvibazar', from: 'Dhaka', to: 'Moulvibazar', distance: '198KM', price: '550', image: 'https://picsum.photos/id/210/400/300' },
    { id: 'dhaka-to-magura', from: 'Dhaka', to: 'Magura', distance: '167KM', price: '500', image: 'https://picsum.photos/id/220/400/300' },
    { id: 'dhaka-to-jessore', from: 'Dhaka', to: 'Jessore', distance: '192KM', price: '550', image: 'https://picsum.photos/id/230/400/300' },
    { id: 'dhaka-to-dinajpur', from: 'Dhaka', to: 'Dinajpur', distance: '330 KM', price: '700', image: 'https://picsum.photos/id/240/400/300' },
    { id: 'dhaka-to-bogura', from: 'Dhaka', to: 'Bogura', distance: '192KM', price: '550', image: 'https://picsum.photos/id/250/400/300' },
    { id: 'dhaka-to-panchagarh', from: 'Dhaka', to: 'Panchagarh', distance: '408 KM', price: '1050', image: 'https://picsum.photos/id/260/400/300' },
    { id: 'dhaka-to-rangpur', from: 'Dhaka', to: 'Rangpur', distance: '316 KM', price: '700', image: 'https://picsum.photos/id/270/400/300' },
    { id: 'dhaka-to-naogaon', from: 'Dhaka', to: 'Naogaon', distance: '240K', price: '680', image: 'https://picsum.photos/id/280/400/300' },
    { id: 'dhaka-to-gaibandha', from: 'Dhaka', to: 'Gaibandha', distance: '264KM', price: '700', image: 'https://picsum.photos/id/290/400/300' },
    { id: 'dhaka-to-nilphamari', from: 'Dhaka', to: 'Nilphamari', distance: '354KM', price: '700', image: 'https://picsum.photos/id/300/400/300' },
    { id: 'dhaka-to-kushtia', from: 'Dhaka', to: 'Kushtia', distance: '248KM', price: '650', image: 'https://picsum.photos/id/310/400/300' },
    { id: 'dhaka-to-jhenaidah', from: 'Dhaka', to: 'Jhenaidah', distance: '196KM', price: '650', image: 'https://picsum.photos/id/320/400/300' },
    { id: 'dhaka-to-meherpur', from: 'Dhaka', to: 'Meherpur', distance: '269KM', price: '650', image: 'https://picsum.photos/id/330/400/300' },
    { id: 'dhaka-to-tangail', from: 'Dhaka', to: 'Tangail', distance: '96KM', price: '300', image: 'https://picsum.photos/id/340/400/300' },
    { id: 'dhaka-to-comilla', from: 'Dhaka', to: 'Comilla', distance: '109 KM', price: '500', image: 'https://picsum.photos/id/350/400/300' },
    { id: 'dhaka-to-satkhira', from: 'Dhaka', to: 'Satkhira', distance: '274KM', price: '650', image: 'https://picsum.photos/id/360/400/300' },
    { id: 'dhaka-to-pabna', from: 'Dhaka', to: 'Pabna', distance: '160KM', price: '500', image: 'https://picsum.photos/id/370/400/300' },
    { id: 'dhaka-to-sherpur', from: 'Dhaka', to: 'Sherpur', distance: '187 KM', price: '600', image: 'https://picsum.photos/id/380/400/300' },
    { id: 'dhaka-to-sylhet', from: 'Dhaka', to: 'Sylhet', distance: '245KM', price: '700', image: 'https://picsum.photos/id/390/400/300' },
    { id: 'dhaka-to-sunamganj', from: 'Dhaka', to: 'Sunamganj', distance: '260KM', price: '800', image: 'https://picsum.photos/id/400/400/300' },
    { id: 'dhaka-to-khulna', from: 'Dhaka', to: 'Khulna', distance: '246KM', price: '600', image: 'https://picsum.photos/id/410/400/300' },
    { id: 'chittagong-to-dhaka', from: 'Chittagong', to: 'Dhaka', distance: '265KM', price: '550', image: 'https://picsum.photos/id/420/400/300' },
    { id: 'chittagong-to-coxs-bazar', from: 'Chittagong', to: "Cox's Bazar", distance: '145 KM', price: '350', image: 'https://picsum.photos/id/430/400/300' },
    { id: 'chittagong-to-rajshahi', from: 'Chittagong', to: 'Rajshahi', distance: '502KM', price: '800', image: 'https://picsum.photos/id/440/400/300' },
    { id: 'chittagong-to-chapainawabganj', from: 'Chittagong', to: 'Chapainawabganj', distance: '551KM', price: '900', image: 'https://picsum.photos/id/450/400/300' },
    { id: 'coxs-bazar-to-dhaka', from: "Cox's Bazar", to: 'Dhaka', distance: '402KM', price: '900', image: 'https://picsum.photos/id/460/400/300' },
    { id: 'coxs-bazar-to-chittagong', from: "Cox's Bazar", to: 'Chittagong', distance: '150 KM', price: '500', image: 'https://picsum.photos/id/470/400/300' },
    { id: 'coxs-bazar-to-khagrachari', from: "Cox's Bazar", to: 'Khagrachari', distance: '256K', price: '720', image: 'https://picsum.photos/id/480/400/300' },
    { id: 'khulna-to-dhaka', from: 'Khulna', to: 'Dhaka', distance: '246KM', price: '600', image: 'https://picsum.photos/id/490/400/300' },
    { id: 'khulna-to-chittagong', from: 'Khulna', to: 'Chittagong', distance: '442 KM', price: '900', image: 'https://picsum.photos/id/500/400/300' },
    { id: 'jessore-to-dhaka', from: 'Jessore', to: 'Dhaka', distance: '186KM', price: '550', image: 'https://picsum.photos/id/510/400/300' },
    { id: 'magura-to-dhaka', from: 'Magura', to: 'Dhaka', distance: '169KM', price: '500', image: 'https://picsum.photos/id/520/400/300' },
    { id: 'gazipur-to-barisal', from: 'Gazipur', to: 'Barisal', distance: '205KM', price: '650', image: 'https://picsum.photos/id/530/400/300' },
    { id: 'bandarban-to-dhaka', from: 'Bandarban', to: 'Dhaka', distance: '376KM', price: '870', image: 'https://picsum.photos/id/540/400/300' },
    { id: 'barisal-to-gazipur', from: 'Barisal', to: 'Gazipur', distance: '205KM', price: '650', image: 'https://picsum.photos/id/550/400/300' },
    { id: 'barisal-to-dhaka', from: 'Barisal', to: 'Dhaka', distance: '180KM', price: '500', image: 'https://picsum.photos/id/560/400/300' },
    { id: 'jhalokathi-to-dhaka', from: 'Jhalokathi', to: 'Dhaka', distance: '205KM', price: '600', image: 'https://picsum.photos/id/570/400/300' },
    { id: 'barguna-to-dhaka', from: 'Barguna', to: 'Dhaka', distance: '293KM', price: '700', image: 'https://picsum.photos/id/580/400/300' },
    { id: 'patuakhali-to-dhaka', from: 'Patuakhali', to: 'Dhaka', distance: '225KM', price: '600', image: 'https://picsum.photos/id/590/400/300' },
    { id: 'rangpur-to-dhaka', from: 'Rangpur', to: 'Dhaka', distance: '294 KM', price: '700', image: 'https://picsum.photos/id/600/400/300' },
    { id: 'pirojpur-to-dhaka', from: 'Pirojpur', to: 'Dhaka', distance: '205KM', price: '650', image: 'https://picsum.photos/id/610/400/300' },
    { id: 'feni-to-dhaka', from: 'Feni', to: 'Dhaka', distance: '146 KM', price: '500', image: 'https://picsum.photos/id/620/400/300' },
    { id: 'dinajpur-to-dhaka', from: 'Dinajpur', to: 'Dhaka', distance: '331KM', price: '700', image: 'https://picsum.photos/id/630/400/300' },
    { id: 'jhenaidah-to-dhaka', from: 'Jhenaidah', to: 'Dhaka', distance: '196KM', price: '600', image: 'https://picsum.photos/id/640/400/300' },
    { id: 'khagrachari-to-dhaka', from: 'Khagrachari', to: 'Dhaka', distance: '270KM', price: '750', image: 'https://picsum.photos/id/650/400/300' },
    { id: 'khagrachari-to-coxs-bazar', from: 'Khagrachari', to: "Cox's Bazar", distance: '251KM', price: '720', image: 'https://picsum.photos/id/660/400/300' },
    { id: 'bogura-to-dhaka', from: 'Bogura', to: 'Dhaka', distance: '187 KM', price: '550', image: 'https://picsum.photos/id/670/400/300' },
    { id: 'gopalganj-to-dhaka', from: 'Gopalganj', to: 'Dhaka', distance: '160KM', price: '500', image: 'https://picsum.photos/id/680/400/300' },
    { id: 'rajshahi-to-dhaka', from: 'Rajshahi', to: 'Dhaka', distance: '245KM', price: '710', image: 'https://picsum.photos/id/690/400/300' },
    { id: 'rajshahi-to-chittagong', from: 'Rajshahi', to: 'Chittagong', distance: '520KM', price: '800', image: 'https://picsum.photos/id/700/400/300' },
    { id: 'rajshahi-to-coxs-bazar', from: 'Rajshahi', to: "Cox's Bazar", distance: '672KM', price: '1500', image: 'https://picsum.photos/id/710/400/300' },
    { id: 'faridpur-to-dhaka', from: 'Faridpur', to: 'Dhaka', distance: '119KM', price: '400', image: 'https://picsum.photos/id/720/400/300' },
    { id: 'kushtia-to-dhaka', from: 'Kushtia', to: 'Dhaka', distance: '212KM', price: '400', image: 'https://picsum.photos/id/730/400/300' },
    { id: 'natore-to-dhaka', from: 'Natore', to: 'Dhaka', distance: '210KM', price: '600', image: 'https://picsum.photos/id/740/400/300' },
    { id: 'natore-to-chittagong', from: 'Natore', to: 'Chittagong', distance: '485KM', price: '750', image: 'https://picsum.photos/id/750/400/300' },
    { id: 'sylhet-to-dhaka', from: 'Sylhet', to: 'Dhaka', distance: '245KM', price: '670', image: 'https://picsum.photos/id/760/400/300' },
    { id: 'rangamati-to-dhaka', from: 'Rangamati', to: 'Dhaka', distance: '312KM', price: '840', image: 'https://picsum.photos/id/770/400/300' },
    { id: 'tangail-to-dhaka', from: 'Tangail', to: 'Dhaka', distance: '96 KM', price: '400', image: 'https://picsum.photos/id/780/400/300' },
    { id: 'pabna-to-dhaka', from: 'Pabna', to: 'Dhaka', distance: '146KM', price: '500', image: 'https://picsum.photos/id/790/400/300' },
    { id: 'meherpur-to-dhaka', from: 'Meherpur', to: 'Dhaka', distance: '270KM', price: '600', image: 'https://picsum.photos/id/800/400/300' },
    { id: 'moulvibazar-to-dhaka', from: 'Moulvibazar', to: 'Dhaka', distance: '205K', price: '550', image: 'https://picsum.photos/id/810/400/300' },
    { id: 'sunamganj-to-dhaka', from: 'Sunamganj', to: 'Dhaka', distance: '265KM', price: '800', image: 'https://picsum.photos/id/820/400/300' },
    { id: 'dhaka-to-chuadanga', from: 'Dhaka', to: 'Chuadanga', distance: '231KM', price: '650', image: 'https://picsum.photos/id/830/400/300' },
    { id: 'chittagong-to-khulna', from: 'Chittagong', to: 'Khulna', distance: '445KM', price: '900', image: 'https://picsum.photos/id/840/400/300' },
    { id: 'sylhet-to-coxs-bazar', from: 'Sylhet', to: "Cox's Bazar", distance: '508 KM', price: '2500', image: 'https://picsum.photos/id/850/400/300' },
    { id: 'dhaka-to-bagha', from: 'Dhaka', to: 'Bagha', distance: '217KM', price: '600', image: 'https://picsum.photos/id/860/400/300' },
    { id: 'comilla-to-coxs-bazar', from: 'Comilla', to: "Cox's Bazar", distance: '295KM', price: '1400', image: 'https://picsum.photos/id/870/400/300' },
    { id: 'khulna-to-sylhet', from: 'Khulna', to: 'Sylhet', distance: '439 KM', price: '1200', image: 'https://picsum.photos/id/880/400/300' },
    { id: 'chuadanga-to-dhaka', from: 'Chuadanga', to: 'Dhaka', distance: '233KM', price: '650', image: 'https://picsum.photos/id/890/400/300' },
    { id: 'gabtoli-to-satkhira', from: 'Gabtoli', to: 'Satkhira', distance: '242 KM', price: '650', image: 'https://picsum.photos/id/900/400/300' },
    { id: 'dhaka-to-gazipur', from: 'Dhaka', to: 'Gazipur', distance: '26KM', price: '250', image: 'https://picsum.photos/id/910/400/300' },
    { id: 'dhaka-to-mymensingh', from: 'Dhaka', to: 'Mymensingh', distance: '113 KM', price: '250', image: 'https://picsum.photos/id/920/400/300' },
    { id: 'rangpur-to-rajshahi', from: 'Rangpur', to: 'Rajshahi', distance: '227 KM', price: '600', image: 'https://picsum.photos/id/930/400/300' },
    { id: 'rajshahi-to-mymensingh', from: 'Rajshahi', to: 'Mymensingh', distance: '271 KM', price: '700', image: 'https://picsum.photos/id/940/400/300' },
    { id: 'barisal-to-gulistan', from: 'Barisal', to: 'Gulistan', distance: '169KM', price: '500', image: 'https://picsum.photos/id/950/400/300' },
    { id: 'faridpur-to-gulistan', from: 'Faridpur', to: 'Gulistan', distance: '102KM', price: '400', image: 'https://picsum.photos/id/960/400/300' },
    { id: 'gulistan-to-jhenaidah', from: 'Gulistan', to: 'Jhenaidah', distance: '185KM', price: '650', image: 'https://picsum.photos/id/970/400/300' },
    { id: 'gulistan-to-faridpur', from: 'Gulistan', to: 'Faridpur', distance: '110KM', price: '400', image: 'https://picsum.photos/id/980/400/300' },
    { id: 'lohagara-to-coxs-bazar', from: 'Lohagara', to: "Cox's Bazar", distance: '200KM', price: '850', image: 'https://picsum.photos/id/990/400/300' },
  ];

  const [visibleRoutes, setVisibleRoutes] = useState(8);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({ from: 'Dhaka', to: 'Chattogram', date: '2024-03-10' });
  };

  return (
    <div className="bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden py-20 lg:py-0">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/id/28/1920/1080?blur=2" 
            className="w-full h-full object-cover" 
            alt="Bus Journey"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-900/40"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 bg-emerald-600/20 backdrop-blur-md border border-emerald-400/30 px-4 py-2 rounded-full text-emerald-100 text-sm font-bold mb-6">
              <Star size={16} className="text-yellow-400 fill-yellow-400" />
              {t('hero.title')}
            </div>

            {/* Admin/Counter Panel Buttons */}
            {isLoggedIn && userRole === 'counter' && (
              <div className="flex flex-wrap gap-4 mb-8">
                <button 
                  onClick={() => onNavigate?.('counter')}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-emerald-200"
                >
                  <Ticket size={20} />
                  {t('counter.title')}
                </button>
              </div>
            )}

            <h1 className="text-2xl md:text-7xl font-black text-white leading-tight mb-6">
              {t('hero.title')}
            </h1>
            <p className="text-blue-100 text-xs md:text-lg mb-10 max-w-lg leading-relaxed">
              {t('hero.subtitle')}
            </p>
            
            {/* Integrated Search Form */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white p-3 md:p-6 rounded-3xl shadow-2xl border border-white/20 max-w-[90%] mx-auto lg:max-w-none"
            >
              <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4">
                <div className="relative">
                  <label className="block text-left text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1.5 ml-1">{t('booking.from')}</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 md:px-3 md:py-2.5 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <MapPin className="text-blue-600 mr-2 w-3 h-3 md:w-4 md:h-4" />
                    <input type="text" placeholder={t('booking.from')} className="bg-transparent w-full outline-none font-bold text-[10px] md:text-sm" defaultValue={t('city.dhaka')} />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-left text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1.5 ml-1">{t('booking.to')}</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 md:px-3 md:py-2.5 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <MapPin className="text-blue-600 mr-2 w-3 h-3 md:w-4 md:h-4" />
                    <input type="text" placeholder={t('booking.to')} className="bg-transparent w-full outline-none font-bold text-[10px] md:text-sm" defaultValue={t('city.chattogram')} />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-left text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1.5 ml-1">{t('booking.date')}</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 md:px-3 md:py-2.5 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Calendar className="text-blue-600 mr-2 w-3 h-3 md:w-4 md:h-4" />
                    <input type="date" className="bg-transparent w-full outline-none font-bold text-[10px] md:text-sm" defaultValue="2024-03-10" />
                  </div>
                </div>
                <div className="flex items-end">
                  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-2 md:py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 text-[10px] md:text-sm">
                    <Search className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]" />
                    {t('booking.btn.search')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-[40px] shadow-2xl">
              <div className="grid grid-cols-2 gap-6">
                <StatCard icon={<Users className="text-blue-400" />} label={t('stats.passengers')} value={t('home.stats.passengers_val')} />
                <StatCard icon={<Bus className="text-blue-400" />} label={t('stats.buses')} value={t('home.stats.buses_val')} />
                <StatCard icon={<Globe className="text-blue-400" />} label={t('home.stats.routes')} value={t('home.stats.routes_val')} />
                <StatCard icon={<Shield className="text-blue-400" />} label={t('home.stats.safety')} value={t('home.stats.safety_val')} />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full text-emerald-600 text-xs font-bold uppercase tracking-widest mb-6">
                <Info size={14} />
                {t('nav.about')}
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-tight">
                {t('home.about.title')}
              </h2>
              <div className="space-y-6 text-slate-600 text-lg leading-relaxed">
                <p>
                  {t('home.about.desc1')}
                </p>
                <p>
                  {t('home.about.desc2')}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-12">
                <div>
                  <p className="text-3xl font-black text-blue-600">{t('home.stats.experience_val')}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t('stats.experience')}</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-blue-600">{t('home.stats.staff_val')}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t('home.about.staff')}</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-blue-600">{t('home.stats.trips_val')}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t('home.about.trips')}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative z-10 rounded-[40px] overflow-hidden shadow-2xl">
                <img 
                  src="https://picsum.photos/id/12/800/1000" 
                  alt="About Ticket Lagbe" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-600 rounded-3xl -z-0 rotate-12"></div>
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-100 rounded-full -z-0 blur-3xl opacity-50"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-slate-900 mb-4">{t('features.title')}</h2>
            <p className="text-slate-500 font-medium max-w-2xl mx-auto">{t('features.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Shield size={32} />} 
              title={t('feature.safety.title')} 
              desc={t('feature.safety.desc')} 
            />
            <FeatureCard 
              icon={<Clock size={32} />} 
              title={t('home.feature.punctual.title')} 
              desc={t('home.feature.punctual.desc')} 
            />
            <FeatureCard 
              icon={<Star size={32} />} 
              title={t('feature.comfort.title')} 
              desc={t('feature.comfort.desc')} 
            />
          </div>
        </div>
      </section>

      {/* Popular Routes */}
      <section id="offers" className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-4xl font-black text-slate-900 mb-4">{t('routes.title')}</h2>
              <p className="text-slate-500 font-medium">{t('routes.subtitle')}</p>
            </div>
            <button onClick={() => onSearch({})} className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all">
              {t('home.routes.view_all')} <ArrowRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {POPULAR_ROUTES.slice(0, visibleRoutes).map((route) => (
              <RouteCard 
                key={route.id}
                image={route.image} 
                from={route.from} 
                to={route.to} 
                distance={route.distance}
                price={t('language') === 'bn' ? formatNumber(route.price) : route.price} 
                t={t} 
                onBook={() => onSearch({ from: route.from, to: route.to })}
              />
            ))}
          </div>

          {visibleRoutes < POPULAR_ROUTES.length && (
            <div className="mt-12 text-center">
              <button 
                onClick={() => setVisibleRoutes(prev => prev + 8)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-8 py-3 rounded-2xl transition-all"
              >
                {t('language') === 'bn' ? 'আরও রুট দেখুন' : 'Load More Routes'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Fare Information Section */}
      <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-500 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500 rounded-full blur-[150px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-600/20 border border-emerald-500/30 px-4 py-2 rounded-full text-emerald-600 text-xs font-bold uppercase tracking-widest mb-6">
                <Info size={14} />
                {t('home.fare.info_title')}
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6 leading-tight">{t('home.fare.title')}</h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                {t('home.fare.desc')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t('home.fare.departure')}</label>
                  <select 
                    value={fareFrom}
                    onChange={(e) => setFareFrom(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                  >
                    {stations.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{t('home.fare.arrival')}</label>
                  <select 
                    value={fareTo}
                    onChange={(e) => setFareTo(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer"
                  >
                    {stations.map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="relative">
              <AnimatePresence mode="wait">
                {currentFare ? (
                  <motion.div 
                    key={`${fareFrom}-${fareTo}`}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-8 md:p-10 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-600/20">
                          <MapPin size={24} />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('home.fare.route')}</p>
                          <p className="text-xl font-black">{fareFrom} {t('home.fare.to')} {fareTo}</p>
                        </div>
                      </div>
                      <Ticket className="text-blue-500 opacity-20" size={48} />
                    </div>

                    <div className="space-y-4">
                      <FareItem label={t('home.fare.non_ac')} price={currentFare.nonAc} icon={<Bus size={18} />} t={t} />
                      <FareItem label={t('home.fare.ac_standard')} price={currentFare.ac} icon={<Bus size={18} />} t={t} />
                      <FareItem label={t('home.fare.ac_premium')} price={currentFare.premium} icon={<Bus size={18} />} highlight t={t} />
                    </div>

                    <button 
                      onClick={() => onSearch({ from: fareFrom, to: fareTo })}
                      className="w-full mt-10 bg-emerald-600 text-white font-black py-5 rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 group"
                    >
                      {t('hero.btn.book')}
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-12 text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Search size={32} className="text-slate-500" />
                    </div>
                    <p className="text-slate-400 font-bold">{t('home.fare.not_found')}</p>
                    <p className="text-slate-600 text-sm mt-2">{t('home.fare.try_other')}</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* Gemini Spark AI Travel Planner */}
      <section className="mt-20 max-w-7xl mx-auto px-4 md:px-6 relative z-10 animate-fade-in">
        <div className="bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-[2.5rem] p-8 md:p-14 border border-emerald-500/10 shadow-2xl overflow-hidden relative">
          
          {/* Ambient background glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            {/* Left Info Column */}
            <div className="lg:col-span-5 text-left space-y-6">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full text-emerald-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles size={14} className="animate-pulse text-emerald-300" />
                Gemini Spark AI Tour Assistant
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white leading-tight">
                স্মার্ট ভ্রমণ পরিকল্পনা <span className="text-emerald-400">এআই</span> দিয়ে
              </h2>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                টিকিট লাগবে'র স্পেশাল "Gemini Spark" ফিচার আপনার গন্তব্য অনুযায়ী সেরা দর্শনীয় স্থান, স্থানীয় খাবার, এবং দিনভিত্তিক কাস্টম ট্যুর ম্যানুয়াল তৈরি করে দেবে সেকেন্ডেই!
              </p>
              
              {/* Popular quick-select suggestion chips */}
              <div className="space-y-3 pt-2">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">জনপ্রিয় গন্তব্যসমূহ ঝটপট সিলেক্ট করুন:</p>
                <div className="flex flex-wrap gap-2">
                  {['কক্সবাজার', 'সিলেট', 'সুন্দরবন', 'বান্দরবান'].map((dest, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSparkDest(dest)}
                      className="px-3.5 py-2 bg-white/5 hover:bg-emerald-500/20 text-white rounded-xl text-xs font-bold border border-white/5 transition-all text-left pointer-events-auto cursor-pointer"
                    >
                      📍 {dest}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Interactive Box Column */}
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-md w-full">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Destination Input */}
                  <div className="sm:col-span-2 space-y-2 text-left">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest ml-1 animate-pulse">গন্তব্যস্থল (Destination)</label>
                    <input
                      type="text"
                      value={sparkDest}
                      onChange={(e) => setSparkDest(e.target.value)}
                      placeholder="যেমন: কক্সবাজার, রাঙ্গামাটি, সাজেক..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-sm"
                    />
                  </div>
                  
                  {/* Days picker */}
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-widest ml-1">ভ্রমণ দিন (Days)</label>
                    <select
                      value={sparkDays}
                      onChange={(e) => setSparkDays(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-white/10 rounded-2xl px-4 py-4 text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium text-sm"
                    >
                      <option value="2">২ দিন (2 Days)</option>
                      <option value="3">৩ দিন (3 Days)</option>
                      <option value="4">৪ দিন (4 Days)</option>
                      <option value="5">৫ দিন (5 Days)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={generateSparkPlan}
                  disabled={sparkLoading || !sparkDest.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  {sparkLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      জেমিনি প্ল্যানিং করছে...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} className="text-teal-200 group-hover:scale-125 transition-transform" />
                      আজই তৈরি করুন এআই ট্যুর গাইড
                    </>
                  )}
                </button>

                {/* Response Visualizer Container */}
                <AnimatePresence mode="wait">
                  {(sparkResult || sparkLoading) && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="text-left bg-[#0A0A0B]/80 border border-emerald-500/20 rounded-2xl p-6 overflow-hidden max-h-96 overflow-y-auto relative"
                    >
                      {sparkLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-4">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin"></div>
                            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-400 animate-bounce" size={20} />
                          </div>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest animate-pulse">জেমিনি এআই লাইভ গাইড প্রস্তুত করছে...</p>
                        </div>
                      ) : (
                        <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-line max-w-none">
                          {sparkResult}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App Download / CTA */}
      <section className="mt-20 py-16 md:py-24 bg-emerald-600 rounded-[2rem] md:rounded-[60px] mx-4 md:mx-6 mb-24 overflow-hidden relative z-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none z-0">
          <Bus size={400} className="rotate-12 translate-x-1/4 translate-y-1/4" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-6 md:mb-8">{t('home.cta.title')}</h2>
          <p className="text-blue-100 text-base md:text-lg mb-8 md:mb-12">{t('home.cta.desc')}</p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <button 
              onClick={() => onSearch({})}
              className="w-full sm:w-auto bg-white text-blue-600 px-8 md:px-10 py-4 md:py-5 rounded-2xl font-black text-lg md:text-xl hover:bg-blue-50 transition-all shadow-2xl active:scale-95"
            >
              {t('home.cta.btn')}
            </button>
            <div className="flex items-center gap-4 text-white">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{t('home.helpline')}</p>
                <p className="text-lg md:text-xl font-black">০১৯০০-০০০০০০</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center">
      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <p className="text-white text-2xl font-black mb-1">{value}</p>
      <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-2xl font-black text-slate-900 mb-4">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function RouteCard({ image, from, to, distance, price, t, onBook }: { image: string; from: string; to: string; distance?: string; price: string; t: any; onBook: () => void }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col h-full">
      <div className="h-48 overflow-hidden relative shrink-0">
        <img src={image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={to} referrerPolicy="no-referrer" />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-emerald-600 text-xs font-black">
          ৳{price} {t('home.route.from_price')}
        </div>
        {distance && (
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-bold">
            {distance}
          </div>
        )}
      </div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">
          <span>{from}</span>
          <ArrowRight size={12} />
          <span>{to}</span>
        </div>
        <h4 className="text-lg font-black text-slate-900 mb-6">{from} - {to}</h4>
        
        <div className="mt-auto">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onBook();
            }}
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2 text-sm"
          >
            <Ticket size={16} />
            {t('hero.btn.book')}
          </button>
        </div>
      </div>
    </div>
  );
}

function FareItem({ label, price, icon, t, highlight = false }: { label: string; price: number; icon: React.ReactNode; t: any; highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${highlight ? 'bg-emerald-600/10 border-emerald-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${highlight ? 'bg-emerald-600 text-white' : 'bg-white/10 text-slate-400'}`}>
          {icon}
        </div>
        <span className={`font-bold ${highlight ? 'text-white' : 'text-slate-300'}`}>{label}</span>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('home.fare.label')}</p>
        <p className={`text-xl font-black ${highlight ? 'text-emerald-400' : 'text-white'}`}>৳{price}</p>
      </div>
    </div>
  );
}
