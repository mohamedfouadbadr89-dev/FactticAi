/**
 * Institutional Typography Scale v1.0
 * 
 * Standardized typography tokens for the Enterprise Dashboard.
 */

export const TYPOGRAPHY_SCALE = {
  HEADING_LG: {
    fontSize: '1.5rem',
    fontWeight: '600',
    letterSpacing: '-0.025em',
    lineHeight: '2rem'
  },
  HEADING_MD: {
    fontSize: '1.25rem',
    fontWeight: '600',
    letterSpacing: '-0.025em',
    lineHeight: '1.75rem'
  },
  METRIC_XL: {
    fontSize: '2.25rem',
    fontWeight: '700',
    letterSpacing: '-0.05em',
    lineHeight: '2.5rem'
  },
  BODY_DEFAULT: {
    fontSize: '0.875rem',
    fontWeight: '400',
    letterSpacing: '0',
    lineHeight: '1.25rem'
  },
  LABEL_SM: {
    fontSize: '0.75rem',
    fontWeight: '600',
    letterSpacing: '0.05em',
    lineHeight: '1rem',
    textTransform: 'uppercase' as const
  },
  MONO_AUDIT: {
    fontSize: '0.8125rem',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontWeight: '400',
    lineHeight: '1.2rem'
  }
} as const;

export type TypographyToken = keyof typeof TYPOGRAPHY_SCALE;
