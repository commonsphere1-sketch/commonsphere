/**
 * The colour a division's card lights in when pointed at: its own flag's, where one is held
 * (data/subnationFlagColors.ts), lightened where too dark to show on the page, as the States page has it;
 * its country's where none is.
 */
import { SUBNATION_FLAG_COLOR } from "../data/subnationFlagColors";
import { flagColor, seen } from "./flagColor";

export function divisionColor(cc: string, name: string): string | undefined {
  const own = SUBNATION_FLAG_COLOR[cc]?.[name];
  return own ? seen(own) : (flagColor(cc) ?? undefined);
}
