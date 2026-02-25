/**
 * Sovereign Region Configuration (v4.7)
 */
export const SUPPORTED_REGIONS = {
  US_EAST_1: 'us-east-1',
  EU_WEST_1: 'eu-west-1',
  AP_SOUTHEAST_1: 'ap-southeast-1',
} as const;

export type RegionID = typeof SUPPORTED_REGIONS[keyof typeof SUPPORTED_REGIONS];

export const CURRENT_REGION: RegionID = (process.env.REGION_ID as RegionID) || SUPPORTED_REGIONS.US_EAST_1;

export const isSovereignRegion = (regionId: string): regionId is RegionID => {
  return Object.values(SUPPORTED_REGIONS).includes(regionId as any);
};
