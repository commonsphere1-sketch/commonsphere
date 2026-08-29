import { useEffect, useRef } from "react";

interface GlobeWidgetProps {
  isLight: boolean;
}

const COUNTRY_LABELS = [
  "United States",
  "China",
  "Germany",
  "France",
  "United Kingdom",
  "Japan",
  "India",
  "Brazil",
  "Canada",
  "Australia",
  "Russia",
  "South Korea",
  "Italy",
  "Spain",
  "Mexico",
  "Indonesia",
  "Netherlands",
  "Saudi Arabia",
  "Turkey",
  "Switzerland",
  "Argentina",
  "Sweden",
  "Nigeria",
  "Egypt",
  "South Africa",
  "Norway",
  "Poland",
  "Iran",
  "Thailand",
  "Ukraine",
  "Chile",
  "Pakistan",
  "Colombia",
  "Israel",
  "Philippines",
  "New Zealand",
  "Singapore",
  "Malaysia",
  "Vietnam",
  "Bangladesh",
];

export function GlobeWidget({ isLight }: GlobeWidgetProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const stateRef = useRef({
    rotY: 0.4,
    rotX: -0.3,
    isDragging: false,
    prevX: 0,
    prevY: 0,
    velX: 0,
    velY: 0.004,
    orbitAngle: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    /* ── helpers ── */
    const rot3D = (
      x: number,
      y: number,
      z: number,
      rx: number,
      ry: number,
    ): [number, number, number] => {
      // rotate around X axis
      const y1 = y * Math.cos(rx) - z * Math.sin(rx);
      const z1 = y * Math.sin(rx) + z * Math.cos(rx);
      // rotate around Y axis
      const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
      const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
      return [x2, y1, z2];
    };

    const project = (
      x3: number,
      y3: number,
      _z3: number,
      cx: number,
      cy: number,
      R: number,
    ): [number, number] => {
      // simple orthographic projection scaled by R
      return [cx + x3 * R, cy - y3 * R];
    };

    const spherePt = (
      lat: number,
      lon: number,
      rx: number,
      ry: number,
      cx: number,
      cy: number,
      R: number,
    ) => {
      const phi = (lat * Math.PI) / 180;
      const theta = (lon * Math.PI) / 180;
      const x = Math.cos(phi) * Math.cos(theta);
      const y = Math.sin(phi);
      const z = Math.cos(phi) * Math.sin(theta);
      const [rx3, ry3, rz3] = rot3D(x, y, z, rx, ry);
      return { pt: project(rx3, ry3, rz3, cx, cy, R), z: rz3 };
    };

    /* ── resize canvas ── */
    const resize = () => {
      const parent = canvas.parentElement!;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* ── pointer events ── */
    const s = stateRef.current;

    const onDown = (e: PointerEvent) => {
      s.isDragging = true;
      s.prevX = e.clientX;
      s.prevY = e.clientY;
      s.velX = 0;
      s.velY = 0;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!s.isDragging) return;
      const dx = e.clientX - s.prevX;
      const dy = e.clientY - s.prevY;
      s.velY = dx * 0.005;
      s.velX = dy * 0.005;
      s.rotY += s.velY;
      s.rotX += s.velX;
      s.rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, s.rotX));
      s.prevX = e.clientX;
      s.prevY = e.clientY;
    };
    const onUp = () => {
      s.isDragging = false;
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    /* ── draw ── */
    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);

      if (!s.isDragging) {
        s.velX *= 0.92;
        s.velY = s.velY * 0.92 + 0.0008;
        s.rotX += s.velX;
        s.rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, s.rotX));
        s.rotY += s.velY;
      }
      s.orbitAngle += 0.0008;

      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const R = Math.min(W, H) * 0.38;

      const accentBase = isLight ? [30, 80, 200] : [80, 140, 255];

      /* ── draw wireframe lines ── */
      const LATS = 18; // lines of latitude
      const LONS = 24; // lines of longitude
      const STEPS = 120;

      // We need to know, for each line segment, whether it's on the near or far side
      // Near side (z > 0 after rotation) = brighter, Far side = dimmer

      /* Latitude circles */
      for (let i = 0; i <= LATS; i++) {
        const lat = -90 + (i / LATS) * 180;
        const phi = (lat * Math.PI) / 180;

        // collect points
        const pts: { x: number; y: number; z: number }[] = [];
        for (let j = 0; j <= STEPS; j++) {
          const lon = -180 + (j / STEPS) * 360;
          const theta = (lon * Math.PI) / 180;
          const x0 = Math.cos(phi) * Math.cos(theta);
          const y0 = Math.sin(phi);
          const z0 = Math.cos(phi) * Math.sin(theta);
          const [rx3, ry3, rz3] = rot3D(x0, y0, z0, s.rotX, s.rotY);
          const [px, py] = project(rx3, ry3, rz3, cx, cy, R);
          pts.push({ x: px, y: py, z: rz3 });
        }

        // Draw as segments with alpha based on z-depth
        for (let j = 0; j < pts.length - 1; j++) {
          const zAvg = (pts[j].z + pts[j + 1].z) / 2;
          // z in [-1,1]; front face (z > 0) = opaque, back face fades
          const alpha = isLight
            ? zAvg > 0
              ? 0.55 + zAvg * 0.3
              : 0.08 + (zAvg + 1) * 0.1
            : zAvg > 0
              ? 0.5 + zAvg * 0.35
              : 0.05 + (zAvg + 1) * 0.08;
          ctx.beginPath();
          ctx.moveTo(pts[j].x, pts[j].y);
          ctx.lineTo(pts[j + 1].x, pts[j + 1].y);
          ctx.strokeStyle = `rgba(${accentBase[0]},${accentBase[1]},${accentBase[2]},${alpha.toFixed(3)})`;
          ctx.lineWidth = zAvg > 0 ? 0.8 : 0.5;
          ctx.stroke();
        }
      }

      /* Longitude circles */
      for (let i = 0; i < LONS; i++) {
        const lon = -180 + (i / LONS) * 360;
        const theta = (lon * Math.PI) / 180;

        const pts: { x: number; y: number; z: number }[] = [];
        for (let j = 0; j <= STEPS; j++) {
          const lat = -90 + (j / STEPS) * 180;
          const phi = (lat * Math.PI) / 180;
          const x0 = Math.cos(phi) * Math.cos(theta);
          const y0 = Math.sin(phi);
          const z0 = Math.cos(phi) * Math.sin(theta);
          const [rx3, ry3, rz3] = rot3D(x0, y0, z0, s.rotX, s.rotY);
          const [px, py] = project(rx3, ry3, rz3, cx, cy, R);
          pts.push({ x: px, y: py, z: rz3 });
        }

        for (let j = 0; j < pts.length - 1; j++) {
          const zAvg = (pts[j].z + pts[j + 1].z) / 2;
          const alpha = isLight
            ? zAvg > 0
              ? 0.55 + zAvg * 0.3
              : 0.08 + (zAvg + 1) * 0.1
            : zAvg > 0
              ? 0.5 + zAvg * 0.35
              : 0.05 + (zAvg + 1) * 0.08;
          ctx.beginPath();
          ctx.moveTo(pts[j].x, pts[j].y);
          ctx.lineTo(pts[j + 1].x, pts[j + 1].y);
          ctx.strokeStyle = `rgba(${accentBase[0]},${accentBase[1]},${accentBase[2]},${alpha.toFixed(3)})`;
          ctx.lineWidth = zAvg > 0 ? 0.8 : 0.5;
          ctx.stroke();
        }
      }

      /* ── orbiting country labels ── */
      const COUNT = COUNTRY_LABELS.length;
      // Two tilted elliptical orbits at different radii and inclinations
      const orbits = [
        { rx: R * 1.38, ry: R * 0.38, tilt: -0.28, speed: 1.0, offset: 0 },
        { rx: R * 1.52, ry: R * 0.3, tilt: 0.35, speed: -0.7, offset: Math.PI },
        {
          rx: R * 1.44,
          ry: R * 0.22,
          tilt: 0.6,
          speed: 0.5,
          offset: Math.PI * 0.7,
        },
      ];

      const fontSize = Math.max(13, Math.min(17, W * 0.028));
      ctx.font = `600 ${fontSize}px 'DM Sans', sans-serif`;

      COUNTRY_LABELS.forEach((name, idx) => {
        const orbitIdx = idx % orbits.length;
        const orb = orbits[orbitIdx];
        const posInOrbit = Math.floor(idx / orbits.length);
        const totalInOrbit = Math.ceil(COUNT / orbits.length);
        const baseAngle =
          orb.offset + (posInOrbit / totalInOrbit) * Math.PI * 2;
        const angle = baseAngle + s.orbitAngle * orb.speed;

        // Ellipse point
        const ex = Math.cos(angle) * orb.rx;
        const ey = Math.sin(angle) * orb.ry;

        // Apply tilt around X axis
        const ey2 = ey * Math.cos(orb.tilt);
        const ez = ey * Math.sin(orb.tilt);

        // Perspective depth cue: labels behind the plane are dimmer
        const depthFactor = 1 + ez / (R * 2); // [0.5 .. 1.5]
        const labelX = cx + ex;
        const labelY = cy + ey2;

        // Fade out labels that are "behind" (ez < 0) — partial fade
        const baseAlpha = isLight ? 1.0 : 1.0;
        const alpha = Math.max(0.25, baseAlpha * ((ez + R * 2) / (R * 4)));
        const scale = 0.72 + 0.28 * depthFactor;

        ctx.save();
        ctx.translate(labelX, labelY);
        ctx.scale(scale, scale);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        // Subtle glow / shadow
        ctx.shadowBlur = 8;
        ctx.shadowColor = isLight
          ? `rgba(30,80,200,${alpha * 0.6})`
          : `rgba(80,140,255,${alpha * 0.9})`;

        ctx.fillStyle = isLight
          ? `rgba(20,60,180,${alpha})`
          : `rgba(160,210,255,${alpha})`;
        ctx.fillText(name, 0, 0);

        // Small dot connector
        ctx.shadowBlur = 0;
        ctx.fillStyle = isLight
          ? `rgba(40,100,220,${alpha * 0.7})`
          : `rgba(100,180,255,${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      /* ── thin orbit path rings (ellipses as arcs) ── */
      orbits.forEach((orb) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, Math.cos(orb.tilt));
        ctx.beginPath();
        ctx.ellipse(
          0,
          0,
          orb.rx,
          orb.ry / Math.max(0.01, Math.abs(Math.cos(orb.tilt))),
          0,
          0,
          Math.PI * 2,
        );
        ctx.strokeStyle = isLight
          ? "rgba(30,80,200,0.07)"
          : "rgba(80,140,255,0.08)";
        ctx.lineWidth = 0.6;
        ctx.stroke();
        ctx.restore();
      });
    };

    draw();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [isLight]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: "100%",
        height: "100%",
        cursor: "grab",
        touchAction: "none",
        display: "block",
      }}
    />
  );
}
