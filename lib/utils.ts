import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize voucher image values stored as filenames (e.g., "legoland.png"),
// full URLs (e.g., "https://..."), or with a stray leading '@' (e.g., "@https://...")
export function resolveVoucherImage(image: unknown, fallback: string = "/images/default.jpg"): string {
  if (typeof image !== "string" || image.trim().length === 0) {
    return fallback
  }

  const trimmed = image.trim().startsWith("@") ? image.trim().slice(1) : image.trim()

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }

  return `/images/${trimmed}`
}
