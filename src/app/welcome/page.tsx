'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop', // News looking image
    title: 'Get the latest news from',
    highlight: 'reliable sources.',
    buttonText: 'Next',
  },
  {
    image: 'https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?q=80&w=800&auto=format&fit=crop', // Flags / international layout
    title: 'Still',
    highlight: 'up to date',
    suffix: ' news from all around the world',
    buttonText: 'Next',
  },
  {
    image: 'https://images.unsplash.com/photo-1541872703868-b7f573af2ebc?q=80&w=800&auto=format&fit=crop', // Capitol / politics
    title: 'From art to politics,',
    highlight: 'anything',
    suffix: ' in Sathyadhare.',
    buttonText: 'Sign In',
  }
]

export default function WelcomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showSplash, setShowSplash] = useState(true)
  const router = useRouter()
  // Hydration fix
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 1500)
    return () => clearTimeout(timer)
  }, [])


  if (!mounted) return null

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1)
    } else {
      router.push('/login')
    }
  }

  const slide = SLIDES[currentSlide]

  if (showSplash) {
    return (
      <main className="fixed inset-0 min-h-[100dvh] w-full bg-white z-[9999] flex flex-col items-center justify-center">
        {/* Splash screen decorative elements matching Screen 1 */}
        <div className="flex flex-col items-center animate-fade-up">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[#f04a4c] font-black text-6xl tracking-tighter">S</span>
            <span className="text-[#0a1128] font-black text-6xl tracking-tighter">D</span>
          </div>
          <h1 className="text-[#0a1128] font-bold text-xl tracking-[0.2em] relative">
            SATHYADHARE
          </h1>
        </div>
        
        {/* Geometric red blocks at bottom left (like in the design) */}
        <div className="absolute bottom-0 left-0">
          <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="160" width="80" height="80" fill="#f04a4c" />
            <rect x="80" y="120" width="80" height="120" fill="#f04a4c" fillOpacity="0.8" />
            <rect x="160" y="200" width="80" height="40" fill="#f04a4c" fillOpacity="0.6" />
          </svg>
        </div>
      </main>
    )
  }

  return (
    <main className="fixed inset-0 min-h-[100dvh] w-full bg-black z-[9999] flex flex-col justify-end pb-12 overflow-hidden animate-fade-in">
      
      {/* Background Images Layer */}
      {SLIDES.map((s, idx) => (
        <div 
          key={idx}
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out ${
            idx === currentSlide ? 'opacity-100 z-0' : 'opacity-0 -z-10'
          }`}
        >
          {/* Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${s.image})` }}
          />
          {/* Dark gradient overlay so text is highly legible */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#0a1128] opacity-95" />
        </div>
      ))}

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
        <div className="flex items-center gap-2">
           <img src="/logo-light.png" alt="Sathyadhare Logo" className="h-6 object-contain" />
        </div>
        <Link 
          href="/login" 
          className="text-[#9aa0c3] text-sm font-semibold hover:text-white transition-colors"
        >
          Skip
        </Link>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 px-8 w-full max-w-[480px] mx-auto animate-fade-up">
        
        <div className="mb-10 min-h-[140px]">
          <h2 className="text-4xl leading-[1.2] font-black tracking-tight text-white mb-6 drop-shadow-lg">
            {slide.title}{' '}
            <br className="hidden sm:block" />
            <span className="text-[#f04a4c]">{slide.highlight}</span>
            {slide.suffix && <>{slide.suffix}</>}
          </h2>
          
          {/* Progress Indicators */}
          <div className="flex items-center gap-2 mt-8">
            {SLIDES.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide 
                    ? 'w-10 bg-[#f04a4c]' 
                    : 'w-2.5 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleNext}
          className="w-full h-16 rounded-full bg-[#f04a4c] text-white font-bold text-[15px] shadow-lg shadow-[#f04a4c]/30 hover:shadow-xl hover:shadow-[#f04a4c]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center"
        >
          {slide.buttonText}
        </button>

      </div>

    </main>
  )
}
