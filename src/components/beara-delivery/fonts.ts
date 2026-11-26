import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";

// Fontes da família Beara (as mesmas do site institucional). Só as telas que
// usam o BearaDeliveryShell baixam: o resto do app continua na Figtree.
export const displayFont = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "800"],
  variable: "--font-bd-display",
  display: "swap",
});

export const sansFont = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-bd-sans",
  display: "swap",
});

export const monoFont = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["500"],
  variable: "--font-bd-mono",
  display: "swap",
});
