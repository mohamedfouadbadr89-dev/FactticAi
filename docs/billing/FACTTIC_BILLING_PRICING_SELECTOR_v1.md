# Pricing Dropdown Selector

The **Pricing Dropdown Selector** is a dynamic React component that allows users to adjust their governance interaction tiers. It provides instant visual feedback on pricing, enabling frictionless scaling of Facttic's AI interceptors.

## Integration Logic

The component utilizes a centralized configuration and React state to ensure data integrity and responsiveness.

### Centralized Source of Truth
The selector imports all available tiers from [pricing.ts](file:///Users/macbookpro/Desktop/FactticAI/config/pricing.ts). This ensures that any update to the pricing configuration instantly propagates to all UI instances.

```typescript
import { getAllTiers } from '@/config/pricing';
const TIERS = getAllTiers().map(...);
```

### Reactive State Management
We use the `useState` hook to track the `selectedId`. When the user interacts with the `<select>` element, the state is updated, triggering a re-render that calculates and displays the new price instantly.

```typescript
const [selectedId, setSelectedId] = useState(defaultId);
const selected = TIERS.find(t => t.id === selectedId);
```

### Interaction Patterns
- **Simplified Labels**: Tiers are formatted for readability (e.g., "50k interactions", "1M interactions").
- **Visual Weight**: The selected price is rendered with a large, tracking-tighter font to provide clarity during the selection process.
- **Dynamic Context**: The plan level (Starter, Growth, Scale) is contextually displayed alongside the price.

## Usage Guide
This component is embedded in the [Billing Page](file:///Users/macbookpro/Desktop/FactticAI/app/dashboard/billing/page.tsx) to provide a self-service scaling experience for organization admins.

> [!TIP]
> To add a new tier, simply append it to the `pricingConfig` in `config/pricing.ts`. The selector will automatically detect it and render the new option in the next build.
