import React from 'react';
import { motion } from 'motion/react';
import { Info, Bus, ShieldCheck, Users, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function AboutUs({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-12 px-6 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] shadow-xl border border-black/5 overflow-hidden"
        >
          <div className="bg-[#1A1A1A] p-12 text-white text-center">
            <div className="inline-flex p-4 bg-emerald-600 rounded-2xl mb-6">
              <Bus size={40} />
            </div>
            <h1 className="text-4xl font-bold mb-4">{t('about.title')}</h1>
            <p className="text-white/60 max-w-2xl mx-auto">{t('about.subtitle')}</p>
          </div>

          <div className="p-12 space-y-12">
            <section className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Info className="text-emerald-600" /> {t('about.mission.title')}
                </h2>
                <p className="text-black/70 leading-relaxed">
                  {t('about.mission.desc')}
                </p>
              </div>
              <div className="bg-[#F5F5F5] p-8 rounded-3xl border border-black/5">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600 mb-1">১০+</div>
                    <div className="text-xs text-black/40 uppercase font-bold">{t('stats.experience')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600 mb-1">৫০+</div>
                    <div className="text-xs text-black/40 uppercase font-bold">{t('stats.buses')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600 mb-1">১০০+</div>
                    <div className="text-xs text-black/40 uppercase font-bold">{t('stats.drivers')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600 mb-1">১মি+</div>
                    <div className="text-xs text-black/40 uppercase font-bold">{t('stats.passengers')}</div>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold mb-8 text-center">{t('about.why_choose.title')}</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <FeatureCard 
                  icon={<ShieldCheck size={24} />} 
                  title={t('about.feature.safety')} 
                  desc={t('about.feature.safety.desc')}
                />
                <FeatureCard 
                  icon={<Users size={24} />} 
                  title={t('about.feature.staff')} 
                  desc={t('about.feature.staff.desc')}
                />
                <FeatureCard 
                  icon={<MapPin size={24} />} 
                  title={t('about.feature.routes')} 
                  desc={t('about.feature.routes.desc')}
                />
              </div>
            </section>

            <div className="pt-8 text-center">
              <button 
                onClick={onBack}
                className="bg-[#1A1A1A] text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg"
              >
                {t('btn.home')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="p-6 bg-[#F9F9F9] rounded-2xl border border-black/5 hover:border-emerald-600/20 transition-all">
      <div className="text-emerald-600 mb-4">{icon}</div>
      <h3 className="font-bold mb-2">{title}</h3>
      <p className="text-sm text-black/60 leading-relaxed">{desc}</p>
    </div>
  );
}
