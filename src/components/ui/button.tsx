import React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[11px] font-medium font-sans border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60",
        active:
          "bg-secondary/20 text-secondary border-secondary/40 hover:bg-secondary/30",
        destructive:
          "bg-destructive/15 text-destructive border-destructive/40 hover:bg-destructive/25",
        outline:
          "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-muted/60",
        secondary:
          "bg-muted border-border text-foreground hover:bg-muted/80",
        ghost: "border-transparent bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60",
        link: "border-transparent bg-transparent text-secondary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-3 py-1",
        sm: "px-2.5 py-0.5 text-[10px]",
        lg: "px-4 py-1.5 text-[12px]",
        icon: "h-8 w-8 rounded-full border",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
