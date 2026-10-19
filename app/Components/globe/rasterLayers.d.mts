export interface RasterSpec {
  id: string;
  tiles: string[];
  tileSize?: number;
  maxzoom?: number;
  opacity?: number;
  attribution?: string;
  time?: number;
}
export const RAINVIEWER_INDEX: string;
export const RADAR_REFRESH_MS: number;
export function radarRaster(index: unknown): RasterSpec | null;
export function satelliteRasters(): RasterSpec[];
export function activeRasters(enabled: Record<string, boolean> | undefined, radarIndex: unknown): RasterSpec[];
