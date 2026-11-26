"use client";

import { CreditCard } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Logo oficial do Mercado Pago (versão horizontal colorida, RGB), do kit em
 * mercadopago.com.br/mp/logo-oficial, em `public/brand/mercado-pago.svg`.
 *
 * Regras da marca seguidas aqui: não deformar (proporção do viewBox
 * 1048.82 x 425.2), não separar o símbolo do nome e usar a versão colorida
 * só sobre fundo branco - por isso o logo fica numa pílula branca, que
 * funciona em qualquer fundo e no tema escuro.
 *
 * Se o arquivo falhar ao carregar, cai num ícone genérico de cartão.
 */
export const MERCADO_PAGO_LOGO_SRC = "/brand/mercado-pago.svg";
const LOGO_HEIGHT = 24;
const LOGO_WIDTH = Math.round((LOGO_HEIGHT * 1048.82) / 425.2);

export function MercadoPagoIcon({
  className,
  bare = false,
}: {
  className?: string;
  /** Sem a pílula branca: só quando o fundo em volta já é branco. */
  bare?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <CreditCard className={cn("h-4 w-4 shrink-0", className)} aria-hidden="true" />;
  }

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center",
        !bare && "rounded-md bg-white ring-1 ring-black/5",
        className,
      )}
    >
      <Image
        src={MERCADO_PAGO_LOGO_SRC}
        alt="Mercado Pago"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        unoptimized
        className="h-6 w-auto"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

/**
 * Selo de pedido pago antes pelo Mercado Pago (ML-01): quem entrega ou
 * retira não cobra nada. `methods` é a forma usada (ex.: "Pix").
 */
export function PaidOnlineBadge({
  methods,
  className,
}: {
  methods?: string[];
  className?: string;
}) {
  const detail = methods?.filter(Boolean).join(" + ");

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-muted py-0.5 pl-0.5 pr-2.5 text-sm font-medium text-foreground",
        className,
      )}
    >
      <MercadoPagoIcon />
      Pago online{detail ? ` · ${detail}` : ""}
    </span>
  );
}
