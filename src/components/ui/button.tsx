import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 border-2 border-transparent font-body text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-100 outline-none select-none focus-visible:ring-2 focus-visible:ring-forest focus-visible:ring-offset-1 active:translate-y-px disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-forest text-summit border-forest hover:bg-abyss hover:border-abyss",
        outline:
          "bg-transparent text-forest border-forest hover:bg-forest hover:text-summit",
        secondary: "bg-mist text-forest border-mist hover:border-forest",
        ghost:
          "bg-transparent text-forest border-transparent hover:bg-mist hover:border-mist",
        destructive:
          "bg-danger text-summit border-danger hover:bg-red-900 hover:border-red-900",
        accent: "bg-sunset text-summit border-sunset hover:bg-orange-700 hover:border-orange-700",
        moss: "bg-moss text-abyss border-moss hover:bg-pine hover:text-summit hover:border-pine",
        link: "border-0 text-forest underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6",
        xs: "h-7 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 px-4 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "size-10",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  nativeButton,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      render={render}
      // When rendered as a non-<button> element (e.g. a Link via `render`),
      // base-ui needs `nativeButton={false}` to drop native button semantics.
      nativeButton={nativeButton ?? (render ? false : undefined)}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
