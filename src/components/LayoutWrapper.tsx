'use client';

import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

interface LayoutWrapperProps {
  children: React.ReactNode;
  pageTitle: string;
  role: 'technician' | 'manager';
  activeNav: string;
  onNavClick?: (id: string) => void;
}

export const LayoutWrapper: React.FC<LayoutWrapperProps> = ({
  children,
  pageTitle,
  role,
  activeNav,
  onNavClick,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavClick = (id: string) => {
    setMobileOpen(false);
    if (onNavClick) onNavClick(id);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header
        pageTitle={pageTitle}
        role={role}
        onMenuToggle={() => {
          if (window.innerWidth < 1024) {
            setMobileOpen(!mobileOpen);
          } else {
            setCollapsed(!collapsed);
          }
        }}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-20 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed lg:relative z-30 lg:z-auto
            h-[calc(100vh-64px)] top-16 lg:top-0
            bg-surface border-r border-border
            flex flex-col
            sidebar-transition overflow-hidden
            ${collapsed ? 'w-16' : 'w-64'}
            ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            transition-transform lg:transition-none
          `}
        >
          <Sidebar
            role={role}
            collapsed={collapsed}
            activeNav={activeNav}
            onNavClick={handleNavClick}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto scrollbar-thin transition-all duration-300">
          <div className="max-w-screen-2xl mx-auto px-4 lg:px-6 xl:px-8 2xl:px-10 py-6">
            {children}
          </div>
        </main>
      </div>

      <Footer role={role} />
    </div>
  );
};
