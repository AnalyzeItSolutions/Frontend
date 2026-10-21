/** Camera easing for fly-to: an eased glide that settles with a slight overshoot. */
export function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Slight overshoot so the camera settles instead of stopping dead. */
export function easeOutBackSoft(t: number) {
  const c1 = 1.18;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function flyEase(t: number) {
  if (t < 0.82) return easeInOutCubic(t / 0.82) * 0.97;
  return 0.97 + easeOutBackSoft((t - 0.82) / 0.18) * 0.03;
}
