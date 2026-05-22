/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bus, User, Bot, MapPin, Calendar, Phone, Info, LayoutDashboard, MessageSquare, ShieldCheck, LogIn, X, Headset, Menu, MoreVertical, Clock, Ticket, Languages, Briefcase, CreditCard, CheckCircle, ArrowRight, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { ChatService } from './services/geminiService';
import { generateTicketPDF } from './lib/pdfGenerator';
import BookingPortal from './BookingPortal';
import AdminDashboard from './AdminDashboard';
import CounterDashboard from './CounterDashboard';
import BusOwnerDashboard from './BusOwnerDashboard';
import BusCompanyDashboard from './BusCompanyDashboard';
import PassengerDashboard from './PassengerDashboard';
import LoginPage from './LoginPage';
import HomePage from './components/HomePage';
import UserProfile from './UserProfile';
import AboutUs from './components/AboutUs';
import TermsAndConditions from './components/TermsAndConditions';
import RefundPolicy from './components/RefundPolicy';
import Corporate from './components/Corporate';
import DriverApplication from './components/DriverApplication';
import ContactUs from './components/ContactUs';
import { useLanguage } from './context/LanguageContext';
import { fetchAndApplyTheme } from './lib/theme';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function App() {
  const { language, setLanguage, t } = useLanguage();
  const [view, setView] = useState<'home' | 'chat' | 'portal' | 'admin' | 'login' | 'counter' | 'owner' | 'company' | 'profile' | 'about' | 'terms' | 'refund' | 'passenger' | 'corporate' | 'driver-apply' | 'contact'>('home');
  const [portalStep, setPortalStep] = useState<'search' | 'results' | 'seats' | 'checkout' | 'confirmation' | 'my-bookings'>('search');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'counter' | 'owner' | 'company' | 'user' | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: t('chat.welcome'),
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatServiceRef = useRef<ChatService | null>(null);

  useEffect(() => {
    // Fetch and apply theme options
    fetchAndApplyTheme();
    // Mock auth ready
    setIsAuthReady(true);
  }, []);

  useEffect(() => {
    chatServiceRef.current = new ChatService();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (view === 'chat') scrollToBottom();
  }, [messages, view]);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch('/api/menus');
        const data = await res.json();
        setMenus(data);
      } catch (error) {
        console.error('Error fetching menus:', error);
      }
    };
    fetchMenus();
  }, []);

  const handleMenuClick = (path: string) => {
    setIsMobileMenuOpen(false);
    if (path === '/') {
      setView('home');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (path.startsWith('#')) {
      if (view !== 'home') {
        setView('home');
        setTimeout(() => {
          const el = document.querySelector(path);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        const el = document.querySelector(path);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      const viewName = path.startsWith('/') ? path.slice(1) : path;
      if (viewName) setView(viewName as any);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    if (chatServiceRef.current) {
      const { text, bookingData } = await chatServiceRef.current.sendMessage(input);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: text,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);

      if (bookingData) {
        console.log("Booking Data Received:", bookingData);
        if (bookingData.type === 'payment_request') {
          setPendingPaymentData(bookingData);
          setIsPaymentModalOpen(true);
        } else if (bookingData.type === 'booking_confirmation') {
          console.log("Final Booking Confirmed:", bookingData);
          // Notify Admin and Bus Owner
          toast.success('নতুন বুকিং নোটিফিকেশন এডমিন এবং বাসের মালিকের কাছে পাঠানো হয়েছে।');
          
          // Generate and download PDF
          await generateTicketPDF(bookingData, language, t);
          toast.info('আপনার টিকিটটি পিডিএফ হিসেবে ডাউনলোড হচ্ছে...');

          // Simulate backend notification
          fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'NEW_BOOKING',
              recipient: ['admin', 'owner'],
              data: bookingData
            })
          }).catch(err => console.error('Notification error:', err));
        }
      }
    } else {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: t('chat.error'),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }
    setIsLoading(false);
  };
  
  const handlePaymentSuccess = async () => {
    setIsPaymentModalOpen(false);
    if (!pendingPaymentData || !chatServiceRef.current) return;

    const paymentSuccessMsg = `পেমেন্ট সফল হয়েছে। ট্রানজ্যাকশন আইডি: TXN${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    // Add a system message or user message to trigger final confirmation
    // We'll simulate a user message saying "Payment done"
    const userMsg: Message = {
      id: Date.now().toString(),
      text: "পেমেন্ট সম্পন্ন করেছি।",
      sender: 'user',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    
    const { text, bookingData } = await chatServiceRef.current.sendMessage("Payment confirmed for " + pendingPaymentData.name);
    
    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      text: text,
      sender: 'bot',
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, botMsg]);

    if (bookingData && bookingData.type === 'booking_confirmation') {
      toast.success('নতুন বুকিং নোটিফিকেশন এডমিন এবং বাসের মালিকের কাছে পাঠানো হয়েছে।');
      
      // Generate and download PDF
      await generateTicketPDF(bookingData, language, t);
      toast.info('আপনার টিকিটটি পিডিএফ হিসেবে ডাউনলোড হচ্ছে...');

      fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NEW_BOOKING',
          recipient: ['admin', 'owner'],
          data: bookingData
        })
      }).catch(err => console.error('Notification error:', err));
    }

    setIsLoading(false);
    setPendingPaymentData(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderContent = () => {
    console.log('Rendering view:', view);
    switch (view) {
      case 'admin':
        console.log('Rendering AdminDashboard with profile:', userProfile);
        return (
          <AdminDashboard 
            userProfile={userProfile}
            onProfileUpdate={(newProfile) => setUserProfile(newProfile)}
            onLogout={() => { setIsLoggedIn(false); setUserRole(null); setUserProfile(null); setView('home'); }} 
            onBack={() => setView('home')}
          />
        );
      case 'counter':
        return (
          <CounterDashboard 
            userProfile={userProfile}
            onLogout={() => { setIsLoggedIn(false); setUserRole(null); setUserProfile(null); setView('home'); }} 
            onBack={() => setView('home')}
          />
        );
      case 'owner':
        return (
          <BusOwnerDashboard 
            userProfile={userProfile}
            onLogout={() => { setIsLoggedIn(false); setUserRole(null); setUserProfile(null); setView('home'); }} 
            onBack={() => setView('home')}
          />
        );
      case 'company':
        return (
          <BusCompanyDashboard 
            userProfile={userProfile}
            onLogout={() => { setIsLoggedIn(false); setUserRole(null); setUserProfile(null); setView('home'); }} 
            onBack={() => setView('home')}
          />
        );
      case 'passenger':
        return (
          <PassengerDashboard 
            userProfile={userProfile}
            onLogout={() => { setIsLoggedIn(false); setUserRole(null); setUserProfile(null); setView('home'); }} 
            onBack={() => setView('home')}
          />
        );
      case 'login':
        return (
          <LoginPage 
            onLogin={(role, profile) => { 
              console.log('Login successful. Role:', role, 'Profile:', profile);
              setIsLoggedIn(true); 
              setUserRole(role);
              setUserProfile(profile);
              if (role === 'admin') setView('admin');
              else if (role === 'counter') setView('counter');
              else if (role === 'owner') setView('owner');
              else if (role === 'company') setView('company');
              else if (role === 'user') setView('passenger');
              else setView('home');
            }} 
            onBack={() => setView('home')} 
          />
        );
      case 'profile':
        return (
          <UserProfile 
            userRole={userRole as 'admin' | 'counter' | 'user' | 'owner' | 'company'}
            userProfile={userProfile}
            onLogout={() => { setIsLoggedIn(false); setUserRole(null); setUserProfile(null); setView('home'); }}
            onBack={() => setView('home')}
          />
        );
      case 'portal':
        return (
          <BookingPortal 
            onLogin={() => setView('login')} 
            isLoggedIn={isLoggedIn} 
            initialStep={portalStep}
          />
        );
      case 'about':
        return <AboutUs onBack={() => setView('home')} />;
      case 'terms':
        return <TermsAndConditions onBack={() => setView('home')} />;
      case 'refund':
        return <RefundPolicy onBack={() => setView('home')} />;
      case 'corporate':
        return <Corporate onBack={() => setView('home')} />;
      case 'driver-apply':
        return <DriverApplication language={language} onBack={() => setView('home')} onSuccess={() => setView('home')} />;
      case 'contact':
        return <ContactUs onBack={() => setView('home')} />;
      case 'home':
      default:
        return (
          <HomePage 
            userRole={userRole}
            onNavigate={(v) => setView(v as any)}
            onSearch={(data) => {
              setPortalStep('results');
              setView('portal');
            }} 
            onOpenSupport={() => setIsChatOpen(true)} 
            onLogin={() => setView('login')}
            onProfile={() => setView(userRole === 'user' ? 'passenger' : 'profile')}
            isLoggedIn={isLoggedIn}
          />
        );
    }
  };

  const isFullPage = ['admin', 'counter', 'owner', 'company', 'login', 'profile', 'passenger'].includes(view);

  if (isFullPage) {
    return (
      <>
        {renderContent()}
        <button 
          onClick={() => setIsChatOpen(true)}
          className={`fixed bottom-6 right-6 p-4 rounded-full shadow-2xl hover:scale-110 transition-all z-[100] ${
            view === 'admin' ? 'bg-slate-900 text-white' : 
            view === 'counter' ? 'bg-emerald-600 text-white' : 
            view === 'owner' ? 'bg-blue-600 text-white' :
            'bg-blue-600 text-white'
          }`}
        >
          <MessageSquare size={24} />
        </button>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-[#1A1A1A] flex flex-col relative overflow-x-hidden">
      <Toaster position="top-right" richColors />
      {/* Header */}
      <header className="bg-emerald-600 border-b border-emerald-700/20 py-5 px-6 sticky top-0 z-[60] shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setView('home')}
          >
            <div className="bg-white p-2 rounded-xl text-emerald-600 shadow-sm">
              <Bus size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">{t('brand.name')}</h1>
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-widest">{t('brand.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              {/* Dynamic Menus */}
              <nav className="flex items-center gap-6 mr-4 border-r border-white/20 pr-8">
                {menus.filter(m => m.is_active !== 0).map(menu => (
                  <button
                    key={menu.id}
                    onClick={() => handleMenuClick(menu.path)}
                    className="text-sm font-bold text-white/90 hover:text-white transition-all"
                  >
                    {language === 'bn' ? menu.label_bn : menu.label_en}
                  </button>
                ))}
                <button
                  onClick={() => handleMenuClick('corporate')}
                  className="text-sm font-bold text-white/90 hover:text-white transition-all"
                >
                  {language === 'bn' ? 'কর্পোরেট' : 'Corporate'}
                </button>
              </nav>

              {/* Language Switcher (Desktop) */}
              <button 
                onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                className="w-10 h-10 flex flex-col items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/20 group relative"
                title={language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
              >
                <Languages size={14} className="mb-0.5 group-hover:scale-110 transition-transform" />
                <span className="text-[8px] font-black uppercase tracking-tighter">
                  {language === 'bn' ? 'EN' : 'BN'}
                </span>
              </button>

              {!isLoggedIn ? (
                <button 
                  onClick={() => setView('login')}
                  className="flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all shadow-sm"
                >
                  <LogIn size={16} />
                  {t('nav.login')}
                </button>
              ) : (
                <>
                  {userRole !== 'admin' && (
                    <button 
                      onClick={() => setView(userRole === 'user' ? 'passenger' : 'profile')}
                      className="flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-white/20 transition-all border border-white/20"
                    >
                      <User size={16} />
                      <span className="capitalize">{userRole === 'counter' ? t('nav.counter') : userRole === 'owner' ? t('admin.manage.owner') : userRole === 'user' ? t('nav.passenger_dashboard') : t('nav.profile')}</span>
                    </button>
                  )}
                  
                  {userRole === 'admin' && (
                    <button 
                      onClick={() => setView('admin')}
                      className="flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all shadow-sm animate-pulse-subtle"
                    >
                      <ShieldCheck size={16} />
                      {t('admin.title')}
                    </button>
                  )}

                  {userRole === 'owner' && (
                    <button 
                      onClick={() => setView('owner')}
                      className="flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all shadow-sm"
                    >
                      <ShieldCheck size={16} />
                      {t('admin.manage.owner')}
                    </button>
                  )}

                  {userRole === 'company' && (
                    <button 
                      onClick={() => setView('company')}
                      className="flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all shadow-sm"
                    >
                      <ShieldCheck size={16} />
                      {language === 'bn' ? 'বাস কোম্পানি' : 'Bus Company'}
                    </button>
                  )}
                  
                  {userRole === 'counter' && (
                    <button 
                      onClick={() => setView('counter')}
                      className="flex items-center gap-2 bg-white text-emerald-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-all shadow-sm"
                    >
                      <LayoutDashboard size={16} />
                      {t('counter.title')}
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Language Switcher (Mobile) */}
            <button 
              onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
              className="lg:hidden w-10 h-10 flex flex-col items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all border border-white/20 group relative"
            >
              <Languages size={14} className="mb-0.5" />
              <span className="text-[8px] font-black uppercase tracking-tighter">
                {language === 'bn' ? 'EN' : 'BN'}
              </span>
            </button>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 hover:bg-white/10 rounded-xl text-white transition-all"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden bg-white border-t border-slate-100 mt-4 -mx-6 px-6 pb-6"
            >
              <div className="flex flex-col gap-3 pt-4">
                {!isLoggedIn ? (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => { setView('login'); setIsMobileMenuOpen(false); }}
                      className="flex-1 flex items-center gap-3 bg-slate-50 text-slate-700 p-4 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all"
                    >
                      <LogIn size={18} />
                      {t('nav.login')}
                    </button>
                    <button 
                      onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                      className="w-14 h-14 flex flex-col items-center justify-center bg-slate-50 text-[#FF6321] rounded-2xl border border-slate-100 transition-all"
                    >
                      <Languages size={18} className="mb-0.5" />
                      <span className="text-[10px] font-black uppercase">
                        {language === 'bn' ? 'EN' : 'BN'}
                      </span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      {userRole !== 'admin' ? (
                        <button 
                          onClick={() => { setView(userRole === 'user' ? 'passenger' : 'profile'); setIsMobileMenuOpen(false); }}
                          className="flex-1 flex items-center gap-3 bg-slate-50 text-slate-600 p-4 rounded-2xl text-sm font-bold border border-slate-100 hover:bg-slate-100 transition-all"
                        >
                          <User size={18} />
                          <span className="capitalize">{userRole === 'counter' ? t('nav.counter') : userRole === 'owner' ? t('admin.manage.owner') : userRole === 'user' ? t('nav.passenger_dashboard') : t('nav.profile')}</span>
                        </button>
                      ) : (
                        <button 
                          onClick={() => { setView('admin'); setIsMobileMenuOpen(false); }}
                          className="flex-1 flex items-center gap-3 bg-indigo-50 text-indigo-600 p-4 rounded-2xl text-sm font-bold border border-indigo-100 hover:bg-indigo-100 transition-all"
                        >
                          <ShieldCheck size={18} />
                          <span>{t('admin.title')}</span>
                        </button>
                      )}
                      <button 
                        onClick={() => setLanguage(language === 'bn' ? 'en' : 'bn')}
                        className="w-14 h-14 flex flex-col items-center justify-center bg-slate-50 text-[#FF6321] rounded-2xl border border-slate-100 transition-all"
                      >
                        <Languages size={18} className="mb-0.5" />
                        <span className="text-[10px] font-black uppercase">
                          {language === 'bn' ? 'EN' : 'BN'}
                        </span>
                      </button>
                    </div>

                    {userRole === 'owner' && (
                      <button 
                        onClick={() => { setView('owner'); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-3 bg-blue-50 text-blue-600 p-4 rounded-2xl text-sm font-bold hover:bg-blue-100 transition-all border border-blue-100"
                      >
                        <ShieldCheck size={18} />
                        {t('admin.manage.owner')}
                      </button>
                    )}

                    {userRole === 'company' && (
                      <button 
                        onClick={() => { setView('company'); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-3 bg-blue-50 text-blue-600 p-4 rounded-2xl text-sm font-bold hover:bg-blue-100 transition-all border border-blue-100"
                      >
                        <ShieldCheck size={18} />
                        {language === 'bn' ? 'বাস কোম্পানি' : 'Bus Company'}
                      </button>
                    )}

                    {userRole === 'counter' && (
                      <button 
                        onClick={() => { setView('counter'); setIsMobileMenuOpen(false); }}
                        className="flex items-center gap-3 bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-sm font-bold hover:bg-emerald-100 transition-all border border-emerald-100"
                      >
                        <LayoutDashboard size={18} />
                        {t('counter.title')}
                      </button>
                    )}
                  </>
                )}

                <div className="h-px bg-slate-100 my-2" />
                
                {menus.filter(m => m.is_active !== 0).map(menu => (
                  <button
                    key={menu.id}
                    onClick={() => handleMenuClick(menu.path)}
                    className="flex items-center gap-3 text-slate-600 p-4 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all"
                  >
                    <ArrowRight size={18} />
                    {language === 'bn' ? menu.label_bn : menu.label_en}
                  </button>
                ))}
                
                <button 
                  onClick={() => handleMenuClick('corporate')}
                  className="flex items-center gap-3 text-slate-600 p-4 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  <Briefcase size={18} />
                  {language === 'bn' ? 'কর্পোরেট' : 'Corporate'}
                </button>
                
                <div className="h-px bg-slate-100 my-2" />
                <button 
                  onClick={() => handleMenuClick('terms')}
                  className="flex items-center gap-3 text-slate-600 p-4 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  <ShieldCheck size={18} />
                  {t('nav.terms')}
                </button>
                <button 
                  onClick={() => handleMenuClick('refund')}
                  className="flex items-center gap-3 text-slate-600 p-4 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all"
                >
                  <Clock size={18} />
                  {t('nav.refund')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        {renderContent()}
      </div>

      {/* Floating Support Button */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="w-[90vw] sm:w-[25rem] h-[80vh] sm:h-[37.5rem] bg-white rounded-[2rem] shadow-2xl border border-black/5 flex flex-col overflow-hidden mb-4"
            >
              {/* Chat Header */}
              <div className="bg-[#1A1A1A] p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center">
                    <Bot size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold">{t('chat.header.title')}</h3>
                    <p className="text-[10px] text-white/60 uppercase tracking-widest font-bold">{t('chat.header.subtitle')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F9F9F9]">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${
                      msg.sender === 'user' 
                        ? 'bg-[#1A1A1A] text-white rounded-tr-none' 
                        : 'bg-white text-[#1A1A1A] rounded-tl-none border border-black/5 shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-black/5 shadow-sm flex gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-white border-t border-black/5">
                <div className="flex flex-wrap gap-2 mb-4">
                  <QuickAction 
                    icon={<Clock size={12} />} 
                    text={t('chat.quick.timings')} 
                    onClick={() => setInput(t('chat.quick.timings.query'))} 
                  />
                  <QuickAction 
                    icon={<MapPin size={12} />} 
                    text={t('chat.quick.routes')} 
                    onClick={() => setInput(t('chat.quick.routes.query'))} 
                  />
                  <QuickAction 
                    icon={<Ticket size={12} />} 
                    text={t('chat.quick.fare')} 
                    onClick={() => setInput(t('chat.quick.fare.query'))} 
                  />
                </div>
                <div className="relative flex items-center">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={t('chat.input.placeholder')}
                    className="w-full bg-[#F5F5F5] border-none rounded-2xl py-4 pl-4 pr-14 focus:ring-2 focus:ring-emerald-600 transition-all resize-none max-h-32"
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 p-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/20 hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
            isChatOpen ? 'bg-white text-[#1A1A1A] rotate-90' : 'bg-emerald-600 text-white'
          }`}
        >
          {isChatOpen ? <X size={28} /> : <Headset size={28} />}
        </button>
      </div>

      {/* Footer */}
      <footer id="contact" className="bg-white text-slate-600 py-16 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
          {/* Column 1: About */}
          <div className="space-y-5">
            <div className="flex items-center gap-3 text-slate-900">
              <Bus size={32} className="text-emerald-500" />
              <span className="text-2xl font-bold tracking-tight text-slate-900">{t('brand.name')}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600/80">{t('footer.about_desc')}</p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-5">
            <h4 className="text-slate-900 font-bold text-sm uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-10 after:h-0.5 after:bg-emerald-500 pb-2">
              {t('footer.links')}
            </h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => handleMenuClick('/')} className="hover:text-emerald-600 hover:translate-x-1 transition-all text-left block w-full">{t('footer.home')}</button></li>
              <li><button onClick={() => handleMenuClick('portal')} className="hover:text-emerald-600 hover:translate-x-1 transition-all text-left block w-full">{t('footer.booking')}</button></li>
              <li><button onClick={() => setIsChatOpen(true)} className="hover:text-emerald-600 hover:translate-x-1 transition-all text-left block w-full">{t('footer.support')}</button></li>
              <li><button onClick={() => handleMenuClick('about')} className="hover:text-emerald-600 hover:translate-x-1 transition-all text-left block w-full">{t('nav.about')}</button></li>
              <li><button onClick={() => handleMenuClick('terms')} className="hover:text-emerald-600 hover:translate-x-1 transition-all text-left block w-full">{t('nav.terms')}</button></li>
              <li><button onClick={() => handleMenuClick('refund')} className="hover:text-emerald-600 hover:translate-x-1 transition-all text-left block w-full">{t('nav.refund')}</button></li>
              <li><button onClick={() => handleMenuClick('corporate')} className="hover:text-emerald-600 hover:translate-x-1 transition-all text-left block w-full">{language === 'bn' ? 'কর্পোরেট' : 'Corporate'}</button></li>
              <li><button onClick={() => handleMenuClick('contact')} className="hover:text-emerald-600 hover:translate-x-1 transition-all text-left block w-full">{language === 'bn' ? 'যোগাযোগ' : 'Contact'}</button></li>
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div className="space-y-5">
            <h4 className="text-slate-900 font-bold text-sm uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-10 after:h-0.5 after:bg-emerald-500 pb-2">
              {t('footer.contact')}
            </h4>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-center gap-3"><Phone size={14} className="text-emerald-500 shrink-0" /> ০১৯০০-০০০০০০</li>
              <li className="flex items-center gap-3"><Send size={14} className="text-emerald-500 shrink-0" /> support@ticketlagbe.com</li>
              <li className="flex items-center gap-3"><MapPin size={14} className="text-emerald-500 shrink-0" /> {t('footer.address')}</li>
              <li className="flex items-center gap-3 text-slate-400"><Clock size={14} className="text-emerald-500 shrink-0" /> {language === 'bn' ? '২৪/৭ সাপোর্ট হেল্পলাইন' : '24/7 Support Helpline'}</li>
            </ul>
          </div>

          {/* Column 4: Socials & Payments */}
          <div className="space-y-5">
            <div>
              <h4 className="text-slate-900 font-bold text-sm uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-10 after:h-0.5 after:bg-emerald-500 pb-2 mb-4 block">
                {language === 'bn' ? 'সোশ্যাল মিডিয়া' : 'Follow Us'}
              </h4>
              <div className="flex items-center gap-2.5 pt-2">
                <a href="#" className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#1877F2] hover:text-white text-slate-600 flex items-center justify-center transition-all duration-300 hover:scale-110" title="Facebook">
                  <Facebook size={16} />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#1DA1F2] hover:text-white text-slate-600 flex items-center justify-center transition-all duration-300 hover:scale-110" title="Twitter / X">
                  <Twitter size={16} />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#E4405F] hover:text-white text-slate-600 flex items-center justify-center transition-all duration-300 hover:scale-110" title="Instagram">
                  <Instagram size={16} />
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-slate-100 hover:bg-[#CD201F] hover:text-white text-slate-600 flex items-center justify-center transition-all duration-300 hover:scale-110" title="YouTube">
                  <Youtube size={16} />
                </a>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-slate-900 font-bold text-sm uppercase tracking-wider relative after:content-[''] after:absolute after:bottom-[-8px] after:left-0 after:w-10 after:h-0.5 after:bg-emerald-500 pb-2 mb-4 block">
                {language === 'bn' ? 'পেমেন্ট পদ্ধতি' : 'We Accept'}
              </h4>
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded bg-[#E3106C]/10 border border-[#E3106C]/20 hover:bg-[#E3106C]/20 transition-all hover:scale-105 duration-200">
                  <span className="text-[10px] font-bold text-[#E3106C]">bKash</span>
                </div>
                <div className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded bg-[#F85606]/10 border border-[#F85606]/20 hover:bg-[#F85606]/20 transition-all hover:scale-105 duration-200">
                  <span className="text-[10px] font-bold text-[#F85606]">Nagad</span>
                </div>
                <div className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded bg-[#8C3494]/10 border border-[#8C3494]/20 hover:bg-[#8C3494]/20 transition-all hover:scale-105 duration-200">
                  <span className="text-[10px] font-bold text-[#8C3494]">Rocket</span>
                </div>
                <div className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded bg-[#00579F]/10 border border-[#00579F]/20 hover:bg-[#00579F]/20 transition-all hover:scale-105 duration-200">
                  <span className="text-[10px] font-bold text-[#00579F] font-mono tracking-tight">VISA</span>
                </div>
                <div className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded bg-[#EB001B]/10 border border-[#EB001B]/20 hover:bg-[#EB001B]/20 transition-all hover:scale-105 duration-200">
                  <span className="text-[10px] font-bold text-[#EB001B] font-mono leading-none tracking-tight">MASTER</span>
                </div>
                <div className="flex flex-col items-center justify-center py-1.5 px-0.5 rounded bg-emerald-600/10 border border-emerald-600/20 hover:bg-emerald-600/20 transition-all hover:scale-105 duration-200">
                  <span className="text-[10px] font-bold text-emerald-600 font-mono tracking-tight">CASH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 mt-12 border-t border-slate-100 text-center text-xs text-slate-400">
          <p>{t('footer.copyright')} &copy; {new Date().getFullYear()}. {language === 'bn' ? 'সর্বস্বত্ব সংরক্ষিত।' : 'All rights reserved.'}</p>
        </div>
      </footer>

      {/* Payment Gateway Modal for Chat */}
      <AnimatePresence>
        {isPaymentModalOpen && pendingPaymentData && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="bg-emerald-600 p-8 text-white text-center">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={32} />
                </div>
                <h3 className="text-2xl font-black mb-2">পেমেন্ট গেটওয়ে</h3>
                <p className="text-white/80 text-sm font-medium">টিকিট বুকিং নিশ্চিত করতে পেমেন্ট করুন</p>
              </div>

              <div className="p-8">
                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-500 text-sm">যাত্রীর নাম:</span>
                    <span className="font-bold text-slate-900">{pendingPaymentData.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-500 text-sm">রুট:</span>
                    <span className="font-bold text-slate-900">{pendingPaymentData.route}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <span className="text-slate-900 font-bold">মোট ভাড়া:</span>
                    <span className="text-2xl font-black text-emerald-600">৳{pendingPaymentData.amount}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">পেমেন্ট মেথড সিলেক্ট করুন</p>
                  <button 
                    onClick={handlePaymentSuccess}
                    className="w-full flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#D12053] rounded-xl flex items-center justify-center text-white font-bold text-xs">bKash</div>
                      <span className="font-bold text-slate-700">বিকাশ (bKash)</span>
                    </div>
                    <CheckCircle size={20} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button 
                    onClick={handlePaymentSuccess}
                    className="w-full flex items-center justify-between p-4 bg-white border-2 border-slate-100 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#F7941D] rounded-xl flex items-center justify-center text-white font-bold text-xs">Nagad</div>
                      <span className="font-bold text-slate-700">নগদ (Nagad)</span>
                    </div>
                    <CheckCircle size={20} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                </div>

                <button 
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="w-full mt-8 py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors"
                >
                  বাতিল করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickAction({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/5 rounded-full text-xs font-medium text-black/60 hover:bg-[#F5F5F5] hover:border-black/10 transition-all cursor-pointer"
    >
      {icon}
      {text}
    </button>
  );
}
