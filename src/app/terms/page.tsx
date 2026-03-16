'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();
  const lastUpdated = "March 16, 2026";

  const handleAccept = () => {
    localStorage.setItem('terms-accepted', 'true');
    // We send them back with a query param to be extra sure the signup page picks it up
    router.push('/signup?accepted=true');
  };

  const handleDecline = () => {
    localStorage.removeItem('terms-accepted');
    router.back();
  };

  return (
    <main className="min-h-[100dvh] flex flex-col bg-gradient-to-b from-[#5c4df0] to-[#7165f2] relative overflow-hidden">
      
      {/* Dynamic Status Bar Filler (Ensures no white peak-through) */}
      <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-[#5c4df0] z-[60]" />

      {/* Back Arrow */}
      <div className="px-6 relative z-10 flex items-center" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 20px)', paddingBottom: '20px' }}>
        <button onClick={() => router.back()} className="text-white hover:opacity-80 transition-opacity focus:outline-none p-2 -ml-2 rounded-full active:bg-white/10">
          <ArrowLeft className="w-6 h-6" strokeWidth={3} />
        </button>
      </div>

      {/* Greeting Section - Matching Design */}
      <div className="px-8 pb-10 pt-2 relative z-10">
        <h2 className="text-[20px] font-bold text-white mb-6 opacity-90">Hello 👋</h2>
        <h3 className="text-[26px] font-black text-white leading-[1.2] tracking-tight">
          Before you create an account,<br />
          please read<br />
          and accept our Terms & Conditions
        </h3>
      </div>

      {/* Main Content Card */}
      <div className="flex-1 bg-white rounded-t-[3.5rem] px-8 pt-14 pb-32 relative z-10 rugged-shadow overflow-y-auto scrollbar-none shadow-[0_-20px_60px_rgba(0,0,0,0.15)]">
        <div className="max-w-xl mx-auto">
          <header className="mb-10">
            <h1 className="text-[28px] font-black text-[#1a1c20] tracking-tight mb-2">
               Terms & Conditions
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
               <span className="w-2 h-2 rounded-full bg-[#5c4df0]" />
               Last updated: {lastUpdated}
            </div>
          </header>

          <div className="space-y-10 text-slate-600 font-medium leading-[1.8] text-[15px]">
             <p className="font-bold text-slate-500 italic">
                {"Please read these terms and conditions (\"terms and conditions\", \"terms\") carefully before using Sathyadhare online publication (\"platform\", \"service\") operated by Sathyadhare Kannada Samithi."}
             </p>

             <section>
                <h3 className="text-[18px] font-black text-[#1a1c20] mb-4">1. Conditions of Use</h3>
                <p>
                   {"By using this app, you certify that you have read and reviewed this Agreement and that you agree to comply with its terms. If you do not want to be bound by the terms of this Agreement, you are advised to stop using the app accordingly. Sathyadhare only grants use and access of this app, its products, and its services to those who have accepted its terms."}
                </p>
             </section>

             <section>
                <h3 className="text-[18px] font-black text-[#1a1c20] mb-4">2. User Accounts and Security</h3>
                <p>
                   {"As a user of this app, you may be asked to register with us and provide private information. You are responsible for ensuring the accuracy of this information, and you are responsible for maintaining the safety and security of your identifying information."}
                </p>
             </section>

             <section>
                <h3 className="text-[18px] font-black text-[#1a1c20] mb-4">3. Privacy Policy</h3>
                <p>
                   {"Before you continue using our app, we advise you to read our privacy policy regarding our user data collection. It will help you better understand our practices."}
                </p>
             </section>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-8 pb-10 bg-white/90 backdrop-blur-md z-50 flex gap-4 border-t border-slate-100">
         <button 
           onClick={handleDecline}
           className="flex-1 h-[64px] rounded-[2rem] bg-slate-100 text-[#1a1c20] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-200 transition-all active:scale-95"
         >
           Decline
         </button>
         <button 
           onClick={handleAccept}
           className="flex-1 h-[64px] rounded-[2rem] bg-[#5c4df0] text-white font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-[#5c4df0]/30 hover:opacity-90 transition-all active:scale-95"
         >
           Accept
         </button>
      </div>

    </main>
  );
}
