# Changelog

## [5.0.0] - 2026-02-24
### Added
- **Role-Based Perspective Engine**: Deterministic dashboard layout binding to user roles (`owner`, `admin`, `member`, `viewer`).
- **Executive Perspective**: Optimized layout for high-level oversight (1.5rem density).
- **Command Perspective**: Optimized layout for technical analysis (0.75rem density).
- **Institutional Enforcement**: Manual view toggling decommissioned to prevent layout drift.
- **Perspective Metadata**: UI now reflects active perspective mode and user role in the header context.

### Added (Visual Language Standard v1.0)
- Implemented `riskColorMap` for deterministic risk encoding.
- Implemented `typographyScale` for standardized hierarchy.
- Created `StatusBadge` atomic component.
- Applied consistent visual encoding across all dashboard panels.

- Developed `Interaction & Signal Layer V1` for deterministic micro-interactions.
- Activated `Explainability & Trace Layer V1` with dual-mode insights (Hover + Trace Drawer).
- Implemented perspective-aware forensic data depth (Executive vs Command).
- Enforced zero-chatter performance constraints for UI explainability.

### Added (Interaction & Signal Layer V1)
- Integrated `framer-motion` for institutional micro-interactions.
- Implemented perspective-aware Panel Hover Elevation (Executive: 240ms, Command: 160ms).
- Added State-driven Risk Color Interpolation and Telemetry Pulsing.
- Implemented Drift Spike Bloom (Ambient Highlight) and Sparkline Hover crosshair.

### Added (Surface Density V2 - Geometry Hardening)
- Enforced 1440px centered container for visual stability.
- Implemented persistent Top System Status Strip (ENV/REGION/TELEMETRY).
- Redesigned Governance Hero Panel with embedded Sparkline Trend and Metric Dominance.
- Optimized vertical scroll depth with refined padding tokens (32px desktop).

### Added (Surface Composition V1 - Hybrid Control Surface)
- Implemented mandatory 12-column grid architecture (12, 4/4/4, 6/6 layout).
- Activated Role-Based Thematic Binding (Executive-Light vs Command-Dark).
- Unified Governance Control panel (Row 1) for aggregated oversight.
- Standardized Analytical and Operational panels (Rows 2 & 3).
- Implemented `MetricBlock` for standardized internal panel metrics.

### Fixed
- Structural hierarchy enforcement for T1-T4 panels across all perspectives.
