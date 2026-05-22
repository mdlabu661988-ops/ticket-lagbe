import React from 'react';
import { motion } from 'motion/react';
import { Info, Clock, Ticket, XCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function RefundPolicy({ onBack }: { onBack: () => void }) {
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
              <ShieldCheck size={40} />
            </div>
            <h1 className="text-4xl font-bold mb-4">{t('refund.title')}</h1>
            <p className="text-white/60 max-w-2xl mx-auto">{t('refund.subtitle')}</p>
          </div>

          <div className="p-12 space-y-12">
            <section className="space-y-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Clock className="text-emerald-600" /> {t('refund.section1.title')}
              </h2>
              <ul className="space-y-4 text-black/70 leading-relaxed list-disc pl-6">
                <li>{t('refund.section1.item1')}</li>
                <li>{t('refund.section1.item2')}</li>
                <li>{t('refund.section1.item3')}</li>
                <li>{t('refund.section1.item4')}</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Ticket className="text-emerald-600" /> {t('refund.section2.title')}
              </h2>
              <ul className="space-y-4 text-black/70 leading-relaxed list-disc pl-6">
                <li>{t('refund.section2.item1')}</li>
                <li>{t('refund.section2.item2')}</li>
                <li>{t('refund.section2.item3')}</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <XCircle className="text-emerald-600" /> {t('refund.section3.title')}
              </h2>
              <p className="text-black/70 leading-relaxed">
                {t('refund.section3.desc')}
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Info className="text-emerald-600" /> {t('refund.section4.title')}
              </h2>
              <p className="text-black/70 leading-relaxed">
                {t('refund.section4.desc')}
              </p>
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
