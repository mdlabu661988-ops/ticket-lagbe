import React, { useState } from 'react';
import { Shield, Mail, Lock, ArrowRight, Bus, Facebook, Github, User, Phone, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useLanguage } from './context/LanguageContext';

interface LoginPageProps {
  onLogin: (role: 'admin' | 'counter' | 'user' | 'owner' | 'company', profile: any) => void;
  onBack: () => void;
}

export default function LoginPage({ onLogin, onBack }: LoginPageProps) {
  const { t } = useLanguage();
  const [view, setView] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loginType, setLoginType] = useState<'user' | 'staff'>('user');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (view === 'register') {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, password, name, email }),
        });

        const data = await response.json();
        setIsLoading(false);

        if (data.success) {
          toast.success('Registration Successful! You can now login.');
          setView('login');
        } else {
          toast.error(data.message || 'Registration failed.');
        }
      } else {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: email, password }),
        });

        const data = await response.json();
        setIsLoading(false);

        if (data.success) {
          onLogin(data.user.role, data.user);
        } else {
          toast.error(data.message || 'Invalid credentials.');
        }
      }
    } catch (error) {
      setIsLoading(false);
      toast.error('An error occurred during login. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLogin('user', { name: 'Google User', email: 'google@user.com', role: 'user' });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[40px] shadow-2xl overflow-hidden border border-slate-100">
        
        {/* Left Side - Branding/Info */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-emerald-600 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Bus size={28} />
              </div>
              <span className="text-2xl font-bold tracking-tight">{t('brand.name')}</span>
            </div>
            
            <h1 className="text-5xl font-black leading-tight mb-6">{t('auth.hero_title')}</h1>
            <p className="text-blue-100 text-lg max-w-sm">{t('auth.hero_subtitle')}</p>
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map(i => (
                <img key={i} src={`https://picsum.photos/id/${i+20}/100/100`} className="w-10 h-10 rounded-full border-2 border-emerald-600 object-cover" alt="User" referrerPolicy="no-referrer" />
              ))}
            </div>
            <p className="text-sm font-medium text-blue-100">{t('auth.stats_passengers')}</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <button onClick={onBack} className="text-emerald-600 font-bold text-sm mb-6 flex items-center gap-2 hover:gap-3 transition-all">
              <ArrowRight size={18} className="rotate-180" />
              {t('btn.back')}
            </button>
            <h2 className="text-3xl font-black text-slate-900 mb-2">
              {view === 'login' ? t('auth.welcome_back') : t('auth.create_account')}
            </h2>
            <p className="text-slate-500 font-medium">
              {view === 'login' ? t('auth.login_subtitle') : t('auth.register_subtitle')}
            </p>
          </div>

          {view === 'login' ? (
            <>
              {/* Login Type Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
                <button 
                  onClick={() => setLoginType('user')}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    loginType === 'user' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t('auth.passenger')}
                </button>
                <button 
                  onClick={() => setLoginType('staff')}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                    loginType === 'staff' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t('auth.staff')}
                </button>
              </div>

              {loginType === 'staff' && (
                <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 mb-6 text-xs text-amber-800">
                  <p className="font-bold flex items-center gap-1.5 mb-1.5 text-amber-900">
                    <Shield size={14} className="text-amber-600 shrink-0" /> এডমিন লগইন ক্রেডেনশিয়াল (Admin Login Help)
                  </p>
                  <p className="leading-relaxed">
                    সিস্টেম এডমিন হিসেবে লগইন করতে নিচের তথ্যগুলো ব্যবহার করুন:
                  </p>
                  <div className="mt-2 space-y-1 font-medium">
                    <div>১. ইমেইল/ইউজারনেম: <code className="font-mono bg-amber-100/80 text-amber-900 px-1.5 py-0.5 rounded">admin</code></div>
                    <div>২. পাসওয়ার্ড: <code className="font-mono bg-amber-100/80 text-amber-900 px-1.5 py-0.5 rounded">admin123</code></div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('auth.email')}</label>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Mail className="text-slate-400 mr-3" size={20} />
                    <input 
                      type="text" 
                      placeholder={t('auth.email_placeholder')} 
                      className="bg-transparent w-full outline-none font-medium"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('auth.password')}</label>
                    <a href="#" className="text-xs font-bold text-emerald-600 hover:underline">{t('auth.forgot')}</a>
                  </div>
                  <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <Lock className="text-slate-400 mr-3" size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="bg-transparent w-full outline-none font-medium"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className={`w-full text-white font-bold py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 group disabled:opacity-70 ${
                    loginType === 'staff' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' 
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <>
                      {loginType === 'staff' ? t('auth.staff_signin') : t('auth.signin')}
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('auth.fullname')}</label>
                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <User className="text-slate-400 mr-3" size={20} />
                  <input 
                    type="text" 
                    placeholder="John Doe" 
                    className="bg-transparent w-full outline-none font-medium"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('auth.email')}</label>
                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <Mail className="text-slate-400 mr-3" size={20} />
                  <input 
                    type="email" 
                    placeholder="name@example.com" 
                    className="bg-transparent w-full outline-none font-medium"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('auth.phone')}</label>
                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <Phone className="text-slate-400 mr-3" size={20} />
                  <input 
                    type="tel" 
                    placeholder="01XXXXXXXXX" 
                    className="bg-transparent w-full outline-none font-medium"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">{t('auth.password')}</label>
                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3.5 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <Lock className="text-slate-400 mr-3" size={20} />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="bg-transparent w-full outline-none font-medium"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    {t('auth.signup')}
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}

          {loginType === 'staff' && (
            <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">{t('auth.default_credentials')}</p>
              <div className="text-xs text-emerald-600 space-y-1">
                <p><span className="font-bold">{t('auth.admin')}:</span> admin@ticketlagbe.com / admin123</p>
              </div>
            </div>
          )}

          <div className="mt-10">
            <div className="relative flex items-center justify-center mb-8">
              <div className="absolute w-full h-[1px] bg-slate-100"></div>
              <span className="relative bg-white px-4 text-xs font-bold text-slate-400 uppercase tracking-widest">{t('auth.or')}</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <button 
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 py-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all font-bold text-slate-700 shadow-sm"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                {t('auth.google')}
              </button>
            </div>
          </div>

          <div className="mt-10 text-center text-sm font-medium text-slate-500">
            {view === 'login' ? (
              <>
                {t('auth.no_account')} <button onClick={() => setView('register')} className="text-emerald-600 font-bold hover:underline">{t('auth.signup')}</button>
              </>
            ) : (
              <>
                {t('auth.have_account')} <button onClick={() => setView('login')} className="text-emerald-600 font-bold hover:underline">{t('auth.signin')}</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
