'use client';

import React from 'react';

export const ECUPinoutSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-auto' }) => (
  <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Base PCB Board Layer */}
    <rect x="20" y="20" width="280" height="160" rx="16" fill="var(--secondary)" stroke="var(--border)" strokeWidth="2" />
    
    {/* Microprocessor Core Chip */}
    <rect x="110" y="60" width="100" height="80" rx="8" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2" />
    <circle cx="160" cy="100" r="14" fill="var(--primary)" fillOpacity="0.15" stroke="var(--primary)" strokeWidth="1.5" />
    <path d="M152 100L168 100M160 92L160 108" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
    
    {/* Traces & Bus Lines */}
    <path d="M40 70H110M40 100H110M40 130H110" stroke="var(--muted-foreground)" strokeWidth="2" strokeDasharray="4 4" />
    <path d="M210 70H280M210 100H280M210 130H280" stroke="var(--primary)" strokeWidth="2" />
    
    {/* Terminal Connector Pins */}
    <circle cx="40" cy="70" r="4" fill="var(--accent)" />
    <circle cx="40" cy="100" r="4" fill="var(--success)" />
    <circle cx="40" cy="130" r="4" fill="var(--info)" />
    
    <circle cx="280" cy="70" r="4" fill="var(--primary)" />
    <circle cx="280" cy="100" r="4" fill="var(--primary)" />
    <circle cx="280" cy="130" r="4" fill="var(--primary)" />

    {/* Labels */}
    <text x="160" y="156" textAnchor="middle" fill="var(--foreground)" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
      OEM ECU ENGINE CONTROL MODULE
    </text>
  </svg>
);

export const BatteryIsolationSVG: React.FC<{ className?: string }> = ({ className = 'w-full h-auto' }) => (
  <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* HV Battery Casing */}
    <rect x="30" y="30" width="260" height="140" rx="14" fill="var(--surface)" stroke="var(--border)" strokeWidth="2" />
    
    {/* Battery Cells */}
    {[50, 95, 140, 185, 230].map((x, i) => (
      <g key={i}>
        <rect x={x} y="55" width="35" height="70" rx="4" fill="var(--secondary)" stroke="var(--primary)" strokeWidth="1.5" />
        <rect x={x + 10} y="47" width="15" height="8" rx="2" fill="var(--accent)" />
        <line x1={x + 17.5} y1="65" x2={x + 17.5} y2="115" stroke="var(--primary)" strokeWidth="2" strokeDasharray="3 3" />
      </g>
    ))}

    {/* Safety Disconnect Cable */}
    <path d="M40 150H280" stroke="var(--success)" strokeWidth="3" />
    <text x="160" y="165" textAnchor="middle" fill="var(--success)" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
      HIGH VOLTAGE ISOLATION PASSED (&gt; 500kΩ)
    </text>
  </svg>
);
