/**
 * FACTTIC GLOBAL DESIGN SYSTEM
 * 
 * Strict architectural rule: All future UI pages, dashboard overlays, intelligence 
 * plugins, and components MUST map against these static structural bounds. 
 * Do NOT hardcode ad-hoc hexadecimal values natively into files. Re-use 
 * standard semantic variables globally.
 */

export const FactticDesign = {
  // Core Surfaces
  background: '#0a0a0a',     // Primary application background
  panel: '#111111',          // Main dashboard cards and overlays
  panelHover: '#1a1a1a',     // Hover state for interactive cards
  surface: '#222222',        // Elevated inner surface layers
  border: '#2d2d2d',         // Consistent divider stroke

  // Semantic Signals
  primary: '#3b82f6',        // Action blue
  primaryHover: '#2563eb',
  success: '#10b981',        // Policy passing / Integrity / Resolution
  warning: '#f59e0b',        // Drift / Anomaly warnings
  critical: '#ef4444',       // Failures / Escalations / Danger
  
  // Text Hierarchies
  textPrimary: '#ffffff',    // Heads, Active values
  textSecondary: '#9ca3af',  // Subtext, Axis labels, De-emphasized metadata
  textMuted: '#4b5563',      // Disabled, Background watermarks

  // Structural Spacing Tokens mapped against Tailwind bounds internally
  layout: {
    dashboardPadding: 'p-6 md:p-8',
    cardPadding: 'p-6',
    cardRadius: 'rounded-2xl',
    cardShadow: 'shadow-sm',
    panelBorder: 'border border-[#2d2d2d]',
  }
};
