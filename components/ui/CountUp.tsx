'use client';

import React, { useEffect, useState, useRef } from 'react';

interface CountUpProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  suffix?: string;
}

export function CountUp({ value, decimals = 0, duration = 600, className = '', suffix = '' }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const displayValueRef = useRef(value);
  const prevValueRef = useRef(value);
  const requestRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (value === prevValueRef.current) {
      return;
    }

    const startValue = displayValueRef.current;
    const endValue = value;
    const change = endValue - startValue;

    const animate = (time: number) => {
      if (startTimeRef.current === undefined) {
        startTimeRef.current = time;
      }

      const progress = time - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);
      
      // smooth easeOutQuint behavior for premium feel
      const easeOut = 1 - Math.pow(1 - percentage, 5);
      const currentVal = startValue + change * easeOut;

      setDisplayValue(currentVal);
      displayValueRef.current = currentVal;

      if (progress < duration) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
        displayValueRef.current = endValue;
        prevValueRef.current = endValue;
        startTimeRef.current = undefined;
      }
    };

    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
    
    startTimeRef.current = undefined;
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [value, duration]);

  // Hydration mismatch prevention isn't strictly necessary since displayValue initializes to the exact prop value, 
  return (
    <span className={className}>
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
