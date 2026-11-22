/**
 * The hover of a list's rows, as the Commodities card's on the Dashboard, as asked: lit in the row's colour when pointed at -
 * a tint, a fine edge and a soft glow - set above its neighbours so the glow is not cut. `--row` is the colour. The Data
 * Explorer's rows and tabs have it, and the button of a banner's sources.
 */
export const ROW_GLOW =
  "relative transition-[background-color,box-shadow] duration-200 hover:z-[1] hover:bg-[color-mix(in_srgb,var(--row)_12%,transparent)] hover:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--row)_40%,transparent),0_0_14px_-4px_var(--row)]";
