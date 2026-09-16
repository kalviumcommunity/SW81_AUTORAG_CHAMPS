'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-between w-14 h-8 p-1 rounded-full bg-secondary border border-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${className}`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
      aria-label="Toggle dark/light theme"
    >
      <Sun size={14} className={`text-amber-500 z-10 transition-opacity ${isDark ? 'opacity-40' : 'opacity-100'}`} />
      <Moon size={14} className={`text-slate-300 z-10 transition-opacity ${isDark ? 'opacity-100' : 'opacity-40'}`} />

      <motion.div
        className="absolute top-1 left-1 w-6 h-6 rounded-full bg-card shadow-md border border-border flex items-center justify-center"
        animate={{ x: isDark ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );
};
