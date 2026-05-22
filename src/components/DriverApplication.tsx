import React, { useState } from 'react';
import { User, Phone, MapPin, Camera, CheckCircle, ArrowRight, Loader2, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface DriverApplicationProps {
  onSuccess: () => void;
  onBack: () => void;
  language: 'en' | 'bn';
}

export default function DriverApplication({ onSuccess, onBack, language }: DriverApplicationProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    license_number: '',
    profile_image: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const t = (en: string, bn: string) => language === 'bn' ? bn : en;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('File size too large (max 5MB)', 'ফাইলের সাইজ অনেক বড় (সর্বোচ্চ ৫ মেগাবাইট)'));
      return;
    }

    setUploading(true);
    setPreview(URL.createObjectURL(file));

    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload
      });
      const data = await res.json();
      if (data.imageUrl) {
        setFormData({ ...formData, profile_image: data.imageUrl });
        toast.success(t('Image uploaded successfully', 'ছবি সফলভাবে আপলোড করা হয়েছে'));
      }
    } catch (error) {
      toast.error(t('Failed to upload image', 'ছবি আপলোড করতে ব্যর্থ হয়েছে'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address || !formData.license_number) {
      toast.error(t('Please fill in all required fields', 'অনুগ্রহ করে সব প্রয়োজনীয় ঘর পূরণ করুন'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/driver/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(t('Application submitted successfully!', 'আবেদন সফলভাবে জমা দেওয়া হয়েছে!'));
        onSuccess();
      } else {
        toast.error(data.message || t('Submission failed', 'জমা দিতে ব্যর্থ হয়েছে'));
      }
    } catch (error) {
      toast.error(t('An error occurred', 'একটি সমস্যা হয়েছে'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#1A1A1A] p-10 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10">
              <button 
                onClick={onBack}
                className="text-white/60 hover:text-white mb-6 text-sm flex items-center gap-2 transition-colors"
              >
                <ArrowRight size={16} className="rotate-180" />
                {t('Go Back', 'ফিরে যান')}
              </button>
              <h1 className="text-3xl font-black mb-3">
                {t('Driver Application Form', 'ড্রাইভার অ্যাপ্লিকেশন ফরম')}
              </h1>
              <p className="text-white/60 font-medium">
                {t('Join our fleet and start earning today.', 'আমাদের বহরে যোগ দিন এবং আজই ইনকাম শুরু করুন।')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8">
            {/* Photo Upload Section */}
            <div className="flex flex-col items-center pb-8 border-b border-slate-100">
              <div className="relative group">
                <div className={`w-32 h-32 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all ${!preview ? 'hover:border-emerald-400 group-hover:bg-emerald-50' : ''}`}>
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={32} className="text-slate-400" />
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                      <Loader2 className="animate-spin text-emerald-600" />
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-center">
                  <Camera size={14} />
                </div>
              </div>
              <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-center">
                {t('Upload Profile Photo', 'প্রোফাইল ছবি আপলোড করুন')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={14} className="text-emerald-600" />
                  {t('Full Name', 'পুরো নাম')}
                </label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder={t('Enter your full name', 'আপনার পুরো নাম লিখুন')}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              {/* Mobile */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={14} className="text-emerald-600" />
                  {t('Mobile Number', 'মোবাইল নাম্বার')}
                </label>
                <input 
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder={t('Enter mobile number', 'আপনার মোবাইল নাম্বার লিখুন')}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              {/* License Number */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <CreditCard size={14} className="text-emerald-600" />
                  {t('Driving License Number', 'ড্রাইভিং লাইসেন্স নাম্বার')}
                </label>
                <input 
                  type="text"
                  required
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                  placeholder={t('Enter license number', 'আপনার লাইসেন্স নাম্বার লিখুন')}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <MapPin size={14} className="text-emerald-600" />
                {t('Full Address', 'পুরো ঠিকানা')}
              </label>
              <textarea 
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                placeholder={t('Enter your present address', 'আপনার বর্তমান ঠিকানা লিখুন')}
                rows={3}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium resize-none"
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isSubmitting || uploading}
              className="w-full bg-emerald-600 text-white rounded-2xl py-5 font-black text-lg shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  {t('Submitting...', 'জমা হচ্ছে...')}
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  {t('Submit Application', 'আবেদন জমা দিন')}
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400 font-medium px-4">
              {t('By submitting, you agree to our terms of service and driver policies.', 'জমা দেওয়ার মাধ্যম আপনি আমাদের পরিষেবার শর্তাবলী এবং ড্রাইভার নীতিগুলির সাথে সম্মিতি প্রকাশ করছেন।')}
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
