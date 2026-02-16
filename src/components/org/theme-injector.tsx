"use client";

import { useEffect } from "react";

const DEFAULTS = {
  "--color-primary": "#0F172A",
  "--color-secondary": "#334155",
  "--color-accent": "#0369A1",
};

interface ThemeInjectorProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export function ThemeInjector({
  primaryColor,
  secondaryColor,
  accentColor,
}: ThemeInjectorProps) {
  useEffect(() => {
    const root = document.documentElement;

    root.style.setProperty("--color-primary", primaryColor);
    root.style.setProperty("--color-secondary", secondaryColor);
    root.style.setProperty("--color-accent", accentColor);

    return () => {
      root.style.setProperty("--color-primary", DEFAULTS["--color-primary"]);
      root.style.setProperty(
        "--color-secondary",
        DEFAULTS["--color-secondary"]
      );
      root.style.setProperty("--color-accent", DEFAULTS["--color-accent"]);
    };
  }, [primaryColor, secondaryColor, accentColor]);

  return null;
}
