/** Per-100,000-residents social statistics for US states */
export interface SocialStats {
  /** Homeless persons per 100,000 residents */
  homelessnessRate: number;
  /** Incarcerated persons per 100,000 residents */
  incarcerationRate: number;
}

// Countries used to be here too, with a homelessness and an incarceration
// rate each. Incarceration now comes from the World Prison Brief with its date
// (prisonRates.ts). Country homelessness was removed: there is no international
// series to support it, because national definitions differ too much to
// compare.

// ── US States ────────────────────────────────────────────────────────────────
export const STATE_SOCIAL_STATS: Record<string, SocialStats> = {
  al: { homelessnessRate: 6, incarcerationRate: 810 },
  ak: { homelessnessRate: 28, incarcerationRate: 434 },
  az: { homelessnessRate: 14, incarcerationRate: 580 },
  ar: { homelessnessRate: 9, incarcerationRate: 596 },
  ca: { homelessnessRate: 44, incarcerationRate: 340 },
  co: { homelessnessRate: 21, incarcerationRate: 371 },
  ct: { homelessnessRate: 25, incarcerationRate: 238 },
  de: { homelessnessRate: 14, incarcerationRate: 420 },
  fl: { homelessnessRate: 22, incarcerationRate: 486 },
  ga: { homelessnessRate: 8, incarcerationRate: 546 },
  hi: { homelessnessRate: 66, incarcerationRate: 200 },
  id: { homelessnessRate: 9, incarcerationRate: 428 },
  il: { homelessnessRate: 10, incarcerationRate: 376 },
  in: { homelessnessRate: 7, incarcerationRate: 491 },
  ia: { homelessnessRate: 10, incarcerationRate: 376 },
  ks: { homelessnessRate: 7, incarcerationRate: 474 },
  ky: { homelessnessRate: 7, incarcerationRate: 558 },
  la: { homelessnessRate: 9, incarcerationRate: 691 },
  me: { homelessnessRate: 14, incarcerationRate: 192 },
  md: { homelessnessRate: 10, incarcerationRate: 339 },
  ma: { homelessnessRate: 25, incarcerationRate: 176 },
  mi: { homelessnessRate: 9, incarcerationRate: 384 },
  mn: { homelessnessRate: 12, incarcerationRate: 271 },
  ms: { homelessnessRate: 6, incarcerationRate: 686 },
  mo: { homelessnessRate: 9, incarcerationRate: 549 },
  mt: { homelessnessRate: 12, incarcerationRate: 374 },
  ne: { homelessnessRate: 8, incarcerationRate: 434 },
  nv: { homelessnessRate: 29, incarcerationRate: 548 },
  nh: { homelessnessRate: 14, incarcerationRate: 174 },
  nj: { homelessnessRate: 17, incarcerationRate: 228 },
  nm: { homelessnessRate: 18, incarcerationRate: 432 },
  ny: { homelessnessRate: 46, incarcerationRate: 240 },
  nc: { homelessnessRate: 9, incarcerationRate: 383 },
  nd: { homelessnessRate: 8, incarcerationRate: 280 },
  oh: { homelessnessRate: 8, incarcerationRate: 428 },
  ok: { homelessnessRate: 8, incarcerationRate: 654 },
  or: { homelessnessRate: 35, incarcerationRate: 327 },
  pa: { homelessnessRate: 10, incarcerationRate: 335 },
  ri: { homelessnessRate: 19, incarcerationRate: 170 },
  sc: { homelessnessRate: 6, incarcerationRate: 401 },
  sd: { homelessnessRate: 9, incarcerationRate: 457 },
  tn: { homelessnessRate: 8, incarcerationRate: 565 },
  tx: { homelessnessRate: 8, incarcerationRate: 550 },
  ut: { homelessnessRate: 9, incarcerationRate: 221 },
  vt: { homelessnessRate: 20, incarcerationRate: 139 },
  va: { homelessnessRate: 7, incarcerationRate: 341 },
  wa: { homelessnessRate: 22, incarcerationRate: 278 },
  wv: { homelessnessRate: 8, incarcerationRate: 393 },
  wi: { homelessnessRate: 9, incarcerationRate: 325 },
  wy: { homelessnessRate: 10, incarcerationRate: 372 },
};

/** Helper to get social stats for a state (returns null if not found) */
export function getStateSocialStats(id: string): SocialStats | null {
  return STATE_SOCIAL_STATS[id] ?? null;
}
