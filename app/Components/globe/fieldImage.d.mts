export const FIELD_LAYERS: Set<string>;
export const FIELD_LAT_TOP: number;
export const FIELD_LAT_BOTTOM: number;
export function buildGrid(events: unknown[], valueOf: (e: any) => number | null | undefined): { cells: Map<string, number>; lats: number[]; lons: number[] };
export function sampleGrid(grid: ReturnType<typeof buildGrid>, lat: number, lon: number): number | null;
export function renderField(opts: {
  events: unknown[];
  valueOf: (e: any) => number | null | undefined;
  colorOf: (v: number) => string | null;
  width?: number;
  latTop?: number;
  latBottom?: number;
  alpha?: number;
}): { width: number; height: number; data: Uint8ClampedArray<ArrayBuffer> };
export function fieldCoordinates(latTop?: number, latBottom?: number): [number, number][];
