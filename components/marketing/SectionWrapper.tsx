"use client";

import React, { ReactNode } from 'react';
import { useScrollReveal } from '@/hooks/useScrollReveal';

interface SectionWrapperProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  headerClassName?: string;
  id?: string;
  showDivider?: boolean | undefined;
  /** Set true for the hero/first section to skip entrance animation (prevents CLS) */
  disableAnimation?: boolean;
}

export function SectionWrapper({
  eyebrow,
  title,
  description,
  children,
  className = "",
  containerClassName = "",
  headerClassName = "",
  id,
  showDivider = false,
  disableAnimation = false,
}: SectionWrapperProps) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();
  const titleId = id ? `${id}-title` : undefined;

  return (
    <section 
      id={id} 
      className={`relative py-12 md:py-16 lg:py-24 ${showDivider ? "border-t border-[var(--border-subtle)]" : ""} ${className}`}
      aria-labelledby={titleId}
    >
      <div
        ref={disableAnimation ? undefined : ref}
        className={`max-w-[1400px] mx-auto px-8 relative space-y-10 ${containerClassName} ${disableAnimation ? '' : 'reveal'} ${disableAnimation || visible ? 'visible' : ''}`}
      >
        {(eyebrow || title || description) && (
          <div className={`${headerClassName}`}>
            {eyebrow && (
              <div className="text-mono text-[var(--accent)] mb-4">
                {eyebrow}
              </div>
            )}
            {title && (
              <h2 id={titleId} className="text-heading text-[var(--text-primary)]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-6 text-body text-[var(--text-secondary)] max-w-2xl">
                {description}
              </p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
