'use client';

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Server } from 'lucide-react';

export const Footer: React.FC<{ role: 'technician' | 'manager' }> = ({ role }) => {
  return (
    <footer className="border-t border-border bg-surface px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>© 2026 AuraAutomotiveOS. All rights reserved.</span>
        <div className="hidden sm:flex items-center gap-3">
          <a href="#" onClick={(e) => { e.preventDefault(); alert("AuraOS Enterprise Privacy Policy: Data is stored securely in local SQLite database."); }} className="hover:text-foreground transition-colors">Privacy Policy</a>
          <span>·</span>
          <a href="#" onClick={(e) => { e.preventDefault(); alert("AuraOS Terms of Service: Authorized technician and manager diagnostic use only."); }} className="hover:text-foreground transition-colors">Terms of Service</a>
          <span>·</span>
          <Link to="/support" className="hover:text-foreground transition-colors text-primary font-medium">Support Center</Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span>Session Active</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck size={11} className="text-success" />
          <span>Secure Connection</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Server size={11} className="text-primary" />
          <span className="capitalize">{role} Mode</span>
        </div>
      </div>
    </footer>
  );
};
