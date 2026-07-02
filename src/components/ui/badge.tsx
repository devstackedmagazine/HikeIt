import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/cn"

const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 border-2 px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "bg-forest text-summit border-forest",
        secondary: "bg-mist text-forest border-mist",
        destructive: "bg-danger text-summit border-danger",
        outline: "bg-transparent text-forest border-forest",
        ghost: "border-transparent text-forest hover:bg-mist",
        link: "border-0 text-forest underline-offset-4 hover:underline",
        easy: "bg-moss text-abyss border-moss",
        moderate: "bg-alert text-abyss border-alert",
        hard: "bg-sunset text-summit border-sunset",
        expert: "bg-danger text-summit border-danger",
        verified: "bg-forest text-moss border-forest",
        warning: "bg-alert text-abyss border-alert",
        danger: "bg-danger text-summit border-danger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

export { Badge, badgeVariants }
