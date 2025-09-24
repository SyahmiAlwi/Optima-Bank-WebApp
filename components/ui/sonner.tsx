"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  const bg = theme === "dark" ? "rgba(17,17,17,0.95)" : "rgba(255,255,255,0.95)"

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      position="top-center"
      toastOptions={{
        style: {
          background: bg,
          color: theme === "dark" ? "#fff" : "#111827",
          border: theme === "dark" ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          backdropFilter: "blur(2px)",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
