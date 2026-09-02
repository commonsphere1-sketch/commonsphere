import React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { CaretDown, CaretUp, Check } from "@phosphor-icons/react";

export interface StyledSelectOption {
  value: string;
  label: string;
}

/**
 * A select whose dropdown matches the site rather than the operating system.
 *
 * A native <select> can be styled at rest, but the list it opens is drawn by
 * the OS and takes no CSS at all — so on this site the closed control looked
 * right and the open list did not. Radix renders the list as ordinary
 * elements, which is what makes the panel styleable, and keeps the keyboard
 * behaviour and screen-reader semantics the native control gave for free.
 */
export function StyledSelect({
  value,
  onValueChange,
  options,
  ariaLabel,
  triggerClassName = "",
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: StyledSelectOption[];
  ariaLabel?: string;
  triggerClassName?: string;
}) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        aria-label={ariaLabel}
        className={`flex items-center gap-1 bg-transparent text-xs font-mono text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded cursor-pointer shrink-0 transition-colors ${triggerClassName}`}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon asChild>
          <CaretDown size={10} weight="bold" className="opacity-70" />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="dropdown-glass z-50 min-w-[12rem] max-h-72 overflow-hidden rounded-xl border animate-fade-in"
        >
          <SelectPrimitive.ScrollUpButton className="flex items-center justify-center py-1 text-muted-foreground">
            <CaretUp size={10} weight="bold" />
          </SelectPrimitive.ScrollUpButton>

          <SelectPrimitive.Viewport className="p-1">
            {options.map((o) => (
              <SelectPrimitive.Item
                key={o.value}
                value={o.value}
                className="relative flex items-center gap-2 pl-7 pr-3 py-1.5 rounded-lg text-xs font-mono text-foreground cursor-pointer select-none outline-none data-[highlighted]:bg-secondary/20 data-[highlighted]:text-foreground data-[state=checked]:text-secondary transition-colors"
              >
                <SelectPrimitive.ItemIndicator className="absolute left-2 flex items-center">
                  <Check size={11} weight="bold" />
                </SelectPrimitive.ItemIndicator>
                <SelectPrimitive.ItemText>{o.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>

          <SelectPrimitive.ScrollDownButton className="flex items-center justify-center py-1 text-muted-foreground">
            <CaretDown size={10} weight="bold" />
          </SelectPrimitive.ScrollDownButton>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
