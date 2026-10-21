import type { Map as MapLibreMap } from 'maplibre-gl';

/** The aircraft icon the live-flight layer draws, rendered once per map. */
export function ensurePlaneIcon(map: MapLibreMap) {
  if (map.hasImage('globe-plane')) return;
  const size = 32;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, size, size);
  ctx.translate(size / 2, size / 2);
  ctx.fillStyle = '#0284c7';
  ctx.strokeStyle = '#f0f9ff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(4, -2);
  ctx.lineTo(12, 2);
  ctx.lineTo(4, 4);
  ctx.lineTo(2, 12);
  ctx.lineTo(0, 6);
  ctx.lineTo(-2, 12);
  ctx.lineTo(-4, 4);
  ctx.lineTo(-12, 2);
  ctx.lineTo(-4, -2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const image = ctx.getImageData(0, 0, size, size);
  map.addImage('globe-plane', image, { pixelRatio: 2 });
}
