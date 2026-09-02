/**
 * Chart export.
 *
 * PNG needs no dependency: Recharts renders SVG, so the chart can be
 * serialised, painted onto a canvas and saved. That is why this works offline
 * and adds nothing to the bundle.
 *
 * PDF is deliberately print-based. A generated PDF would mean pulling in a
 * library such as jsPDF (a few hundred KB) purely to redraw what the browser
 * can already produce; routing through the print dialog gives a real,
 * vector-quality PDF via "Save as PDF" with no dependency and no second
 * rendering path to keep in sync.
 */

/** Pixel ratio for the raster export — 2 keeps text crisp on retina screens. */
const SCALE = 2;

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Saves an <svg> element as a PNG.
 *
 * The clone gets an explicit width/height and a background fill: an SVG with
 * no background rasterises onto transparency, which looks broken pasted into
 * a light document, and Recharts sets its size through CSS rather than
 * attributes so the serialised copy would otherwise have no intrinsic size.
 */
export async function exportSvgAsPng(
  svg: SVGSVGElement,
  filename: string,
  background = "#ffffff",
): Promise<void> {
  const rect = svg.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  if (!clone.getAttribute("viewBox")) {
    clone.setAttribute("viewBox", `0 0 ${width} ${height}`);
  }

  // Inline the resolved text colour. Recharts labels inherit `fill:
  // currentColor` from CSS, which is lost the moment the node leaves the
  // document, so serialising without this yields black-on-black in dark mode.
  const srcText = svg.querySelectorAll("text");
  const dstText = clone.querySelectorAll("text");
  srcText.forEach((node, i) => {
    const fill = getComputedStyle(node).fill;
    if (fill && dstText[i]) dstText[i].setAttribute("fill", fill);
  });

  const svgText = new XMLSerializer().serializeToString(clone);
  const svgUrl =
    "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgText);

  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not rasterise the chart."));
    img.src = svgUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width * SCALE;
  canvas.height = height * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Could not encode the PNG.");

  const url = URL.createObjectURL(blob);
  triggerDownload(
    url,
    filename.endsWith(".png") ? filename : `${filename}.png`,
  );
  // Revoke on the next frame so the click has already been handled.
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

/**
 * Opens the browser's print dialog, from which the user can choose "Save as
 * PDF". `printOnly` on an ancestor lets a page narrow what gets printed.
 */
export function exportAsPdf(): void {
  window.print();
}
