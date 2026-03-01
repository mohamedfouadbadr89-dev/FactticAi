'use client'

import React from 'react'
import { isFeatureEnabled } from '@/lib/featureFlags'
import { ComingSoonBlock } from '@/components/layout/ComingSoonBlock'


export default function BillingPage() {
  if (!isFeatureEnabled('billingForecast')) {
    return (
      <div className="w-full max-w-7xl mx-auto p-6 md:p-8">
        <ComingSoonBlock moduleName="Billing & Forecast" status="QUOTA_ENGINE_v1" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8">
      <h1 className="text-2xl font-bold mb-4">Billing & Forecast</h1>
      <p className="text-neutral-500 text-sm">Institutional quota management and consumption forecasting.</p>
    </div>
  )
}
