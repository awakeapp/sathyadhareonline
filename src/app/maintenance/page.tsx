export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f10] text-white px-6">
      <div className="flex flex-col items-center text-center gap-8 max-w-lg">

        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/5">
          🔧
        </div>

        {/* Kannada heading */}
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight font-kannada">
            ತಾಂತ್ರಿಕ ನಿರ್ವಹಣೆ ನಡೆಯುತ್ತಿದೆ
          </h1>
          <p className="text-[17px] font-medium text-white/60 leading-relaxed">
            Site Under Maintenance
          </p>
        </div>

        {/* Divider */}
        <div className="w-12 h-0.5 rounded-full bg-amber-500/40" />

        {/* Body copy */}
        <p className="text-[15px] text-white/50 font-medium leading-relaxed max-w-sm">
          We're performing scheduled maintenance to improve your experience.
          The site will be back shortly.
        </p>

        {/* Expected return */}
        <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-[13px] font-semibold text-white/60 tracking-wide">
          Expected return: <span className="text-amber-400 font-bold">soon</span>
        </div>

        {/* Footer */}
        <p className="text-[12px] text-white/25 font-medium">
          — Sathyadhare Team
        </p>
      </div>
    </div>
  );
}
