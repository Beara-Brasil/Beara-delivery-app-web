import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";

// Fontes da família Beara (as mesmas do site institucional). Carregadas só
// nesta rota: o resto do app continua na Figtree e não baixa nada a mais.
export const displayFont = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  weight: ["600", "800"],
  variable: "--font-lb-display",
  display: "swap",
});

export const sansFont = Instrument_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--font-lb-sans",
  display: "swap",
});

export const monoFont = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["500"],
  variable: "--font-lb-mono",
  display: "swap",
});
