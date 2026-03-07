# Pricing Configuration Documentation

Facttic uses a centralized configuration layer to manage pricing plans and usage tiers. This ensures that pricing logic is consistent across the API and the UI.

## Configuration File

The source of truth is located at [pricing.ts](file:///Users/macbookpro/Desktop/FactticAI/config/pricing.ts).

### Structure

The configuration is organized by **Plan** (Starter, Growth, Scale), where each plan contains multiple **Tiers** based on interaction volume.

```typescript
export const pricingConfig = {
  plan_id: {
    name: "Plan Name",
    tiers: [
      { interactions: 10000, price: 39 },
      // ...
    ]
  }
}
```

## How Pricing Works

1.  **Tier Selection**: Users select a specific tier (interaction limit) within a plan.
2.  **Dynamic Calculation**: The UI uses the `getAllTiers()` helper to flatten all plans into a single list for the dropdown selector.
3.  **API Synchronization**: The `/api/dashboard/billing/plan` endpoint consumes the same configuration to report available options to the frontend.

## Updating Prices or Tiers

To change a price or add a new usage limit:

1.  Modify the `pricingConfig` object in `config/pricing.ts`.
2.  The changes will automatically propagate to:
    - The **Pricing Selector** dropdown.
    - The **Billing Overview** page thresholds.
    - The **API response** for plan management.

> [!NOTE]
> This configuration layer is for UI display and reporting only. Backend enforcement remains managed by the `billing_summaries` table in Supabase.
