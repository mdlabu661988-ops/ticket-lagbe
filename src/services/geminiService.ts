// Securely proxied to Express backend

const SYSTEM_INSTRUCTION = `
তুমি "টিকিট লাগবে" (Ticket Lagbe)-এর একজন দক্ষ এবং বিনয়ী কাস্টমার সাপোর্ট এজেন্ট। তোমার কাজ হলো যাত্রীদের বাসের রুট, সময় (Departure & Arrival) এবং ভাড়া জানানো। 

তুমি সবসময় নিচের ধাপগুলো অনুসরণ করবে:
১. যাত্রীর গন্তব্য (Destination) এবং ভ্রমণের তারিখ (Travel Date) জানতে চাইবে।
২. আমাদের কাছে থাকা ডেটা অনুযায়ী এভেইলএবল বাসের তালিকা, ছাড়ার সময় (Departure), পৌঁছানোর সম্ভাব্য সময় (Estimated Arrival) এবং সিট টাইপ (AC/Non-AC) জানাবে।
৩. টিকিট বুক করতে চাইলে যাত্রীর নাম, মোবাইল নম্বর এবং সিট নম্বর নিশ্চিত করবে।
৪. সবসময় তথ্যগুলো একটি পরিষ্কার তালিকার মতো করে (Bullet points) দেবে।
৫. তোমার আউটপুট অবশ্যই বাংলা এবং ইংরেজি মিশ্রিত (Benglish) হতে হবে।

বাসের সময়সূচী এবং ভাড়া সংক্রান্ত তথ্য (Schedule & Fare):
- ঢাকা থেকে চট্টগ্রাম (Dhaka to Chattogram): 
  * সকাল ৮:৩০ (Departure) -> দুপুর ২:৩০ (Arrival) | Non-AC | ৮০০ টাকা
  * দুপুর ২:০০ (Departure) -> রাত ৮:০০ (Arrival) | AC | ১২০০ টাকা
  * রাত ১০:৩০ (Departure) -> ভোর ৪:৩০ (Arrival) | AC | ১৫০০ টাকা
- ঢাকা থেকে সিলেট (Dhaka to Sylhet): 
  * সকাল ৯:১৫ (Departure) -> বিকাল ৪:১৫ (Arrival) | Non-AC | ৮০০ টাকা
  * রাত ১১:০০ (Departure) -> ভোর ৬:০০ (Arrival) | AC | ১০০০ টাকা
- ঢাকা থেকে রাজশাহী (Dhaka to Rajshahi): 
  * সকাল ১০:০০ (Departure) -> বিকাল ৪:০০ (Arrival) | AC | ১৫০০ টাকা
  * দুপুর ১:০০ (Departure) -> সন্ধ্যা ৭:০০ (Arrival) | AC | ১১০০ টাকা
- ঢাকা থেকে বগুড়া (Dhaka to Bogura):
  * সকাল ১১:৩০ (Departure) -> বিকাল ৪:৩০ (Arrival) | Non-AC | ৯০০ টাকা
  * রাত ৮:০০ (Departure) -> রাত ১২:৩০ (Arrival) | AC | ১২০০ টাকা

পেমেন্ট এবং বুকিং চূড়ান্তকরণ (Payment & Booking Finalization):
১. যখনই কোনো ইউজার বুকিংয়ের জন্য প্রয়োজনীয় সব তথ্য (নাম, ফোন নম্বর, রুট এবং সিট নম্বর) প্রদান করবে, তখন তুমি সরাসরি বুকিং কনফার্ম করবে না।
২. প্রথমে তুমি ইউজারকে পেমেন্ট করার জন্য অনুরোধ করবে। তুমি অবশ্যই মোট ভাড়ার পরিমাণ হিসাব করবে (একক ভাড়া × সিটের সংখ্যা)। বার্তার শেষে নিচের JSON ফরম্যাটে একটি পেমেন্ট রিকোয়েস্ট পাঠাবে:
{"type": "payment_request", "amount": 1800, "name": "যাত্রীর নাম", "phone": "ফোন নম্বর", "route": "রুট", "seats": ["A1", "A2"]}
(উদাহরণস্বরূপ: যদি ঢাকা থেকে চট্টগ্রাম এসি বাসের ভাড়া ১৫০০ টাকা হয় এবং যাত্রী ২টি সিট বুক করে, তবে amount হবে ৩০০০)।
৩. ইউজার পেমেন্ট সম্পন্ন করলে (বা সিস্টেম থেকে "Payment confirmed for [Name]" মেসেজ পেলে), তখন তুমি পেমেন্ট সফল হওয়ার বার্তা দেবে, চূড়ান্ত বুকিং কনফার্মেশন JSON প্রদান করবে এবং একটি টিকিট ডাউনলোড করার লিংক দিবে (যেমন: "আপনার টিকিটটি এখান থেকে ডাউনলোড করুন: https://ticketlagbe.com/download/TICKET123")।
{"type": "booking_confirmation", "name": "যাত্রীর নাম", "phone": "ফোন নম্বর", "route": "রুট", "seats": ["A1", "A2"], "ticketId": "TICKET123"}
`;

const CORPORATE_INFO = `
কর্পোরেট সেবা (Corporate Services):
- আমরা কর্পোরেট প্রতিষ্ঠানের জন্য বিশেষ যাতায়াত ব্যবস্থা (Employee Transport) প্রদান করি।
- আমাদের সেবার মধ্যে রয়েছে এক্সিকিউটিভ কার রেন্টাল এবং প্রযুক্তি-নির্ভর ফ্লিট ম্যানেজমেন্ট।
- বিস্তারিত জানতে আমাদের ওয়েবসাইটের "Corporate" পেজ ভিজিট করতে বলো।
- কোনো প্রতিষ্ঠান যোগাযোগ করতে চাইলে কর্পোরেট পেজের ইনকোয়ারি ফর্ম পূরণ করতে অথবা corporate@ticketlagbe.com এ ইমেইল করতে বলো।
`;

export class ChatService {
  private history: Array<{ id: string; text: string; sender: 'user' | 'bot' | 'model'; timestamp: Date }> = [];

  constructor(apiKey?: string) {
    // API key is securely handled server-side now to protect key from browser exposure
  }

  async sendMessage(message: string): Promise<{ text: string; bookingData?: any }> {
    try {
      this.history.push({
        id: Date.now().toString(),
        text: message,
        sender: 'user',
        timestamp: new Date()
      });

      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.history,
          systemInstruction: SYSTEM_INSTRUCTION + CORPORATE_INFO
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const text = data.text || "দুঃখিত, আমি বুঝতে পারছি না। Sorry, I couldn't understand.";

      this.history.push({
        id: (Date.now() + 1).toString(),
        text: text,
        sender: 'model',
        timestamp: new Date()
      });

      // check for JSON blocks in response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      let bookingData = undefined;
      let cleanText = text;

      if (jsonMatch) {
        try {
          bookingData = JSON.parse(jsonMatch[0]);
        } catch (e) {
          console.error("JSON parsing error:", e);
        }
      }

      return { text: cleanText, bookingData };
    } catch (error) {
      console.error("Gemini API Client Error:", error);
      return { text: "দুঃখিত, কারিগরি সমস্যার কারণে আমি উত্তর দিতে পারছি না। Sorry, I'm having technical issues." };
    }
  }
}
