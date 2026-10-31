export interface AskState {
  selected?: { lat: number; lon: number; name?: string; country?: string } | null;
  /** The selection is a live pin (a quake, a fire cell, a flight), not a place. */
  selectedIsEvent?: boolean;
  compare?: Array<{ lat: number; lon: number; name?: string; country?: string }>;
  layers?: Record<string, boolean>;
  layerCounts?: Record<string, number | undefined>;
  days?: number;
}
export function activeLayerSummary(
  layers: Record<string, boolean> | undefined,
  layerCounts: Record<string, number | undefined> | undefined,
): Array<{ id: string; label: string; count: number }>;
export function globeAskMessage(question: string, state?: AskState): string;
export function askSuggestions(state?: AskState): string[];
export function clampAnswer(text: string, max?: number): string;
export function stripGlobeEcho(text: string): string;
export function placesFromText(text: string): Array<{ name: string; lat: number; lon: number }>;
export function flyTargetFromText(text: string): string | null;
