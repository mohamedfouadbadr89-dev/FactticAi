# Reporting Module

This module provides an institutional-grade, deterministic reporting engine for the FactticAI Governance platform.

## Architecture

### Centralized Intelligence HQ
To ensure operational clarity, the Report Builder has been consolidated under the **Reports** tab. The redundant "Analysis" page integration has been decommissioned.

### High-Fidelity PDF Engine
The module utilizes a dedicated **Puppeteer-based rendering layer** to transform enriched HTML templates into board-ready PDF documents. All visualizations are rendered server-side to ensure pixel-perfect consistency.

## Components

### ReportBuilder.tsx
A premium, multi-step React component featuring:
- **Motion-Engineered UI**: Fluid transitions and animations powered by `framer-motion`.
- **Institutional Styling**: High-contrast, dark-mode prioritized aesthetic with a shadowed summary side-panel.
- **Contextual Intelligence**: Refined hover-tooltips for all governance dimensions.

### API Endpoints

#### `POST /api/generateReport`
The general-purpose telemetry export endpoint. Supports `csv` and `html` formats.

#### `POST /api/generatePDF` (Dedicated)
Specialized endpoint for high-fidelity PDF generation. 
- **Binary Stream**: Returns a raw PDF Buffer.
- **Audit Logging**: Every export is cryptographically hashed and logged to `public.report_definitions`.

## Implementation Details

### SVG Visualizations
Reports are enriched with server-side SVG infographics, including:
- **Severity Spectrum**: Bar charts depicting risk distribution.
- **Safety Vector**: A polar indicator showing aggregate governance health.

### Usage Example
```tsx
import ReportBuilder from '@/src/reporting/ReportBuilder';

export default function ReportsPage() {
  return (
    <div className="p-10 bg-slate-950 min-h-screen">
      <ReportBuilder />
    </div>
  );
}
```

## Maintenance & Audit
The `public.report_definitions` table maintains a persistent record of all generated reports for regulatory audit.

```sql
-- Audit Schema
CREATE TABLE public.report_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    config JSONB NOT NULL,
    format TEXT NOT NULL CHECK (format IN ('csv', 'pdf', 'html')),
    created_at TIMESTAMPTZ DEFAULT now()
);
```
