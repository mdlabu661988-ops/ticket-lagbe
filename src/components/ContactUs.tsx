import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Phone, Mail, MapPin, Send, MessageSquare, Clock, Globe, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../context/LanguageContext';

interface ContactUsProps {
  onBack: () => void;
}

export default function ContactUs({ onBack }: ContactUsProps) {
  const { t, language } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success(
        language === 'bn' 
          ? 'বার্তাটি সফলভাবে পাঠানো হয়েছে! আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।' 
          : 'Message sent successfully! We will get back to you soon.'
      );
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Hero Section */}
      <section className="bg-[#1A1A1A] py-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={onBack}
            className="text-white/60 hover:text-white mb-8 flex items-center gap-2 transition-colors font-bold group"
          >
            <ArrowRight size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
            {t('nav.home')}
          </motion.button>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6">
              {language === 'bn' ? 'যোগাযোগ করুন' : 'Contact Us'}
            </h1>
            <p className="text-white/60 text-lg max-w-2xl leading-relaxed">
              {language === 'bn' 
                ? 'আপনার যেকোনো প্রশ্ন বা মতামতের জন্য আমাদের সাথে যোগাযোগ করুন। আমাদের টিম ২৪/৭ আপনার সেবায় নিয়োজিত।' 
                : 'Get in touch with us for any queries or feedback. Our team is available 24/7 to assist you.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              <ContactInfoCard 
                icon={<Phone className="text-emerald-600" />}
                title={language === 'bn' ? 'ফোন করুন' : 'Call Us'}
                value="০১৯০০-০০০০০০"
                subtitle={language === 'bn' ? '২৪/৭ কাস্টমার সাপোর্ট' : '24/7 Customer Support'}
              />
              <ContactInfoCard 
                icon={<Mail className="text-blue-600" />}
                title={language === 'bn' ? 'ইমেইল করুন' : 'Email Us'}
                value="support@ticketlagbe.com"
                subtitle={language === 'bn' ? 'আমরা ২৪ ঘণ্টার মধ্যে উত্তর দিই' : 'We reply within 24 hours'}
              />
              <ContactInfoCard 
                icon={<MapPin className="text-rose-600" />}
                title={language === 'bn' ? 'অফিস ঠিকানা' : 'Office Address'}
                value={language === 'bn' ? 'মহাখালী, ঢাকা, বাংলাদেশ' : 'Mohakhali, Dhaka, Bangladesh'}
                subtitle={language === 'bn' ? 'হেড অফিস' : 'Head Office'}
              />
              <ContactInfoCard 
                icon={<Clock className="text-amber-600" />}
                title={language === 'bn' ? 'কাজের সময়' : 'Working Hours'}
                value={language === 'bn' ? 'শনিবার - বৃহস্পতিবার' : 'Saturday - Thursday'}
                subtitle={language === 'bn' ? 'সকাল ৯:০০ - সন্ধ্যা ৬:০০' : '9:00 AM - 6:00 PM'}
              />
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 p-8 md:p-12"
              >
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <MessageSquare size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900">
                      {language === 'bn' ? 'আমাদের মেসেজ পাঠান' : 'Send us a Message'}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">
                      {language === 'bn' ? 'আমরা আপনার কথা শুনতে আগ্রহী' : 'We would love to hear from you'}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                        {language === 'bn' ? 'আপনার নাম' : 'Your Name'}
                      </label>
                      <input 
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder={language === 'bn' ? 'পুরো নাম লিখুন' : 'Enter full name'}
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                        {language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'}
                      </label>
                      <input 
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="example@mail.com"
                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                      {language === 'bn' ? 'বিষয়' : 'Subject'}
                    </label>
                    <input 
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder={language === 'bn' ? 'মেসেজের বিষয়' : 'Message subject'}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                      {language === 'bn' ? 'আপনার মেসেজ' : 'Your Message'}
                    </label>
                    <textarea 
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder={language === 'bn' ? 'এখানে আপনার মেসেজ লিখুন...' : 'Write your message here...'}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 text-white rounded-2xl py-5 font-black text-lg shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        />
                        {language === 'bn' ? 'পাঠানো হচ্ছে...' : 'Sending...'}
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        {language === 'bn' ? 'মেসেজ পাঠান' : 'Send Message'}
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder Section */}
      <section className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-[3rem] p-4 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden h-[400px] relative group">
            <div className="absolute inset-0 bg-slate-100 flex flex-col items-center justify-center">
              <Globe size={48} className="text-slate-300 mb-4 animate-pulse group-hover:text-emerald-500 transition-colors" />
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Interactive Map Coming Soon</p>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-full cursor-pointer hover:bg-emerald-100 transition-all">
                <MapPin size={16} />
                {language === 'bn' ? 'গুগল ম্যাপে দেখুন' : 'View on Google Maps'}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactInfoCard({ icon, title, value, subtitle }: { icon: React.ReactNode; title: string, value: string, subtitle: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-400 tracking-widest uppercase mb-1">{title}</h4>
          <p className="text-lg font-black text-slate-900">{value}</p>
          <p className="text-xs font-bold text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}
