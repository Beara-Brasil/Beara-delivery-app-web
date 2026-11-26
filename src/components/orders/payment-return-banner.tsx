"use client";

import { CheckCircle2, Clock, Loader2, X, XCircle } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { PayOrderButton } from "@/components/payment/pay-order-button";
import { cn } from "@/lib/utils";

export type PaymentReturnResult = "success" | "failure" | "pending";

/** Status em que o pedido ainda pode ser pago online. */
const PAYABLE_STATUSES = new Set(["AWAITING_PAYMENT", "ORDERED"]);
/** Enquanto o webhook não confirma, confere de novo a cada 5 s, até 1 min. */
const REFRESH_EVERY_MS = 5000;
const MAX_REFRESHES = 12;

export function readPaymentReturn(params: URLSearchParams): {
  orderId: string;
  result: PaymentReturnResult;
} | null {
  const orderId = params.get("orderId");
  const result = params.get("payment");
  if (!orderId) return null;
  if (result !== "success" && result !== "failure" && result !== "pending") return null;
  return { orderId, result };
}

/**
 * Aviso de volta do checkout do Mercado Pago (ML-01). O back manda o cliente
 * para `/orders?orderId=...&payment=success|failure|pending`.
 *
 * - success: o pagamento foi aprovado no MP; enquanto o webhook não chega, o
 *   pedido ainda aparece "Aguardando pagamento", então a lista é atualizada
 *   sozinha por até 1 minuto.
 * - pending (Pix/boleto em aberto) e failure: se o pedido ainda pode ser pago,
 *   oferece voltar ao checkout (o back devolve a mesma Order do MP).
 */
export function PaymentReturnBanner({
  findOrderStatus,
  onRefresh,
}: {
  /** Status atual do pedido na lista; null se ele (ainda) não está nela. */
  findOrderStatus: (orderId: string) => string | null | undefined;
  onRefresh: () => void;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const info = readPaymentReturn(params);
  const refreshes = useRef(0);
  // Referência estável: a página recria `onRefresh` a cada render, e isso
  // reiniciava o intervalo de atualização.
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const status = info ? (findOrderStatus(info.orderId)?.toUpperCase() ?? null) : null;
  const stillPayable = status === null || PAYABLE_STATUSES.has(status);
  const waitingConfirmation = info?.result === "success" && stillPayable;

  useEffect(() => {
    if (!waitingConfirmation) return;
    const timer = setInterval(() => {
      if (refreshes.current >= MAX_REFRESHES) {
        clearInterval(timer);
        return;
      }
      refreshes.current += 1;
      onRefreshRef.current();
    }, REFRESH_EVERY_MS);
    return () => clearInterval(timer);
  }, [waitingConfirmation]);

  if (!info) return null;

  const dismiss = () => router.replace(pathname);


  let tone = "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
  let Icon = CheckCircle2;
  let title = "Pagamento aprovado!";
  let text = "Seu pedido foi enviado para a loja.";

  if (info.result === "success" && waitingConfirmation) {
    text = "Estamos confirmando com o Mercado Pago. O pedido segue para a loja em instantes.";
  } else if (info.result === "pending") {
    tone = "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200";
    Icon = Clock;
    title = "Pagamento em processamento";
    text = stillPayable
      ? "Assim que o Mercado Pago confirmar, o pedido segue para a loja. Se ainda não pagou o Pix, abra o pagamento de novo."
      : "O pagamento foi confirmado.";
  } else if (info.result === "failure") {
    tone = "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200";
    Icon = XCircle;
    title = "Pagamento não concluído";
    text = stillPayable
      ? "Nada foi cobrado. Você pode tentar pagar de novo."
      : "Este pedido não pode mais ser pago online.";
  }

  const canRetry = info.result !== "success" && stillPayable;

  return (
    <div
      role="status"
      className={cn("mb-4 flex items-start gap-3 rounded-xl border p-3", tone)}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-bold">
          {title}
          {waitingConfirmation && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
        </p>
        <p className="mt-0.5 text-xs font-medium">{text}</p>
        {canRetry && (
          <PayOrderButton
            orderId={info.orderId}
            label={info.result === "pending" ? "Abrir pagamento" : "Tentar pagar de novo"}
            className="mt-2 h-8"
          />
        )}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="rounded-md p-1 opacity-70 transition hover:opacity-100"
        aria-label="Fechar aviso"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
