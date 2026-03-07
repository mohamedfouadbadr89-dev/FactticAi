# Billing Cycle Logic

Facttic supports both Monthly and Annual billing cycles, with significant incentives for annual commitments.

## Discount Calculation

The platform applies a **20% discount** (equivalent to 2 months free) on all usage tiers when the annual billing cycle is selected.

### Pricing Logic
The [PricingSelector.tsx](file:///Users/macbookpro/Desktop/FactticAI/components/billing/PricingSelector.tsx) component handles the arithmetic dynamically.

```typescript
const displayPrice = billingCycle === 'annual' 
  ? Math.floor(selected.price * 0.8) 
  : selected.price;
```

## State Management

The billing frequency is managed as a lifted state in the [Billing Page](file:///Users/macbookpro/Desktop/FactticAI/app/dashboard/billing/page.tsx).

- **Global Toggle**: The `BillingCycleToggle` component allows users to switch between `monthly` and `annual` modes.
- **Sync Mechanism**: The `billingCycle` state is passed down to all three plan cards (Starter, Growth, Scale), ensuring that prices update synchronously across the entire grid.

## UI Implementation

- **Toggle UX**: A pill-shaped selector with smooth CSS transitions.
- **Promotional Badge**: An animated "2 Months Free" badge appears exclusively when annual billing is active to reinforce the value proposition.
- **Contextual Labeling**: Plan cards display a "Billed Annually" sub-label when the 20% discount is applied.

> [!IMPORTANT]
> This is a UI-only configuration. Actual billing cycle changes are synchronized with the backend via the `billing_summaries` table during the subscription update phase.
