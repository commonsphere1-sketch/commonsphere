/**
 * Douglas-Peucker line simplification, shared by the geometry build scripts.
 *
 * Tolerance is in degrees, because every source these scripts read is
 * unprojected lon/lat. At the maps page's deepest zoom a pixel is about 0.05
 * degrees, so a tolerance of 0.02 keeps every line within half a pixel of its
 * 1:10m source. Endpoints are never dropped, so a simplified border still
 * meets the coast and a simplified ring still closes.
 *
 * Extracted from build-admin1-borders.cjs so build-map-layers.cjs uses the same
 * implementation rather than a copy that could drift from it.
 */

/**
 * @param {[number, number][]} points
 * @param {number} tol tolerance in degrees
 * @returns {[number, number][]} the kept points, endpoints always included
 */
function simplify(points, tol) {
  if (points.length < 3) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [x1, y1] = points[a];
    const [x2, y2] = points[b];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let far = -1;
    let farDist = tol;
    for (let i = a + 1; i < b; i++) {
      const [x, y] = points[i];
      const t = len2 ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / len2)) : 0;
      const d = Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
      if (d > farDist) {
        farDist = d;
        far = i;
      }
    }
    if (far >= 0) {
      keep[far] = 1;
      stack.push([a, far], [far, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/**
 * Simplifies a closed ring. A ring that loses too many points stops being a
 * polygon, so anything left with fewer than 4 positions (3 distinct plus the
 * repeated first) is reported as empty for the caller to drop.
 *
 * @param {[number, number][]} ring
 * @param {number} tol
 * @returns {[number, number][]} the simplified ring, or [] if it collapsed
 */
function simplifyRing(ring, tol) {
  const out = simplify(ring, tol);
  if (out.length < 4) return [];
  // Douglas-Peucker keeps both endpoints, so a ring that arrived closed leaves
  // closed; this guards the case where the source ring was not closed.
  const [fx, fy] = out[0];
  const [lx, ly] = out[out.length - 1];
  if (fx !== lx || fy !== ly) out.push([fx, fy]);
  return out;
}

module.exports = { simplify, simplifyRing };
