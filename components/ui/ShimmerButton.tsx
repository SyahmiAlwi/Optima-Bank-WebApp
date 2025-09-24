import React, { type CSSProperties, type ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/utils"

export interface ShimmerButtonProps extends ComponentPropsWithoutRef<"button"> {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
  className?: string
  children?: React.ReactNode
  asChild?: boolean
}

export const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#ffffff",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "100px",
      background = "rgba(0, 0, 0, 1)",
      className,
      children,
      asChild = false,
      ...props
    },
    ref,
  ) => {
    const shimmerStyles = {
      "--spread": "90deg",
      "--shimmer-color": shimmerColor,
      "--radius": borderRadius,
      "--speed": shimmerDuration,
      "--cut": shimmerSize,
      "--bg": background,
    } as CSSProperties;

    const shimmerClasses = cn(
      "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white [background:var(--bg)] [border-radius:var(--radius)]",
      "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
      className,
    );

    const shimmerContent = (
      <>
        {/* spark container - Smooth rotating shimmer */}
        <div className={cn("-z-30 blur-[2px]", "absolute inset-0 overflow-visible [container-type:size]")}>
          {/* spark */}
          <div className="absolute inset-0 h-[100cqh] [aspect-ratio:1] [border-radius:0] [mask:none] opacity-80 group-hover:opacity-100 transition-opacity duration-300">
            {/* spark before - Smooth rotating shimmer */}
            <div className="absolute -inset-full w-auto animate-spin-around [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
          </div>
        </div>
        {children}

        {/* Enhanced Highlight with stronger hover effects */}
        <div
          className={cn(
            "insert-0 absolute size-full",

            "rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f]",

            // transition
            "transform-gpu transition-all duration-300 ease-in-out",

            // Enhanced hover effects
            "group-hover:shadow-[inset_0_-6px_20px_#ffffff4f] group-hover:bg-white/5",

            // Enhanced click effects
            "group-active:shadow-[inset_0_-10px_15px_#ffffff5f] group-active:bg-white/8",
          )}
        />

        {/* backdrop */}
        <div className={cn("absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]")} />
        
        {/* Additional glow effect on hover */}
        <div className={cn(
          "absolute -inset-1 rounded-[var(--radius)] opacity-0 group-hover:opacity-30 transition-opacity duration-300",
          "bg-gradient-to-r from-transparent via-white/20 to-transparent blur-sm -z-10"
        )} />
      </>
    );

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        style: { ...shimmerStyles, ...(children.props as { style?: React.CSSProperties }).style },
        ref,
        ...props,
        children: shimmerContent,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }

    return (
      <button
        style={shimmerStyles}
        className={shimmerClasses}
        ref={ref}
        {...props}
      >
        {shimmerContent}
      </button>
    )
  },
)

ShimmerButton.displayName = "ShimmerButton"