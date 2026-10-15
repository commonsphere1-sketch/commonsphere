/**
 * The site's globe, small, on the left of a page's name, as asked: the size of the calendar button, without the site's name.
 * The header's two versions of the globe are used, one for each theme, at the scale the header uses to fill the box.
 */
export function SiteMark({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-block w-9 h-9 shrink-0 overflow-hidden align-middle ${className}`} aria-hidden>
      <img src="https://c.animaapp.com/mnv7exnwOzX3vX/img/uploaded-asset-1776467236633-0.jpeg" alt="" className="logo-light absolute inset-0 w-full h-full object-contain scale-[1.28]" />
      <img src="https://c.animaapp.com/mnv7exnwOzX3vX/img/uploaded-asset-1776467236635-1.jpeg" alt="" className="logo-dark absolute inset-0 w-full h-full object-contain scale-[1.28]" />
    </span>
  );
}
