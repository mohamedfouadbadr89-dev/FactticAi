'use client'

import React from 'react'
import { isFeatureEnabled } from '@/lib/featureFlags'
import { ComingSoonBlock } from '@/components/layout/ComingSoonBlock'


export default function CompliancePage() {
  if (!isFeatureEnabled('complianceLayer')) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 md:p-8">
        <ComingSoonBlock moduleName="Compliance Layer" status="SOC2_CONTINUOUS_v1" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Compliance Layer</h1>
      <p className="text-neutral-500 text-sm">Deterministic audit journals and institutional evidence locker.</p>
    </div>
  )
}
