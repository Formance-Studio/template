import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge Tailwind class strings so a caller can override a component's default
// without the two classes fighting. This is what lets "make the buttons blue"
// be a one-line prop change instead of a className rewrite.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
