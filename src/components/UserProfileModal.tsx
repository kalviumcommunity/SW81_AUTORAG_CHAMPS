'use client';

import React from 'react';
import { User, ShieldCheck, Mail, MapPin, Key, LogOut, X, CheckCircle2 } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  user: {
    name: string;
    email: string;
    role: string;
    avatar: string;
  };
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onSignOut,
  user,
}) => {
  if (!isOpen) return null;

  const isTech = user.role === 'technician';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm fade-in">
      <div 
        className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center text-primary text-xl font-bold font-mono">
            {user.avatar}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{user.name}</h3>
            <p className="text-xs text-muted-foreground">{user.email || `${user.avatar.toLowerCase()}@auraos.io`}</p>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mt-1 capitalize">
              <ShieldCheck size={12} />
              {user.role} Workspace
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-border pt-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <MapPin size={14} className="text-primary" />
              <span>Assigned Station</span>
            </div>
            <span className="font-semibold text-foreground">{isTech ? 'Bay #4 - Main Service Center' : 'HQ Field Operations Command'}</span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Key size={14} className="text-primary" />
              <span>Security Clearance</span>
            </div>
            <span className="font-semibold text-success flex items-center gap-1">
              <CheckCircle2 size={12} /> Level {isTech ? '2 (Technician)' : '4 (Manager)'} Authorized
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <Mail size={14} className="text-primary" />
              <span>Session Status</span>
            </div>
            <span className="font-semibold text-foreground font-mono">JWT Bearer Active (24h)</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-danger hover:bg-danger/10 border border-danger/20 rounded-xl transition-colors"
          >
            <LogOut size={14} />
            Sign Out
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
