import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const CountdownTimer = ({ 
  bookingDate, 
  language, 
  onExpired 
}: { 
  bookingDate: string; 
  language: string; 
  onExpired?: () => void; 
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      let cleanDateStr = bookingDate;
      if (cleanDateStr && !cleanDateStr.includes('Z') && !cleanDateStr.includes('+')) {
        // SQLite output is 'YYYY-MM-DD HH:MM:SS' in UTC, so replace space with 'T' and append 'Z'
        cleanDateStr = cleanDateStr.replace(' ', 'T') + 'Z';
      }
      
      const created = new Date(cleanDateStr).getTime();
      const now = new Date().getTime();
      // 24 hours = 24 * 60 * 60 * 1000 ms
      const diff = (created + 24 * 60 * 60 * 1000) - now;

      if (isNaN(created) || diff <= 0) {
        setExpired(true);
        setTimeLeft(language === 'bn' ? 'সময় শেষ (বাতিল)' : 'Expired (Cancelled)');
        if (onExpired) onExpired();
        return false;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const hourStr = String(hours).padStart(2, '0');
      const minStr = String(minutes).padStart(2, '0');
      const secStr = String(seconds).padStart(2, '0');

      setTimeLeft(
        language === 'bn'
          ? `পেমেন্টের বাকি সময়: ${hourStr} ঘণ্টা ${minStr} মিনিট ${secStr} সেকেন্ড`
          : `Time left to pay: ${hourStr}h ${minStr}m ${secStr}s`
      );
      return true;
    };

    calculateTime();
    const interval = setInterval(() => {
      const active = calculateTime();
      if (!active) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bookingDate, language]);

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-black shadow-sm ${
      expired 
        ? 'bg-rose-50 text-rose-600 border border-rose-100' 
        : 'bg-amber-50 text-amber-600 border border-amber-100'
    }`}>
      <Clock size={11} className={expired ? 'text-rose-500' : 'text-amber-500 animate-pulse'} />
      {timeLeft}
    </span>
  );
};
