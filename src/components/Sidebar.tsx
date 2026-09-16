'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wrench, 
  Bot, 
  Settings, 
  HelpCircle, 
  ChevronRight, 
  LayoutDashboard, 
  BookOpen, 
  ShieldAlert, 
  FileCheck 
} from 'lucide-react';

interface SidebarProps {
  role: 'technician' | 'manager';
  collapsed: boolean;
  activeNav: string;
  onNavClick: (id: string) => void;
}

const TECH_NAV = [
  { id: 'session', label: 'Start Session', icon: Wrench, href: '/technician-dashboard', badge: null },
  { id: 'diagnostic', label: 'Diagnostic Hub', icon: Bot, href: '/technician-dashboard', badge: '3' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/technician-dashboard', badge: null },
  { id: 'support', label: 'Support Center', icon: HelpCircle, href: '/support', badge: '1' },
];

const MGR_NAV = [
  { id: 'session', label: 'Start Session', icon: Wrench, href: '/manager-portal', badge: null },
  { id: 'command', label: 'Command Center', icon: LayoutDashboard, href: '/manager-portal', badge: '2' },
  { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen, href: '/manager-portal', badge: null },
  { id: 'audit', label: 'Audit Panel', icon: ShieldAlert, href: '/manager-portal', badge: '5' },
  { id: 'compliance', label: 'Compliance', icon: FileCheck, href: '/manager-portal', badge: null },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/manager-portal', badge: null },
  { id: 'support', label: 'Support Center', icon: HelpCircle, href: '/support', badge: null },
];

export const Sidebar: React.FC<SidebarProps> = ({ role, collapsed, activeNav, onNavClick }) => {
  const items = role === 'technician' ? TECH_NAV : MGR_NAV;
  const isManager = role === 'manager';

  return (
    <motion.nav 
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className="flex flex-col h-full py-4 px-2 gap-1 overflow-hidden select-none bg-[#1c1c1c] text-white border-r border-neutral-800"
    >
      {!collapsed && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 px-3 mb-2"
        >
          {isManager ? 'Manager Workspace' : 'Technician Workspace'}
        </motion.p>
      )}

      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeNav === item.id;

        return (
          <Link
            key={item.id}
            to={item.href}
            onClick={() => onNavClick(item.id)}
            className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
              isActive
                ? 'bg-[#dc9750] text-white font-bold shadow-md'
                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
            title={collapsed ? item.label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && (
              <>
                <span className="text-sm flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                    isActive ? 'bg-black/30 text-white' : 'bg-[#dc9750]/20 text-[#dc9750]'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="text-white/80 shrink-0" />}
              </>
            )}

            {collapsed && item.badge && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#dc9750]" />
            )}

            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#1c1c1c] border border-neutral-700 rounded-lg text-xs font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                {item.label}
                {item.badge && (
                  <span className="ml-2 font-bold text-[#dc9750]">
                    {item.badge}
                  </span>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </motion.nav>
  );
};
