import {
  BarChart3,
  LayoutGrid,
  Zap,
  Shield,
  BrainCircuit,
  Activity,
  Network,
  Bell,
  Search,
  PlayCircle,
  TestTube,
  ShieldAlert,
  Bot,
  FileText,
  Webhook,
  ShieldCheck,
  Settings,
  AlertCircle,
  BarChart,
  User,
  CreditCard,
  Mic2
} from "lucide-react";

export type PlanTier = 'starter' | 'growth' | 'scale';

export interface NavItem {
  label: string;
  href: string;
  icon: any;
  id: string;
  /** Minimum plan required. Undefined = available on all plans. */
  minPlan?: PlanTier;
}

export const navGroups: { group: string; items: NavItem[] }[] = [
  {
    group: "OVERVIEW",
    items: [
      { label: "Dashboard",          href: "/dashboard",       icon: BarChart3,   id: "nav-dashboard"          },
      { label: "Executive Overview", href: "/dashboard/home",  icon: LayoutGrid,  id: "nav-executive-overview" },
      { label: "Trust Center",       href: "/dashboard/trust", icon: ShieldCheck, id: "nav-trust-center"       },
    ]
  },
  {
    group: "SETUP",
    items: [
      { label: "Connect AI",  href: "/dashboard/connect",      icon: Zap,          id: "nav-connect-ai"  },
      { label: "Policies",    href: "/dashboard/governance",   icon: Shield,       id: "nav-policies"    },
      { label: "Guardrails",  href: "/dashboard/intelligence", icon: BrainCircuit, id: "nav-guardrails"  },
    ]
  },
  {
    group: "MONITORING",
    items: [
      { label: "Live Monitor",       href: "/dashboard/observability", icon: Activity, id: "nav-live-monitor",       minPlan: 'growth' },
      { label: "Voice Monitor",      href: "/dashboard/voice",         icon: Mic2,     id: "nav-voice-monitor",      minPlan: 'growth' },
      { label: "Drift Intelligence", href: "/dashboard/compliance",    icon: Network,  id: "nav-drift-intelligence", minPlan: 'growth' },
      { label: "Alerts",             href: "/dashboard/alerts",        icon: Bell,     id: "nav-alerts"                                 },
    ]
  },
  {
    group: "ANALYTICS",
    items: [
      { label: "Reports",    href: "/dashboard/reports",    icon: BarChart,    id: "nav-reports"    },
      { label: "Forensics",  href: "/dashboard/forensics",  icon: Search,      id: "nav-forensics",  minPlan: 'growth' },
      { label: "Incidents",  href: "/dashboard/incidents",  icon: AlertCircle, id: "nav-incidents"   },
    ]
  },
  {
    group: "FORENSICS",
    items: [
      { label: "Investigations", href: "/dashboard/investigations", icon: Search,      id: "nav-investigations", minPlan: 'scale'  },
      { label: "Session Replay", href: "/dashboard/replay",         icon: PlayCircle,  id: "nav-session-replay", minPlan: 'growth' },
    ]
  },
  {
    group: "TESTING",
    items: [
      { label: "Simulation Lab",        href: "/dashboard/simulation", icon: TestTube,   id: "nav-simulation-lab",   minPlan: 'growth' },
      { label: "Stress Testing",        href: "/dashboard/testing",    icon: ShieldAlert, id: "nav-stress-testing",  minPlan: 'scale'  },
      { label: "Governance Playground", href: "/dashboard/playground", icon: ShieldCheck, id: "nav-playground"                        },
    ]
  },
  {
    group: "INTEGRATIONS",
    items: [
      { label: "AI Providers", href: "/dashboard/agents",               icon: Bot,     id: "nav-ai-providers" },
      { label: "Webhooks",     href: "/dashboard/settings/integrations", icon: Webhook, id: "nav-webhooks"     },
    ]
  },
  {
    group: "FINANCE",
    items: [
      { label: "Usage",   href: "/dashboard/usage",   icon: Activity,  id: "nav-usage"   },
      { label: "Billing", href: "/dashboard/billing", icon: CreditCard, id: "nav-billing" },
    ]
  },
  {
    group: "SYSTEM",
    items: [
      { label: "Access Control", href: "/dashboard/settings/access", icon: ShieldCheck, id: "nav-access-control" },
      { label: "Settings",       href: "/dashboard/settings",         icon: Settings,    id: "nav-settings"       },
      { label: "Profile",        href: "/dashboard/profile",           icon: User,        id: "nav-profile"        },
    ]
  }
];

/** Tier rank for comparison — higher = more features */
export const TIER_RANK: Record<PlanTier, number> = { starter: 0, growth: 1, scale: 2 };

/** Returns true if the org's current plan meets the minimum required plan. */
export function planAllows(currentPlan: PlanTier, minPlan?: PlanTier): boolean {
  if (!minPlan) return true;
  return TIER_RANK[currentPlan] >= TIER_RANK[minPlan];
}
