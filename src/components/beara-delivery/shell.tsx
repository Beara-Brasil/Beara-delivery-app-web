import type { ReactNode } from "react";

import { displayFont, monoFont, sansFont } from "./fonts";
import "./theme.css";

// Casca das telas com a identidade Beara Delivery: aplica as fontes e as
// cores escopadas em `.bd` (theme.css). Fora dela, nada muda.
export function BearaDeliveryShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={`bd flex min-h-screen flex-col antialiased ${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      {children}
    </div>
  );
}
