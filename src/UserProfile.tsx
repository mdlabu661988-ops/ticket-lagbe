import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield, LogOut, Camera, Edit2, ChevronRight, Ticket, Clock, CreditCard, Bus, Eye, EyeOff, X, Lock, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useLanguage } from './context/LanguageContext';

interface UserProfileProps {
  userRole: 'admin' | 'counter' | 'user' | 'owner' | 'company' | null;
  userProfile?: any;
  onLogout: () => void;
  onBack: () => void;
}

export default function UserProfile({ userRole, userProfile, onLogout, onBack }: UserProfileProps) {
  const { t, language } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false });
  
  const [profile, setProfile] = useState({
    name: userProfile?.name || (userRole === 'admin' ? t('profile.administrator') : userRole === 'counter' ? t('profile.counter_staff') : 'User'),
    email: userProfile?.email || '',
    phone: userProfile?.phone || '',
    address: userProfile?.address || '',
    memberSince: userProfile?.member_since ? new Date(userProfile.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
    profileImage: userProfile?.profile_image || ''
  });

  useEffect(() => {
    if (userProfile?.id) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [userProfile?.id]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profile/${userProfile.id}`);
      const data = await res.json();
      if (data.success) {
        setProfile({
          name: data.profile.name || '',
          email: data.profile.email || '',
          phone: data.profile.phone || '',
          address: data.profile.address || '',
          memberSince: data.profile.member_since ? new Date(data.profile.member_since).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
          profileImage: data.profile.profile_image || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.imageUrl) {
        setProfile(prev => ({ ...prev, profileImage: data.imageUrl }));
        // Also update immediately if possible or wait for save
        toast.success('Image uploaded! Don\'t forget to save changes.');
      }
    } catch (error) {
      toast.error('Failed to upload image');
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/profile/${userProfile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          profile_image: profile.profileImage
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t('profile.save_success') || 'Profile updated successfully');
        setIsEditing(false);
      } else {
        toast.error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    
    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userProfile?.id, 
          currentPassword: passwords.current, 
          newPassword: passwords.new 
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        toast.success('Password changed successfully');
        setShowChangePassword(false);
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const stats = [
    { label: t('profile.total_trips'), value: '12', icon: <Bus size={20} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: t('profile.points'), value: '450', icon: <Ticket size={20} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: t('profile.saved_cards'), value: '2', icon: <CreditCard size={20} />, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  const recentActivities = [
    { id: 1, type: t('profile.activity.booking'), title: 'Dhaka to Chattogram', date: `2 ${t('profile.activity.hours_ago')}`, status: t('profile.activity.confirmed') },
    { id: 2, type: t('profile.activity.payment'), title: 'Ticket #TKT-9821', date: t('profile.activity.yesterday'), status: t('profile.activity.success') },
    { id: 3, type: t('profile.activity.support'), title: 'Route Inquiry', date: `2 ${t('profile.activity.days_ago')}`, status: t('profile.activity.resolved') },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-all"
          >
            <ChevronRight size={20} className="rotate-180" />
            {t('profile.back')}
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-blue-500 font-bold hover:text-blue-600 transition-all"
          >
            <LogOut size={20} />
            {t('profile.logout')}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              
              <div className="relative mt-4">
                <div className="w-24 h-24 rounded-3xl bg-white p-1 mx-auto shadow-lg">
                  <div className="w-full h-full rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 relative group overflow-hidden">
                    {profile.profileImage ? (
                      <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={48} />
                    )}
                    <label className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer">
                      <Camera size={20} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
                <div className="absolute bottom-0 right-1/2 translate-x-12 translate-y-1">
                  <div className="bg-emerald-500 w-4 h-4 rounded-full border-4 border-white"></div>
                </div>
              </div>

              <div className="mt-6">
                {isEditing ? (
                  <input 
                    type="text" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-center font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-100"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                  />
                ) : (
                  <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                )}
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <Shield size={14} className="text-blue-600" />
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
                    {userRole === 'admin' ? t('profile.administrator') : userRole === 'counter' ? t('profile.counter_staff') : userRole === 'company' ? (language === 'bn' ? 'বাস কোম্পানি' : 'Bus Company') : t('profile.premium_member')}
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-4 text-left">
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Mail size={16} />
                  </div>
                  {isEditing ? (
                    <input 
                      type="email" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                    />
                  ) : (
                    <span className="text-sm font-medium truncate">{profile.email}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <Phone size={16} />
                  </div>
                  {isEditing ? (
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    />
                  ) : (
                    <span className="text-sm font-medium">{profile.phone}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-slate-600">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                    <MapPin size={16} />
                  </div>
                  {isEditing ? (
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none"
                      value={profile.address}
                      onChange={(e) => setProfile({...profile, address: e.target.value})}
                    />
                  ) : (
                    <span className="text-sm font-medium">{profile.address}</span>
                  )}
                </div>
              </div>

              <button 
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                className={`w-full mt-8 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                  isEditing ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-100' : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {isEditing ? <CheckCircle size={16} /> : <Edit2 size={16} />}
                {isEditing ? t('profile.save_changes') : t('profile.edit')}
              </button>
            </div>

            {/* Stats Card */}
            <div className="bg-white rounded-[32px] p-6 shadow-xl border border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 ml-2">{t('profile.quick_stats')}</h3>
              <div className="space-y-4">
                {stats.map((stat, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                        {stat.icon}
                      </div>
                      <span className="text-sm font-bold text-slate-600">{stat.label}</span>
                    </div>
                    <span className="text-lg font-black text-slate-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Activity */}
            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-slate-900">{t('profile.recent_activity')}</h3>
                <button className="text-blue-600 font-bold text-sm hover:underline">{t('profile.view_all')}</button>
              </div>
              
              <div className="space-y-6">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between group cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                        {activity.type === t('profile.activity.booking') ? <Bus size={20} /> : activity.type === t('profile.activity.payment') ? <CreditCard size={20} /> : <Clock size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{activity.title}</h4>
                        <p className="text-xs text-slate-500">{activity.date} • {activity.type}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      activity.status === t('profile.activity.confirmed') || activity.status === t('profile.activity.success') || activity.status === t('profile.activity.resolved')
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Account Settings */}
            <div className="bg-white rounded-[32px] p-8 shadow-xl border border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-8">{t('profile.account_settings')}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SettingsOption 
                  title={t('profile.security')} 
                  description={t('profile.security_desc')} 
                  icon={<Shield size={20} />} 
                  onClick={() => setShowChangePassword(true)}
                />
                <SettingsOption 
                  title={t('profile.notifications')} 
                  description={t('profile.notifications_desc')} 
                  icon={<Clock size={20} />} 
                />
                <SettingsOption 
                  title={t('profile.payment_methods')} 
                  description={t('profile.payment_methods_desc')} 
                  icon={<CreditCard size={20} />} 
                />
                <SettingsOption 
                  title={t('profile.privacy')} 
                  description={t('profile.privacy_desc')} 
                  icon={<User size={20} />} 
                />
              </div>
            </div>

            {/* Membership Card */}
            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[100px] -mr-32 -mt-32"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                      <Bus size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <h4 className="font-bold">{t('profile.platinum')}</h4>
                      <p className="text-xs text-white/50">{t('profile.membership_id')} #TL-8821</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{t('profile.expires')}</p>
                    <p className="text-sm font-bold">12/2025</p>
                  </div>
                </div>
                
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">{t('profile.card_holder')}</p>
                    <p className="text-lg font-bold tracking-tight uppercase">{profile.name}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                    <span className="text-xs font-bold text-blue-400">PLATINUM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Change Password Modal */}
      <AnimatePresence>
        {showChangePassword && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChangePassword(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[40px] p-10 shadow-2xl w-full max-w-md relative z-10 border border-slate-100"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-slate-900">Change Password</h3>
                <button 
                  onClick={() => setShowChangePassword(false)}
                  className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Current Password</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Lock className="text-slate-400 mr-3" size={20} />
                    <input 
                      type={showPass.current ? "text" : "password"} 
                      className="bg-transparent w-full outline-none font-medium"
                      value={passwords.current}
                      onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                      required
                    />
                    <button type="button" onClick={() => setShowPass({...showPass, current: !showPass.current})}>
                      {showPass.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Lock className="text-slate-400 mr-3" size={20} />
                    <input 
                      type={showPass.new ? "text" : "password"} 
                      className="bg-transparent w-full outline-none font-medium"
                      value={passwords.new}
                      onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                      required
                    />
                    <button type="button" onClick={() => setShowPass({...showPass, new: !showPass.new})}>
                      {showPass.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm New Password</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Lock className="text-slate-400 mr-3" size={20} />
                    <input 
                      type={showPass.confirm ? "text" : "password"} 
                      className="bg-transparent w-full outline-none font-medium"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                      required
                    />
                    <button type="button" onClick={() => setShowPass({...showPass, confirm: !showPass.confirm})}>
                      {showPass.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                >
                  Update Password
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SettingsOption({ title, description, icon, onClick }: { title: string; description: string; icon: React.ReactNode; onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 hover:bg-blue-50 transition-all group cursor-pointer"
    >
      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-all mb-4">
        {icon}
      </div>
      <h4 className="font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  );
}
