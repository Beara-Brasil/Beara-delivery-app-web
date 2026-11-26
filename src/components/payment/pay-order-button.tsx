"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MercadoPagoIcon } from "@/components/payment/paid-online-badge";
import { cn } from "@/lib/utils";
import { apiService } from "@/services/api";
import { getErrorMessage } from "@/utils";

/**
 * "Pagar agora" de um pedido que ficou aguardando pagamento (ML-01): pede o
 * link do checkout ao back (POST /payment/checkout, que reaproveita a Order do
 * Mercado Pago enquanto ela vale ou cria outra se a anterior expirou) e leva o
 * cliente para lá. Sem isso, quem fechou o checkout sem pagar ficava com o
 * pedido parado em "Aguardando pagamento".
 */
export function PayOrderButton({
  orderId,
  label = "Pagar agora",
  className,
  size = "sm",
}: {
  orderId: string;
  label?: string;
  className?: string;
  size?: "sm" | "default";
}) {
  const [isOpening, setIsOpening] = useState(false);

  const handleClick = async () => {
    setIsOpening(true);
    try {
      const response = await apiService.payments.checkout(orderId);
      if (response.success && response.data?.checkoutUrl) {
        window.location.assign(response.data.checkoutUrl);
        return;
      }
      toast.error(response.message || "Não foi possível abrir o pagamento.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível abrir o pagamento."));
    }
    setIsOpening(false);
  };

  // Cores do próprio logo do Mercado Pago: fundo branco (a marca pede o
  // logo colorido sobre branco, inclusive no tema escuro), borda no ciano
  // #00bcff e texto no azul-marinho #0a0080. Destaca ao lado do botão
  // laranja da loja sem competir com ele.
  return (
    <Button
      type="button"
      size={size}
      variant="outline"
      onClick={handleClick}
      disabled={isOpening}
      className={cn(
        "gap-2 rounded-lg border-[#00bcff] bg-white text-[#0a0080] shadow-sm",
        "hover:border-[#00a6e0] hover:bg-[#e8f8ff] hover:text-[#0a0080]",
        "focus-visible:ring-[#00bcff]/40 disabled:opacity-70",
        "dark:border-[#00bcff] dark:bg-white dark:text-[#0a0080] dark:hover:bg-[#e8f8ff]",
        className,
      )}
    >
      {isOpening ? (
        <Loader2 className="h-4 w-4 animate-spin text-[#00bcff]" />
      ) : (
        <MercadoPagoIcon bare className="-my-1" />
      )}
      {label}
    </Button>
  );
}
