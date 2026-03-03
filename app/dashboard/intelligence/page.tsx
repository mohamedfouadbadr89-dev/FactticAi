'use client'

import React from 'react'
import { isFeatureEnabled } from '@/lib/featureFlags'
import { ComingSoonBlock } from '@/components/layout/ComingSoonBlock'


export default function IntelligencePage() {
  if (!isFeatureEnabled('advancedIntelligence')) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 md:p-8">
        <ComingSoonBlock moduleName="Advanced Intelligence" status="RCA_DETERMINISTIC_G1" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8">
      <h1 className="text-2xl font-bold mb-4 text-[var(--text-primary)]">Advanced Intelligence</h1>
      <p className="text-[var(--text-secondary)] text-sm">Next-generation RCA and cognitive drift analysis.</p>
    </div>
  )
}
