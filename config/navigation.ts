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

export const navGroups = [
  {
    group: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: BarChart3, id: "nav-dashboard" },
      { label: "Executive Overview", href: "/dashboard/home", icon: LayoutGrid, id: "nav-executive-overview" },
      { label: "Trust Center", href: "/dashboard/trust", icon: ShieldCheck, id: "nav-trust-center" },
    ]
  },
  {
    group: "SETUP",
    items: [
      { label: "Connect AI", href: "/dashboard/connect", icon: Zap, id: "nav-connect-ai" },
      { label: "Policies", href: "/dashboard/governance", icon: Shield, id: "nav-policies" },
      { label: "Guardrails", href: "/dashboard/intelligence", icon: BrainCircuit, id: "nav-guardrails" },
    ]
  },
  {
    group: "MONITORING",
    items: [
      { label: "Live Monitor", href: "/dashboard/observability", icon: Activity, id: "nav-live-monitor" },
      { label: "Voice Monitor", href: "/dashboard/voice", icon: Mic2, id: "nav-voice-monitor" },
      { label: "Drift Intelligence", href: "/dashboard/compliance", icon: Network, id: "nav-drift-intelligence" },
      { label: "Alerts", href: "/dashboard/alerts", icon: Bell, id: "nav-alerts" },
    ]
  },
  {
    group: "ANALYTICS",
    items: [
      { label: "Reports", href: "/dashboard/reports", icon: BarChart, id: "nav-reports" },
      { label: "Live Report", href: "/dashboard/forensics/live-report", icon: FileText, id: "nav-live-report" },
      { label: "Forensics", href: "/dashboard/forensics", icon: Search, id: "nav-forensics" },
      { label: "Incidents", href: "/dashboard/incidents", icon: AlertCircle, id: "nav-incidents" },
    ]
  },
  {
    group: "FORENSICS",
    items: [
      { label: "Investigations", href: "/dashboard/investigations", icon: Search, id: "nav-investigations" },
      { label: "Session Replay", href: "/dashboard/replay", icon: PlayCircle, id: "nav-session-replay" },
    ]
  },
  {
    group: "TESTING",
    items: [
      { label: "Simulation Lab", href: "/dashboard/simulation", icon: TestTube, id: "nav-simulation-lab" },
      { label: "Stress Testing", href: "/dashboard/testing", icon: ShieldAlert, id: "nav-stress-testing" },
      { label: "Governance Playground", href: "/dashboard/playground", icon: ShieldCheck, id: "nav-playground" },
    ]
  },
  {
    group: "INTEGRATIONS",
    items: [
      { label: "AI Providers", href: "/dashboard/agents", icon: Bot, id: "nav-ai-providers" },
      { label: "Webhooks", href: "/dashboard/settings/integrations", icon: Webhook, id: "nav-webhooks" },
    ]
  },
  {
    group: "FINANCE",
    items: [
      { label: "Usage", href: "/dashboard/usage", icon: Activity, id: "nav-usage" },
      { label: "Billing", href: "/dashboard/billing", icon: CreditCard, id: "nav-billing" },
    ]
  },
  {
    group: "SYSTEM",
    items: [
      { label: "Access Control", href: "/dashboard/settings/access", icon: ShieldCheck, id: "nav-access-control" },
      { label: "Settings", href: "/dashboard/settings", icon: Settings, id: "nav-settings" },
      { label: "Profile", href: "/dashboard/profile", icon: User, id: "nav-profile" },
    ]
  }
];
