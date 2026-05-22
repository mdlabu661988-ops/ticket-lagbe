import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    }
  } catch (e) {}
  return dateStr;
};

const getReportingTime = (departureStr: string) => {
  if (!departureStr || departureStr === 'N/A') return 'N/A';
  try {
    const match = departureStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let hours = parseInt(match[1]);
      let minutes = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      
      minutes -= 20;
      if (minutes < 0) {
        minutes += 60;
        hours -= 1;
      }
      if (hours <= 0) {
        hours = 12;
      }
      
      const pad = (num: number) => num.toString().padStart(2, '0');
      return `${hours}:${pad(minutes)} ${ampm}`;
    }
  } catch (e) {}
  return departureStr;
};

export const generateTicketPDF = async (bookingData: any, language: string, t: any) => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '780px';
  container.style.padding = '30px';
  container.style.backgroundColor = '#ffffff';
  container.style.fontFamily = '"Inter", "Helvetica", "Arial", sans-serif';
  
  const isBn = language === 'bn';
  
  const pnr = bookingData.ticketId || ('TL-' + Math.random().toString(36).substr(2, 9).toUpperCase());
  const tripDate = formatDate(bookingData.journeyDate);
  const fromCity = bookingData.fromCity || 'Dhaka';
  const toCity = bookingData.toCity || 'Khagrachari';
  const busName = bookingData.busName || 'Premium Bus Service';
  const seatsList = Array.isArray(bookingData.seats) ? bookingData.seats : [bookingData.seats];
  const seatPrice = bookingData.price || 800;
  const basePrice = seatPrice * seatsList.length;
  const feeCharged = 172.00;
  const insuranceAmount = 40.00;
  const totalAmount = bookingData.totalAmount || (basePrice + feeCharged + insuranceAmount);
  
  const formattedBookDate = formatDate(new Date().toISOString().split('T')[0]);
  const reportingTime = getReportingTime(bookingData.departure);
  const isPayLater = bookingData.paymentMethod === 'pay_later';

  container.innerHTML = `
    <!-- Top-level borders & visual structure -->
    <div style="border: 1.5px solid #000000; border-radius: 4px; overflow: hidden; background: white; padding: 2px;">
      
      <!-- Top banner block (Green ribbon context from image) -->
      <div style="background: #16a34a; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #15803d; color: white;">
        <div style="display: flex; align-items: center; gap: 14px;">
          <!-- Custom generated solid blue bus logo -->
          <div style="background: #0f172a; width: 64px; height: 64px; border-radius: 12px; display: flex; align-items: center; justify-content: center; overflow: hidden; border: 2px solid #ffffff;">
            <img src="/src/assets/images/blue_bus_logo_1779299416679.png" style="width: 100%; height: 100%; object-fit: contain;" />
          </div>
          <div>
            <h1 style="margin: 0; font-size: 32px; font-weight: 950; font-family: 'Hiragino Kaku Gothic Pro', 'Inter', sans-serif; letter-spacing: -1px; text-shadow: 1px 1px 2px rgba(0,0,0,0.15);">টিকিট লাগবে</h1>
            <p style="margin: 2px 0 0; font-size: 11px; opacity: 0.95; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; font-family: monospace;">Your Journey, Our Commitment</p>
          </div>
        </div>
        <div style="text-align: right; max-width: 280px; font-size: 11px; line-height: 1.4; opacity: 0.95;">
          <p style="margin: 0; font-weight: 850; font-size: 12px; letter-spacing: 0.5px;">TICKET LAGBE (টিকিট লাগবে)</p>
          <p style="margin: 2px 0 0;">প্রধান কার্যালয়: হোল্ডিং-৪৫, রোড-১২, সায়দাবাদ বাস টার্মিনাল, ঢাকা</p>
          <p style="margin: 1px 0 0;">সহায়তা: ০৯৬১৩-৪২০৫২০ | support@ticketlagbe.com</p>
        </div>
      </div>
      
      <!-- Main body containing details -->
      <div style="padding: 24px;">
        
        <!-- FIRST UPPER MAIN GRIDS (PNR Table mimicking user image EXACTLY) -->
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; font-size: 12px; line-height: 1.5; margin-bottom: 24px;">
          <tbody>
            <tr>
              <!-- Column 1 -->
              <td style="width: 38%; padding: 12px 14px; border-right: 1.5px solid #000000; vertical-align: top;">
                <div style="margin-bottom: 6px;"><strong style="font-size: 13px; font-family: monospace;">PNR :</strong> <span style="font-family: monospace; font-weight: 900; font-size: 14px; color: #1e293b;">${pnr}</span></div>
                <div style="margin-bottom: 4px;"><strong>From :</strong> ${fromCity}</div>
                <div style="margin-bottom: 4px;"><strong>Boarding :</strong> ${bookingData.counter || 'SAYEDABAD 11 NO COUNTER'}</div>
                <div style="margin-bottom: 4px;"><strong>Departure :</strong> ${bookingData.departure || 'N/A'}</div>
                <div><strong>Booked On :</strong> ${formattedBookDate}</div>
              </td>
              
              <!-- Column 2 -->
              <td style="width: 32%; padding: 12px 14px; border-right: 1.5px solid #000000; vertical-align: top;">
                <div style="margin-bottom: 6px;"><strong>Trip Date :</strong> <span style="font-weight: 800;">${tripDate}</span></div>
                <div style="margin-bottom: 4px;"><strong>To :</strong> ${toCity}</div>
                <div style="margin-bottom: 4px;"><strong>Dropping :</strong> ${toCity.toUpperCase()} CENTRAL STATION</div>
                <div style="margin-bottom: 4px;"><strong>Reporting :</strong> ${reportingTime}</div>
                <div><strong>Booked By :</strong> Web User</div>
              </td>
              
              <!-- Column 3 Booked Payment block -->
              <td style="width: 30%; padding: 10px 12px; vertical-align: top; background: #fafafa;">
                <div style="border-bottom: 1.5px solid #000000; padding-bottom: 4px; margin-bottom: 6px;">
                  <strong style="font-size: 13px; text-transform: uppercase; color: #1e293b; letter-spacing: 0.5px;">Payment Details</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                  <span>Ticket Price :</span>
                  <span>BDT ${basePrice.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                  <span>+ Fee Charged :</span>
                  <span>BDT ${feeCharged.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; border-bottom: 1px dashed #cccccc; padding-bottom: 4px;">
                  <span>+ Insurance Amount :</span>
                  <span>BDT ${insuranceAmount.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 13px;">
                  <span>Total Amount :</span>
                  <span style="color: #1e3a8a;">BDT ${totalAmount.toFixed(2)}</span>
                </div>
                <div style="margin-top: 8px; text-align: center;">
                  <span style="display: inline-block; padding: 3px 8px; border-radius: 4px; font-weight: 900; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; ${
                    isPayLater 
                      ? 'background: #fef3c7; color: #92400e; border: 1px solid #f59e0b;' 
                      : 'background: #d1fae5; color: #065f46; border: 1px solid #10b981;'
                  }">
                    ${isPayLater ? 'Pay Later (বুকড)' : `PAID VIA ${bookingData.paymentMethod.toUpperCase()}`}
                  </span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- PASSENGER vs SEATS ROWS block from user image -->
        <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; font-size: 12px; line-height: 1.5; margin-bottom: 32px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1.5px solid #000000; text-align: left;">
              <th style="padding: 8px 14px; width: 50%;"><strong>Passenger</strong></th>
              <th style="padding: 8px 14px; width: 50%;"><strong>Seat(s)</strong></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 10px 14px; border-right: 1.5px solid #000000; font-size: 14px; font-weight: 800; color: #1e293b;">
                ${bookingData.name.toUpperCase()}
              </td>
              <td style="padding: 10px 14px; font-family: monospace; font-size: 14px;">
                ${seatsList.map((s: string) => `<span style="display: inline-block; border: 1px solid #cbd5e1; background: #f8fafc; padding: 2px 8px; border-radius: 4px; margin-right: 6px; font-weight: bold; color: #1e3a8a;">[${s}]</span>`).join('')}
              </td>
            </tr>
          </tbody>
        </table>

        <!-- DECORATED BENGALI DETAILED ROW block -->
        <div style="border: 1px dashed #94a3b8; border-radius: 8px; padding: 18px 24px; background: #fafaf9; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px;">
          <div>
            <h4 style="margin: 0 0 10px; font-size: 14px; font-weight: 900; color: #b45309; border-bottom: 1px solid #fed7aa; padding-bottom: 4px;">যাত্রীর বিবরণ</h4>
            <p style="margin: 0; font-size: 15px; font-weight: 900; color: #1e293b;">${bookingData.name}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #475569; font-weight: 600; font-family: monospace;">${bookingData.phone}</p>
          </div>
          <div>
            <h4 style="margin: 0 0 10px; font-size: 14px; font-weight: 900; color: #1e3a8a; border-bottom: 1px solid #bfdbfe; padding-bottom: 4px;">ভ্রমণের তথ্য</h4>
            <p style="margin: 0; font-size: 15px; font-weight: 900; color: #1e293b;">${fromCity} ${isBn ? 'থেকে' : 'to'} ${toCity}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #475569; font-weight: bold;">${isBn ? 'আসনে' : 'Seat'}: <span style="color: #16a34a;">${seatsList.join(', ')}</span></p>
          </div>
        </div>

        <!-- IMPORTANT INSTRUCTIONS -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin-bottom: 32px;">
          <h3 style="margin: 0 0 12px; font-size: 15px; font-weight: 900; color: #166534; border-bottom: 1px solid #bbf7d0; padding-bottom: 6px;">গুরুত্বপূর্ণ নির্দেশনা:</h3>
          <ul style="margin: 0; padding: 0; list-style: none; color: #14532d; font-size: 12.5px; line-height: 1.8; font-weight: 500;">
            <li style="margin-bottom: 6px;">• ভ্রমণের সময় এই টিকিটের একটি কপি (প্রিন্ট বা ডিজিটাল) অবশ্যই সাথে রাখুন।</li>
            <li style="margin-bottom: 6px;">• বাস ছাড়ার অন্তত ৩০ মিনিট আগে নির্ধারিত ডিপার্চার কাউন্টারে উপস্থিত হোন।</li>
            <li style="margin-bottom: 6px;">• এই টিকিটটি হস্তান্তরযোগ্য নয়, নিরাপত্তা যাচাইয়ের জন্য কাউন্টার স্টাফকে পরিচয়পত্র দেখাতে হবে।</li>
            <li>• টিকিট সংক্রান্ত যেকোনো প্রয়োজনে যোগাযোগ করুন: <strong style="font-family: monospace; color: #166534;">support@ticketlagbe.com</strong></li>
          </ul>
        </div>
        
        <!-- FOOTER THANK YOU -->
        <div style="text-align: center; border-top: 1.5px dashed #cccccc; padding-top: 18px; margin-top: 10px;">
          <p style="margin: 0; font-size: 15px; font-weight: 950; color: #15803d; font-family: sans-serif; letter-spacing: 0.2px;">টিকিট লাগবে বেছে নেওয়ার জন্য ধন্যবাদ!</p>
          <p style="margin: 3px 0 0; font-size: 10px; color: #64748b;">This is a system generated secure e-ticket.</p>
        </div>

      </div>
    </div>
  `;
  
  document.body.appendChild(container);
  
  try {
    const canvas = await html2canvas(container, {
      scale: 2.2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Ticket_${bookingData.name.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('PDF Generation Error:', error);
  } finally {
    document.body.removeChild(container);
  }
};
