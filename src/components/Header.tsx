'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  Menu, 
  Bell, 
  ChevronDown, 
  ShieldCheck, 
  User, 
  LogOut 
} from 'lucide-react';
import { AppLogo } from './AppLogo';
import { UserProfileModal } from './UserProfileModal';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  pageTitle: string;
  role: 'technician' | 'manager';
  onMenuToggle: () => void;
}

export const Header: React.FC<HeaderProps> = ({ pageTitle, role, onMenuToggle }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [user, setUser] = useState({
    name: 'User',
    email: '',
    role: role,
    avatar: role === 'technician' ? 'AR' : 'SK',
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = sessionStorage.getItem('aura_user') || localStorage.getItem('aura_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    sessionStorage.clear();
    localStorage.removeItem('aura_user');
    localStorage.removeItem('aura_role');
    navigate('/');
  };

  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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
      setLogoClicks(0);
      navigate('/super-admin');
      return;
    }

    clickTimeoutRef.current = setTimeout(() => {
      setLogoClicks(0);
    }, 3000);
  };

  return (
    <>
      <header className="sticky top-0 z-40 h-16 bg-surface border-b border-border flex items-center px-4 gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <div
          onClick={handleLogoClick}
          className="flex items-center gap-2.5 mr-4 cursor-pointer select-none group"
          title="Triple-click for Secret Super Admin Access"
        >
          <AppLogo size={32} onClick={() => {}} />
          <span className="font-bold text-sm tracking-tight hidden sm:block group-hover:text-primary transition-colors">
            Aura<span className="text-gradient-cyan">OS</span>
          </span>
        </div>

        <div className="flex-1 flex items-center gap-6">
          <div>
            <h1 className="text-sm font-bold text-white truncate">{pageTitle}</h1>
            <p className="text-xs text-neutral-400 hidden sm:block">
              {role === 'technician' ? 'Technician Workspace' : 'Management Oversight'}
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-neutral-300 ml-4 border-l border-neutral-700 pl-4">
            <button 
              onClick={() => navigate('/technician-dashboard')} 
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              Diagnostic Hub
            </button>
            <button 
              onClick={() => navigate('/manager-portal')} 
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              Knowledge Base
            </button>
            <button 
              onClick={() => navigate('/support')} 
              className="hover:text-primary transition-colors flex items-center gap-1.5"
            >
              Support Center
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{user.avatar}</span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-foreground leading-tight">{user.name}</p>
                <p className="text-xs text-muted-foreground leading-tight capitalize">{role}</p>
              </div>
              <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-xl z-50 fade-in overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-semibold text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email || `${user.avatar.toLowerCase()}@auraos.io`}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <ShieldCheck size={11} className="text-primary" />
                    <span className="text-xs text-primary font-medium capitalize">{role} Access</span>
                  </div>
                </div>

                <div className="py-1">
                  {user.role === 'super_admin' && (
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/super-admin');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-bold text-danger hover:bg-danger/10 transition-colors"
                    >
                      <ShieldCheck size={14} className="text-danger" />
                      👑 Super Admin Portal
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setDropdownOpen(false);
                      setProfileModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <User size={14} className="text-muted-foreground" />
                    Profile & Station Credentials
                  </button>
                </div>

                <div className="border-t border-border py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        onSignOut={handleSignOut}
        user={user}
      />
    </>
  );
};
