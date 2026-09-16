'use client';

import React, { useState } from 'react';
import { animated, useSpring } from '@react-spring/web';

interface SpringButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
}

export const SpringButton: React.FC<SpringButtonProps> = ({ children, className = '', onClick, ...props }) => {
  const [pressed, setPressed] = useState(false);

  const springs = useSpring({
    transform: pressed ? 'scale(0.96)' : 'scale(1)',
    config: { tension: 400, friction: 25 },
  });

  return (
    <animated.button
      style={springs}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onClick={onClick}
      className={className}
      {...(props as any)}
    >
      {children}
    </animated.button>
  );
};
