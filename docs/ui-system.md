# Facttic UI System: Enterprise Control Grid (v1.0)

## Overview
The Enterprise Control Grid is a deterministic 12-column layout system designed for institutional governance surfaces. It enforces strict regional residency and responsive resilience without utilizing client-side mutation or motion.

## Grid Container
The `GridContainer` component provides a standard wrapper with the following characteristics:
- **Columns**: 12
- **Gutter**: 1.5rem (24px)
- **Max Width**: 1440px
- **Alignment**: Centered

## Panel Base
The `PanelBase` is the atomic structural unit for the grid.

### Props
| Prop | Type | Description |
|------|------|-------------|
| `title` | `Node` | Institutional label for the panel. |
| `statusNode` | `Node` | Top-right status indicator slot. |
| `footer` | `Node` | Bottom slot for metadata or small actions. |
| `span` | `3\|4\|6\|12` | Column span (responsive fallback). |
| `density` | `'command'\|'executive'` | Padding and spacing density. |

### Density Modes
- **Executive**: High padding (1.5rem), designed for readability and executive oversight.
- **Command**: Reduced padding (0.75rem), designed for high-density technical analysis.

## Breakpoints
- **Desktop (1440px+)**: Standard 12-column grid.
- **Tablet (768px - 1024px)**: 3/4-col panels expand to 6-col.
- **Mobile (<768px)**: All panels stack into 12-col.

## Information Hierarchy
The dashboard utilizes an Information Hierarchy Engine to determine panel rendering order and visual weight.

### Priority Tiers
| Tier | Priority | Category | Visual Weight (Span) |
|------|----------|----------|----------------------|
| **Tier 1** | Critical | Governance Health, Risk | 12 Columns |
| **Tier 2** | Analytical | Trends, Drift, Distributions | 6 Columns |
| **Tier 3** | Operational | Sessions, Billing, Concurrency | 4 Columns |
| **Tier 4** | Informational| Logs, Secondary Telemetry | 3 Columns |

### Alert Surface Layer
The **StickyAlertZone** is a high-priority structural overlay positioned at the top of the viewport. It handles risk escalations and integrity violations. When active, it forces critical context onto the user before any analytical data is consumed.

## Role-Based Perspectives
The dashboard enforces deterministic perspectives based on the authenticated user's role. Manual layout overrides are decommissioned to maintain institutional governance.

### Role Mapping
| Role | Perspective | Spacing Density | Intent |
|------|-------------|-----------------|--------|
| `owner` | Executive | Executive (1.5rem) | High-level oversight and strategic health. |
| `admin` | Command | Command (0.75rem) | Deep technical audit and pipeline telemetry. |
| `member`| Command | Command (0.75rem) | Operational monitoring and drift analysis. |
| `viewer`| Executive | Executive (1.5rem) | Read-only structural integrity overview. |

### Perspective Binding
Perspectives are bound at the layout level. Changing perspectives requires a session-level role transition, preventing ad-hoc layout manipulation in institutional environments.

## Visual Language Standard
The dashboard utilizes a deterministic visual encoding system to represent risk and system status. This ensures that visual signals are consistent across all institutional interfaces.

### Risk Color Mapping
| Risk Level | Visual Encoding | Intent |
|------------|-----------------|--------|
| `LOW` | Emerald-500 (#10b981) | Stable system state. |
| `MEDIUM` | Amber-500 (#f59e0b) | Neutral state requiring monitoring. |
| `HIGH` | Orange-500 (#f97316) | Drift detected within margin. |
| `CRITICAL`| Red-500 (#ef4444) | Immediate alert or integrity violation. |

### Typography Scale
Standardized type tokens ensure structural hierarchy and readability.
- **HEADING_LG**: Primary view titles (1.5rem, Semi-Bold).
- **METRIC_XL**: High-impact metrics (2.25rem, Bold).
- **LABEL_SM**: Support labels and status tags (0.75rem, All-Caps).
- **MONO_AUDIT**: Technical logs and deterministic hashes (0.8125rem, Mono).

### Status Components
The **StatusBadge** is the atomic indicator for all system health signals. It maps directly to the `riskColorMap` tokens.

## Surface Composition V1 (Hybrid Control Surface)
The dashboard is structured as a Hybrid Control Surface, enforcing a deterministic 12-column layout across all perspectives.

### Layout Hierarchy
The surface is divided into three functional layers:
1. **Row 1: Control Layer (12 cols)**: Aggregated governance signals (Health, Risk, Drift, Isolation).
2. **Row 2: Analytical Layer (3x 4 cols)**: Statistical depth (Trends, Distributions, Comparisons).
3. **Row 3: Operational Layer (2x 6 cols)**: Capacity and integrity metrics (Concurrency, Billing).

### Thematic Binding
Perspectives are bound to specific themes and densities to optimize for the intended user role:
- **Executive Mode (Light)**: `f8fafc` background, high whitespace (2rem padding), summarized metrics. Active for `owner` and `viewer` roles.
- **Command Mode (Dark)**: `020617` background, high density (0.75rem padding), inline telemetry visible. Active for `admin` and `member` roles.

## Surface Density V2 Geometry
The dashboard surface is hardened with a centered 1440px constraint to ensure visual stability and prevent "horizontal drift" on ultra-wide displays.

### Geometry Constraints
| Element | Rule | Spec |
|---------|------|------|
| **Container Width** | Max-Width | 1440px |
| **Centering** | Alignment | `margin: 0 auto` |
| **Grid Occupation** | Horizontal | Full 12-column span |
| **Desktop Padding** | Horizontal | 32px (2rem) |
| **Gutter** | Inter-panel | 24px (1.5rem) |

### Top System Status Strip
A persistent, monochromatic utility strip located at the absolute top of the viewport.
- **Tokens**: `ENV`, `REGION`, `TELEMETRY`, `SYNC`, `VERSION`
- **Aesthetic**: Low-contrast, high-utility technical metadata.

### Governance Hero Panel V2
The primary 12-column actor in the dashboard.
- **Primary Metric**: Health Score (Large).
- **Secondary Metrics**: Drift, Isolation, Risk (Inline).
- **Contextual Data**: Embedded Sparkline Trend.

## Interaction & Signal Layer V1
Deterministic micro-interactions are used to provide tactile feedback and signal "live" system state.

### Motion Profiles
| Profile | Target | Duration | Easing | Properties |
|---------|--------|----------|--------|------------|
| **Executive** | Calm | 240ms | `easeInOut` | Opacity, Y-Transform |
| **Command** | Sharp | 160ms | `circOut` | Opacity, Y-Transform |

### Key Interactions
1. **Panel Elevation**: Subtle 4px lift on hover to indicate focus.
2. **Signal Pulsing**: 2s cycle opacity pulse (0.4 -> 1.0) for live telemetry indicators.
3. **State Interpolation**: Smooth color shifting for risk level transitions to prevent visual jarring.
4. **Drift Bloom**: 200ms monochromatic glow (`0 0 15px`) upon metric threshold breach.

### Performance Lock
- All animations MUST be GPU-accelerated.
- Layered animations are prohibited (no nested motion wrappers).
- Motion is strictly tied to React state changes.

## Explainability & Trace Layer V1
The dashboard transforms raw telemetry into inspectable governance signals via dual-layer explainability.

### Hover Insight (Tier 1)
Lightweight tooltips for immediate context on metrics.
- **Formula**: Human-readable governance logic.
- **Sample Size**: Count of sessions/events computed.
- **Freshness**: ISO timestamp of last verification.
- **Confidence**: Deterministic label (e.g., HIGH_STRETCH).

### Trace Drawer (Tier 2)
Side-car drawer providing forensic depth for any major panel.
- **Data Source**: Originating system (e.g., AGENT_TELEMETRY_v4).
- **Computation Boundary**: Regional or cluster isolation scope.
- **Integrity Hash**: SHA-256 slice of the signed payload.
- **Isolation Proof**: Confirmation of RLS/Org boundary enforcement.

### Design Tone
| Mode | Voice | Density |
|------|-------|---------|
| **Executive** | Oversight-focused | High Whitespace, Logic Summary |
| **Command** | Technical-variant | High Density, Boundary Metadata |

## Structured RCA Layer V1

The Structured Root Cause Analysis (RCA) engine decomposes turn-level risk into deterministic attribution factors.

### Attribution Factors
| Factor | Type | Description |
|--------|------|-------------|
| **Hallucination**| `hallucination`| Faithfulness to underlying source data. |
| **Boundary** | `boundary` | Adherence to regional and organizational constraints. |
| **Tone** | `tone` | Compliance with institutional voice and safety guidelines. |

### Visual Encoding (RCA Breakdown)
The RCA Breakdown is rendered as a stacked or grouped horizontal bar chart with weighted intensities.

- **Command View**: Displays absolute weights (e.g., `0.32`) and technical telemetry links for each factor.
- **Executive View**: Displays summarized logic (e.g., "Hallucination Risk: MEDIUM") and high-level attribution.

### Real-Time Signal (Streaming)
Risk signals are streamed via SSE (`text/event-stream`) to ensure zero-latency reactivity without UI polling. 
- **Protocol**: Single downstream event source per active session.
- **Constraint**: No layout shift allowed during signal ingestion; use opacity transitions and fixed-height containers.
