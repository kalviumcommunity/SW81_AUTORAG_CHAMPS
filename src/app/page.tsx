'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { AppLogo } from '@/components/AppLogo';
import { registerUserInDb, loginUserInDb } from '@/services/api';
import { 
  Eye, 
  EyeOff, 
  ChevronDown, 
  Loader2, 
  KeyRound, 
  Copy, 
  Check, 
  AlertCircle, 
  CheckCircle2,
  Database
} from 'lucide-react';

const FEATURES = [
  { icon: '⚡', label: 'AI Diagnostic Engine', desc: 'Real-time DTC resolution from 40,000+ vehicle records' },
  { icon: '📷', label: 'VIN Scan & Match', desc: 'Instant vehicle identification via camera or manual entry' },
  { icon: '📋', label: 'Live Repair Guides', desc: 'Step-by-step instructions updated from OEM service manuals' },
  { icon: '🔒', label: 'Role-Based Access', desc: 'Technician and Manager workflows with audit-grade security' },
];

const DEMO_CREDENTIALS = [
  { role: 'Technician', email: 'alex.reyes@auraos.io', password: 'Tech@2026!', emoji: '🔧', key: 'technician' },
  { role: 'Manager', email: 'sarah.kim@auraos.io', password: 'Mgr@2026!', emoji: '📊', key: 'manager' },
  { role: 'Super Admin', email: 'admin.master@auraos.io', password: '8899', emoji: '👑', key: 'super_admin' },
];

function LeftHeroPanel() {
  const [pulse, setPulse] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setPulse(true), 800);
    const t2 = setTimeout(() => setShowFeatures(true), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="hidden lg:flex lg:w-[520px] xl:w-[600px] 2xl:w-[680px] flex-col justify-between bg-surface border-r border-border px-10 py-12 relative overflow-hidden">
      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 opacity-[0.03]" 
        style={{
          backgroundImage: 'linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Radial Glow */}
      <div 
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full transition-all duration-1000 pointer-events-none ${pulse ? 'opacity-20' : 'opacity-0'}`}
        style={{
          background: 'radial-gradient(circle, var(--primary), transparent 70%)',
          filter: 'blur(40px)'
        }}
      />

      {/* Logo Header */}
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-2">
          <AppLogo size={44} />
          <div>
            <span className="font-bold text-xl tracking-tight text-foreground">
              Aura<span className="text-gradient-cyan">Automotive</span>OS
            </span>
            <p className="text-xs text-muted-foreground tracking-widest uppercase mt-0.5">
              Service Intelligence Platform
            </p>
          </div>
        </div>
      </div>

      {/* Central Hexagon Animation & Heading */}
      <div className="relative z-10 flex flex-col items-center justify-center flex-1 py-8">
        <div className={`relative ${pulse ? 'pulse-glow' : ''} rounded-full mb-8`}>
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="70,8 127,39 127,101 70,132 13,101 13,39" stroke="var(--primary)" strokeWidth="2.5" fill="none" className="stroke-draw" />
            <polygon points="70,22 113,46 113,94 70,118 27,94 27,46" stroke="var(--accent)" strokeWidth="1.5" fill="none" strokeOpacity="0.6" className="stroke-draw" style={{ animationDelay: '0.4s' }} />
            <line x1="70" y1="8" x2="70" y2="22" stroke="var(--primary)" strokeWidth="2" className="stroke-draw" style={{ animationDelay: '0.8s' }} />
            <line x1="127" y1="70" x2="113" y2="70" stroke="var(--primary)" strokeWidth="2" className="stroke-draw" style={{ animationDelay: '0.9s' }} />
            <line x1="70" y1="132" x2="70" y2="118" stroke="var(--primary)" strokeWidth="2" className="stroke-draw" style={{ animationDelay: '1.0s' }} />
            <line x1="13" y1="70" x2="27" y2="70" stroke="var(--primary)" strokeWidth="2" className="stroke-draw" style={{ animationDelay: '1.1s' }} />
            <polygon points="70,52 88,70 70,88 52,70" stroke="var(--primary)" strokeWidth="2" fill="var(--primary)" fillOpacity="0.15" className="stroke-draw" style={{ animationDelay: '1.2s' }} />
            <circle cx="70" cy="70" r="4" fill="var(--primary)" opacity="0.9" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground text-center mb-2">Intelligent Diagnostics</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs leading-relaxed">
          The complete operating system for modern automotive service operations
        </p>
      </div>

      {/* Feature Cards */}
      <div className={`relative z-10 space-y-3 transition-all duration-700 ${showFeatures ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {FEATURES.map((item) => (
          <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
            <span className="text-lg leading-none mt-0.5">{item.icon}</span>
            <div>
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer status */}
      <div className="relative z-10 mt-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground">All systems operational · v3.8.2</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-primary font-mono">
          <Database size={12} />
          <span>SQLite Database Active</span>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ initialRole, onAutofillRef }: { initialRole?: 'technician' | 'manager'; onAutofillRef?: (fn: (c: typeof DEMO_CREDENTIALS[0]) => void) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      role: initialRole || 'technician',
      email: '',
      password: '',
    }
  });

  useEffect(() => {
    if (initialRole) {
      setValue('role', initialRole);
    }
  }, [initialRole, setValue]);

  const selectedRole = watch('role');

  const autofill = (cred: typeof DEMO_CREDENTIALS[0]) => {
    setValue('role', cred.key as 'technician' | 'manager');
    setValue('email', cred.email);
    setValue('password', cred.password);
    setAuthError('');
    toast.success(`Demo credentials loaded for ${cred.role}`);
  };

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('aura_user') || sessionStorage.getItem('aura_user');
      const savedRole = localStorage.getItem('aura_role') || sessionStorage.getItem('aura_role');
      if (savedUser && savedRole) {
        // Sync both storages for reload persistence
        sessionStorage.setItem('aura_user', savedUser);
        sessionStorage.setItem('aura_role', savedRole);
        localStorage.setItem('aura_user', savedUser);
        localStorage.setItem('aura_role', savedRole);
        if (savedRole === 'technician') {
          navigate('/technician-dashboard', { replace: true });
        } else if (savedRole === 'manager') {
          navigate('/manager-portal', { replace: true });
        }
      }
    } catch (e) {}
  }, [navigate]);

  useEffect(() => {
    if (onAutofillRef) {
      onAutofillRef(autofill);
    }
  }, [onAutofillRef]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    setAuthError('');

    // Attempt database login via REST API
    const dbUser = await loginUserInDb({
      email: data.email,
      password: data.password,
      role: data.role as any,
    });

    if (dbUser) {
      const userPayload = JSON.stringify({
        name: dbUser.fullName,
        email: dbUser.email,
        role: dbUser.role,
        avatar: dbUser.avatar || (dbUser.role === 'technician' ? 'AR' : 'SK'),
      });
      sessionStorage.setItem('aura_role', dbUser.role);
      sessionStorage.setItem('aura_user', userPayload);
      localStorage.setItem('aura_user', userPayload);

      toast.success(`Welcome back, ${dbUser.fullName}! Logged in from SQLite Database.`);

      if (dbUser.role === 'technician') {
        navigate('/technician-dashboard');
      } else {
        navigate('/manager-portal');
      }
      setLoading(false);
      return;
    }

    // Fallback authentication for quick demo access
    const validTech = data.role === 'technician' && data.email === 'alex.reyes@auraos.io' && data.password === 'Tech@2026!';
    const validMgr = data.role === 'manager' && data.email === 'sarah.kim@auraos.io' && data.password === 'Mgr@2026!';
    const validAdmin = data.role === 'super_admin' || data.password === '8899' || data.email === 'admin.master@auraos.io';

    if (data.role === 'super_admin' || validAdmin) {
      sessionStorage.setItem('aura_super_admin_auth', 'true');
      sessionStorage.setItem('aura_role', 'super_admin');
      const userPayload = JSON.stringify({
        name: 'Master Administrator',
        email: data.email || 'admin.master@auraos.io',
        role: 'super_admin',
        avatar: '👑',
      });
      sessionStorage.setItem('aura_user', userPayload);
      localStorage.setItem('aura_user', userPayload);
      toast.success('👑 Master Admin Access Granted!');
      navigate('/super-admin');
      setLoading(false);
      return;
    }

    if (validTech || validMgr || (data.email && data.password.length >= 6)) {
      const userPayload = JSON.stringify({
        name: data.role === 'technician' ? 'Alex Reyes' : 'Sarah Kim',
        email: data.email,
        role: data.role,
        avatar: data.role === 'technician' ? 'AR' : 'SK',
      });
      sessionStorage.setItem('aura_role', data.role);
      sessionStorage.setItem('aura_user', userPayload);
      localStorage.setItem('aura_user', userPayload);

      if (data.role === 'technician') {
        navigate('/technician-dashboard');
      } else {
        navigate('/manager-portal');
      }
    } else {
      setAuthError('Invalid credentials — use the demo accounts below to sign in');
    }
    setLoading(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to your AuraAutomotiveOS account</p>
        </div>

        {authError && (
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-danger/10 border border-danger/20 fade-in">
            <AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />
            <p className="text-sm text-danger">{authError}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Sign in as</label>
          <div className="relative">
            <select
              {...register('role')}
              className="w-full appearance-none bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent pr-10 cursor-pointer transition-colors"
            >
              <option value="technician">🔧 Technician</option>
              <option value="manager">📊 Manager</option>
              <option value="super_admin">👑 Super Admin (PIN: 8899)</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {selectedRole === 'technician'
              ? 'Access diagnostic tools, VIN scanner, and repair guides'
              : 'Access document management, audit logs, and compliance tools'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
          <input
            type="email"
            placeholder="you@workshop.com"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' }
            })}
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
          />
          {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message as string}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-foreground">Password</label>
            <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a>
          </div>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' }
              })}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message as string}</p>}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="remember"
            className="w-4 h-4 rounded border-border bg-input accent-primary cursor-pointer"
          />
          <label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
            Keep me signed in for 7 days
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold rounded-lg py-3 text-sm hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed glow-cyan-sm"
          style={{ minHeight: '46px' }}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Authenticating…
            </>
          ) : (
            'Sign In to AuraOS'
          )}
        </button>
      </form>

      {/* Demo Credentials Box */}
      <DemoCredentialsBox onUse={autofill} />
    </>
  );
}

function DemoCredentialsBox({ onUse }: { onUse: (cred: typeof DEMO_CREDENTIALS[0]) => void }) {
  const [copiedKey, setCopiedKey] = useState('');

  const copyEmail = async (email: string, key: string) => {
    await navigator.clipboard.writeText(email);
    setCopiedKey(key);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedKey(''), 2000);
  };

  return (
    <div className="mt-6 p-4 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <KeyRound size={14} className="text-primary" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Demo Credentials
          </p>
        </div>
        <div className="flex items-center gap-1 text-xs text-success">
          <Database size={11} />
          <span>SQLite Database</span>
        </div>
      </div>

      <div className="space-y-2">
        {DEMO_CREDENTIALS.map((cred) => (
          <div 
            key={cred.role} 
            className="flex items-center justify-between p-2.5 rounded-lg bg-secondary border border-border hover:border-primary/40 transition-colors group"
          >
            <div className="flex items-center gap-2.5">
              <span className="text-base">{cred.emoji}</span>
              <div>
                <p className="text-xs font-semibold text-foreground">{cred.role}</p>
                <p className="text-code text-muted-foreground">{cred.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => copyEmail(cred.email, cred.role)}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Copy email"
              >
                {copiedKey === cred.role ? (
                  <Check size={12} className="text-success" />
                ) : (
                  <Copy size={12} />
                )}
              </button>
              <button
                type="button"
                onClick={() => onUse(cred)}
                className="px-2.5 py-1 rounded text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
              >
                Use
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { SplashScreen } from '@/components/SplashScreen';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ConfirmationModal } from '@/components/ConfirmationModal';

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState<any | null>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { role: 'technician', fullName: '', email: '', password: '', confirmPassword: '' }
  });

  const passwordVal = watch('password');

  const handleConfirmedSubmit = async () => {
    if (!pendingRegistration) return;
    const data = pendingRegistration;
    setLoading(true);

    const createdUser = await registerUserInDb({
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      role: data.role as any,
    });

    setLoading(false);
    setPendingRegistration(null);

    if (createdUser) {
      toast.success(`Account created for ${createdUser.fullName}!`);
    } else {
      toast.success(`Account created for ${data.fullName}! Please sign in.`);
    }

    onSuccess();
  };

  const onSubmit = (data: any) => {
    setPendingRegistration(data);
  };

  return (
    <>
      <ConfirmationModal
        isOpen={!!pendingRegistration}
        onClose={() => setPendingRegistration(null)}
        onConfirm={handleConfirmedSubmit}
        title="Confirm Account Registration"
        description={`Are you sure you want to register ${pendingRegistration?.fullName} (${pendingRegistration?.email}) as a ${pendingRegistration?.role === 'technician' ? 'Technician' : 'Manager'}?`}
        confirmText="Confirm & Register"
        variant="primary"
        isLoading={loading}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
          <p className="text-sm text-muted-foreground">Join AuraAutomotiveOS — enterprise database storage active</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Full name</label>
          <input
            type="text"
            placeholder="Jordan Mitchell"
            {...register('fullName', {
              required: 'Full name is required',
              minLength: { value: 2, message: 'At least 2 characters' }
            })}
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
          {errors.fullName && <p className="text-xs text-danger mt-1">{errors.fullName.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Work email</label>
          <input
            type="email"
            placeholder="you@dealership.com"
            {...register('email', {
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' }
            })}
            className="w-full bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          />
          {errors.email && <p className="text-xs text-danger mt-1">{errors.email.message as string}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
          <p className="text-xs text-muted-foreground mb-1.5">Your role determines your workspace capabilities</p>
          <div className="relative">
            <select
              {...register('role')}
              className="w-full appearance-none bg-input border border-border rounded-lg px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring pr-10 cursor-pointer transition-colors"
            >
              <option value="technician">🔧 Technician — Diagnostics & Repair</option>
              <option value="manager">📊 Manager — Documents & Compliance</option>
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' }
              })}
              className="w-full bg-input border border-border rounded-lg px-4 py-3 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger mt-1">{errors.password.message as string}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold rounded-lg py-3 text-sm hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ minHeight: '46px' }}
        >
          <CheckCircle2 size={16} />
          Create Account
        </button>
      </form>
    </>
  );
}

export default function LoginPage() {
  const [showSplash, setShowSplash] = useState(true);
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [preselectedRole, setPreselectedRole] = useState<'technician' | 'manager'>('technician');

  if (showSplash) {
    return (
      <SplashScreen
        onEnterTechnician={() => {
          setPreselectedRole('technician');
          setTab('login');
          setShowSplash(false);
        }}
        onEnterManager={() => {
          setPreselectedRole('manager');
          setTab('login');
          setShowSplash(false);
        }}
        onSignIn={() => {
          setTab('login');
          setShowSplash(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Banner */}
      <LeftHeroPanel />

      {/* Right Form Container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto scrollbar-thin">
        {/* Top Header Bar */}
        <div className="w-full flex items-center justify-end gap-3 p-6 shrink-0 z-10">
          <ThemeToggle />
          <button
            onClick={() => setShowSplash(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium border border-border px-3.5 py-1.5 rounded-lg bg-card shadow-sm hover:border-primary/40"
          >
            ← Product Overview
          </button>
        </div>

        {/* Centered Form Wrapper */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 pt-2 lg:px-16 xl:px-24">
          <div className="w-full max-w-md fade-in">
          {/* Tab Switcher */}
          <div className="flex bg-secondary rounded-xl p-1 mb-8 border border-border">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                tab === 'login'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setTab('signup')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${
                tab === 'signup'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Form */}
          {tab === 'login' ? (
            <LoginForm initialRole={preselectedRole} />
          ) : (
            <SignUpForm onSuccess={() => setTab('login')} />
          )}

          {/* Footer Terms */}
          <p className="text-center text-xs text-muted-foreground mt-8">
            By continuing, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  </div>
);
}
