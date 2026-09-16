'use client';

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ShieldCheck, 
  Wrench, 
  Database, 
  Bot, 
  ArrowRight, 
  Zap, 
  BookOpen,
  LifeBuoy,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AppLogo } from './AppLogo';
import { Automotive3DCanvas } from './Automotive3DCanvas';
import { ThemeToggle } from './ThemeToggle';
import { SpringButton } from './SpringButton';

gsap.registerPlugin(ScrollTrigger);

interface SplashScreenProps {
  onEnterTechnician: () => void;
  onEnterManager: () => void;
  onSignIn: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onEnterTechnician,
  onEnterManager,
  onSignIn,
}) => {
  const cardsRef = useRef<HTMLDivElement>(null);
  const [logoClicks, setLogoClicks] = React.useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    setLogoClicks(next);
    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);

    if (next === 1) {
      toast.info('🔑 Secret Admin Gate: 1/3 clicks');
    } else if (next === 2) {
      toast.info('🔑 Secret Admin Gate: 2/3 clicks — 1 more click to unlock');
    } else if (next >= 3) {
      toast.success('👑 Unlocking Super Admin Command Center…');
      sessionStorage.setItem('aura_super_admin_auth', 'true');
      sessionStorage.setItem('aura_role', 'super_admin');
      setLogoClicks(0);
      navigate('/super-admin');
      return;
    }

    clickTimeoutRef.current = setTimeout(() => setLogoClicks(0), 3000);
  };

  useEffect(() => {
    if (!cardsRef.current) return;
    const cards = cardsRef.current.children;

    gsap.fromTo(
      cards,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        stagger: 0.15,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cardsRef.current,
          start: 'top 85%',
        },
      }
    );
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-x-hidden selection:bg-primary selection:text-white">
      {/* High-Resolution Automotive Background Overlay Image */}
      <div 
        className="fixed inset-0 z-0 opacity-15 mix-blend-overlay pointer-events-none bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1617814076367-b759c7d7e738?q=80&w=2000&auto=format&fit=crop')`,
        }}
      />

      {/* 3D WebGL Ambient Background Visual Layer */}
      <div className="fixed inset-0 z-0 opacity-20 pointer-events-none">
        <Automotive3DCanvas className="w-full h-full" />
      </div>

      {/* Radial Gradient Overlay */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#dc9750]/15 via-transparent to-background/95 pointer-events-none" />

      {/* Solid Soft Black Header Navigation */}
      <header className="sticky top-0 z-50 bg-[#1c1c1c] text-white border-b border-neutral-800 px-6 sm:px-10 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <AppLogo size={36} onClick={handleLogoClick} />
          <div>
            <span className="font-serif-title font-bold text-lg tracking-tight text-white">
              Aura<span className="text-[#dc9750]">Automotive</span>
            </span>
            <span className="ml-2.5 px-2.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-semibold uppercase tracking-wider">
              System v3.8
            </span>
          </div>
        </div>

        {/* Header Navigation Buttons */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-neutral-300">
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
            className="hover:text-[#dc9750] transition-colors flex items-center gap-1.5"
          >
            Overview
          </button>
          <button 
            onClick={() => {
              if (cardsRef.current) {
                cardsRef.current.scrollIntoView({ behavior: 'smooth' });
              }
            }} 
            className="hover:text-[#dc9750] transition-colors flex items-center gap-1.5"
          >
            Platform Features
          </button>
          <a 
            href="/support" 
            className="hover:text-[#dc9750] transition-colors flex items-center gap-1.5"
          >
            <LifeBuoy size={14} className="text-[#dc9750]" />
            Support Center
          </a>
        </nav>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <SpringButton
            onClick={onSignIn}
            className="px-5 py-2 text-xs font-bold text-white bg-[#dc9750] hover:bg-[#c88540] rounded-full transition-all shadow-md"
          >
            Sign In
          </SpringButton>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 sm:px-10 py-16 lg:py-24 relative z-10 flex flex-col items-center justify-center text-center">
        
        {/* Subtitle Pill Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#dc9750]/15 border border-[#dc9750]/30 text-[#dc9750] text-xs font-semibold mb-6"
        >
          <Zap size={14} className="animate-pulse" />
          <span>Next-Gen Enterprise Automotive RAG Platform</span>
        </motion.div>

        {/* Large Editorial Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif-title text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08] max-w-4xl mb-6"
        >
          THE INTELLIGENT <br />
          <span className="italic font-normal text-muted-foreground">AUTOMOTIVE OS®</span>
        </motion.h1>

        {/* Sub-description */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl mb-10"
        >
          Streamline OEM technical service manuals, real-time OBD-II vehicle telemetry, and 
          OpenRouter grounded AI resolution across Technician and Management workflows.
        </motion.p>

        {/* Action CTAs with Desert Sun Accent */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16"
        >
          <SpringButton
            onClick={onEnterTechnician}
            className="px-8 py-4 rounded-full font-bold text-sm bg-[#dc9750] text-white hover:bg-[#c88540] shadow-xl transition-all flex items-center gap-2"
          >
            <Wrench size={18} />
            Technician Workspace
            <ArrowRight size={18} />
          </SpringButton>

          <SpringButton
            onClick={onEnterManager}
            className="px-8 py-4 rounded-full font-bold text-sm bg-card border border-border text-foreground hover:bg-secondary transition-all flex items-center gap-2 shadow-sm"
          >
            <ShieldCheck size={18} className="text-[#dc9750]" />
            Management Oversight
          </SpringButton>
        </motion.div>

        {/* GSAP ScrollTrigger Feature Section */}
        <div ref={cardsRef} className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="floating-card p-6 rounded-[24px]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#dc9750]/15 border border-[#dc9750]/30 flex items-center justify-center text-[#dc9750]">
                <Activity size={20} />
              </div>
              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase">Module 01</span>
            </div>
            <h3 className="font-serif-title text-base font-bold text-foreground mb-2">OBD-II Live Diagnostics</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Connect STN1170 & ELM327 scan tools, clear ECU diagnostic trouble codes, decode 17-digit VINs, and execute step-by-step repair guides.
            </p>
          </div>

          <div className="floating-card p-6 rounded-[24px]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#dc9750]/15 border border-[#dc9750]/30 flex items-center justify-center text-[#dc9750]">
                <Bot size={20} />
              </div>
              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase">Module 02</span>
            </div>
            <h3 className="font-serif-title text-base font-bold text-foreground mb-2">Grounded RAG AI Assistant</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Powered by OpenRouter with automotive guardrails, citation drawer badges, and real-time OEM torque specifications.
            </p>
          </div>

          <div className="floating-card p-6 rounded-[24px]">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <Database size={20} />
              </div>
              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase">Module 03</span>
            </div>
            <h3 className="font-serif-title text-base font-bold text-foreground mb-2">Dual-Engine Knowledge Storage</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              High-availability PostgreSQL integration with automatic SQLite fallback, bulk CSV document ingestion, and compliance audit logs.
            </p>
          </div>
        </div>

      </main>

      {/* Solid Soft Black Footer */}
      <footer className="border-t border-neutral-800 bg-[#1c1c1c] text-white py-8 px-6 sm:px-10 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-400">
          <div className="flex items-center gap-3">
            <AppLogo size={24} onClick={() => {}} />
            <span>© 2026 AuraAutomotive OS Inc. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <button onClick={onSignIn} className="hover:text-[#dc9750] transition-colors">Privacy Policy</button>
            <button onClick={onSignIn} className="hover:text-[#dc9750] transition-colors">Terms of Service</button>
            <button onClick={onSignIn} className="hover:text-[#dc9750] transition-colors">Security Audit</button>
            <button onClick={onSignIn} className="hover:text-[#dc9750] transition-colors">Support Center</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
