/**
 * Institutional Surface Architecture Contract (v6.0)
 * 
 * CORE PRINCIPLE: Domain Isolation.
 * Defines strict boundaries between different surface layers of the application.
 */
export const SURFACE_CHANNELS = {
  CORE: 'CORE_GOVERNANCE',
  TRUST_GATEWAY: 'TRUST_GATEWAY',
  PUBLIC: 'PUBLIC_SURFACE',
  DASHBOARD: 'DASHBOARD_SURFACE',
  SALES: 'SALES_SURFACE'
} as const;

export type SurfaceChannel = typeof SURFACE_CHANNELS[keyof typeof SURFACE_CHANNELS];

/**
 * Validates if a component is accessing data from an authorized surface channel.
 */
export function validateSurfaceAccess(source: SurfaceChannel, target: SurfaceChannel): boolean {
  const allowedTransitions: Record<SurfaceChannel, SurfaceChannel[]> = {
    [SURFACE_CHANNELS.CORE]: [SURFACE_CHANNELS.TRUST_GATEWAY],
    [SURFACE_CHANNELS.TRUST_GATEWAY]: [SURFACE_CHANNELS.PUBLIC, SURFACE_CHANNELS.DASHBOARD, SURFACE_CHANNELS.SALES],
    [SURFACE_CHANNELS.PUBLIC]: [],
    [SURFACE_CHANNELS.DASHBOARD]: [],
    [SURFACE_CHANNELS.SALES]: []
  };

  return allowedTransitions[source]?.includes(target) ?? false;
}
