// The one function the globe widget uses (turns world-atlas's TopoJSON into GeoJSON); the package ships no types.
declare module 'topojson-client' {
  export function feature(topology: unknown, object: unknown): object;
}
