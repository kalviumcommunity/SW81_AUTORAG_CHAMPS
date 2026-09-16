'use client';

import React from 'react';

interface AppLogoProps {
  size?: number;
  className?: string;
  onClick?: () => void;
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 44, className = '', onClick }) => {
  return (
    <div 
      className={`flex items-center ${onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} ${className}`}
      onClick={onClick}
    >
      <div 
        className="flex-shrink-0 bg-primary/20 border border-primary/40 rounded-xl flex items-center justify-center font-bold text-primary"
        style={{ width: size, height: size }}
      >
        <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      </div>
    </div>
  );
};
