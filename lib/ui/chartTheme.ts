import { FactticDesign } from './designSystem';

/**
 * FACTTIC RECHARTS THEME
 * 
 * Consistent data visualization mapping for Recharts LineCharts, AreaCharts, and BarCharts.
 * All Intelligence metrics must bind natively to these explicitly defined bounds.
 */

export const FactticChartTheme = {
  // Line & Area Strokes
  policy: FactticDesign.success,          // #10b981
  drift: FactticDesign.critical,          // #ef4444
  confidence: FactticDesign.primary,      // #3b82f6
  warning: FactticDesign.warning,         // #f59e0b
  hallucination: '#8b5cf6',               // Unique Purple signature for Systemic Hallucinations 

  // Axis Geometry
  axisTick: FactticDesign.textSecondary,
  cartesianStroke: '#333333',
  cartesianDashArray: '3 3',

  // Shared Tooltip Styling
  tooltipStyle: {
    backgroundColor: FactticDesign.panel,
    borderColor: '#333333',
    color: FactticDesign.textPrimary,
    borderRadius: '8px',
  },
  
  // Shared Legend Mappings
  legendStyle: {
    color: FactticDesign.textSecondary,
    fontSize: '12px',
  }
};
