import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { HeroSection } from '@/components/marketing/HeroSection';

// Below-fold sections: lazy loaded to prioritize hero FCP/LCP
const SystemOverview = dynamic(() => import('@/components/marketing/SystemOverview').then(m => ({ default: m.SystemOverview })));
const ArchitectureMatrix = dynamic(() => import('@/components/marketing/ArchitectureMatrix').then(m => ({ default: m.ArchitectureMatrix })));
const ExecutiveDashboardPreview = dynamic(() => import('@/components/marketing/ExecutiveDashboardPreview').then(m => ({ default: m.ExecutiveDashboardPreview })));
const SecuritySection = dynamic(() => import('@/components/marketing/SecuritySection').then(m => ({ default: m.SecuritySection })));
const ComplianceSnapshot = dynamic(() => import('@/components/marketing/ComplianceSnapshot').then(m => ({ default: m.ComplianceSnapshot })));
const DeploymentGrid = dynamic(() => import('@/components/marketing/DeploymentGrid').then(m => ({ default: m.DeploymentGrid })));

export default function MarketingPage() {
  return (
    <>
      <HeroSection />
      <Suspense>
        <SystemOverview />
        <ArchitectureMatrix />
        <ExecutiveDashboardPreview />
        <SecuritySection />
        <ComplianceSnapshot />
        <DeploymentGrid />
      </Suspense>
    </>
  );
}
