export type WidgetLike = Record<string, any> & { id: string };
export interface Table { columns: string[]; rows: unknown[][] }
export interface DateRange { from: Date | null; to: Date | null }
export interface DateFilterState { preset: string; from: string; to: string }
export const DATE_PRESETS: { id: string; label: string }[];
export interface CatalogField { key: string; label: string; kind: 'text' | 'textarea' | 'number' | 'select'; required?: boolean; placeholder?: string; options?: string[]; default?: string; min?: number; max?: number }
export interface CatalogEntry { type: string; label: string; description: string; fields: CatalogField[]; build: (id: string, values: Record<string, any>) => WidgetLike }
export const WIDGET_CATALOG: CatalogEntry[];
export function formDefaults(entry: CatalogEntry): Record<string, string>;
export function validateWidgetForm(entry: CatalogEntry, values: Record<string, any>): Record<string, string>;
export function extractTable(widget: unknown): Table | null;
export function tableToCsv(columns: unknown[], rows: unknown[][]): string;
export function csvFilename(title?: string, fallback?: string): string;
export function resolveDateRange(preset: string, now?: Date, custom?: { from?: string; to?: string }): DateRange;
export function parseDate(value: unknown): Date | null;
export function inRange(date: Date, range: DateRange): boolean;
export function isDateFilterable(widget: unknown): boolean;
export function applyDateRange<T>(widget: T, range: DateRange): T;
export function loadDateFilter(storage: Pick<Storage, 'getItem'> | null | undefined, projectId?: string): DateFilterState;
export function saveDateFilter(storage: Pick<Storage, 'setItem'> | null | undefined, projectId: string | undefined, filter: DateFilterState): void;
export function moveIndex(from: number, to: number, length: number): { from: number; to: number } | null;
export function reorder<T>(items: T[], from: number, to: number): T[];
export function objectTableWidget(id: string, projectId: string, objectApiName: string, label?: string): WidgetLike;
export function newWidgetId(prefix?: string): string;

export interface ChartKind { type: string; label: string; hint: string; groups: boolean; dateGroup?: boolean }
export interface ChartMetric { id: string; label: string; needsField: boolean }
export interface ChartField { api_name: string; label: string; type: string }
export interface ChartForm { kind: string; groupBy?: string; metric: string; field?: string; bucket?: string; title?: string }
export const CHART_KINDS: ChartKind[];
export const CHART_METRICS: ChartMetric[];
export const NUMERIC_FIELD_TYPES: string[];
export const DATE_FIELD_TYPES: string[];
export const BUCKETS: string[];
export function chartFieldChoices(schema: { fields?: ChartField[] } | null | undefined, kind: string): { groupable: ChartField[]; numeric: ChartField[] };
export function validateChartForm(schema: { fields?: ChartField[] } | null | undefined, form: ChartForm): Record<string, string>;
export function objectChartWidget(id: string, projectId: string, schema: { api_name: string; label: string; label_plural?: string; fields?: ChartField[] }, form: ChartForm): WidgetLike;
