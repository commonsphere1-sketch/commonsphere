/**
 * The site's logo, as the user gave it: a globe drawn in lines, black on the light theme and white on the dark. The two files
 * are the user's two images, each cropped square about the globe (which fills 94% of the square, as the old logo filled its
 * box once scaled), with its ground made clear so the globe sits on the page's own ground - in static/brand.
 */
export const LOGO_LIGHT = "/brand/logo-light.png";
export const LOGO_DARK = "/brand/logo-dark.png";

/** The logo's two versions, one for each theme, filling a box the caller sizes. */
export function LogoImages({ alt = "" }: { alt?: string }) {
  return (
    <>
      <img src={LOGO_LIGHT} alt={alt} className="logo-light absolute inset-0 w-full h-full object-contain" />
      <img src={LOGO_DARK} alt={alt} className="logo-dark absolute inset-0 w-full h-full object-contain" />
    </>
  );
}

/**
 * The site's globe, small, on the left of a page's name, as asked: the size of the calendar button, without the site's name.
 */
export function SiteMark({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-block w-9 h-9 shrink-0 overflow-hidden align-middle ${className}`} aria-hidden>
      <LogoImages />
    </span>
  );
}
