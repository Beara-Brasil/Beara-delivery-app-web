"use client";

import { Button } from "@/components/ui/button";
import { useMercadoPagoStatus } from "@/hooks/use-mercado-pago-status";
import { apiService } from "@/services/api";
import { getErrorMessage } from "@/utils";
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

/**
 * Bloco "Pagamento Online (Mercado Pago)" das configurações do financeiro.
 * Mostra se a empresa já está conectada (GET /payment/oauth/status, LDMF-516)
 * e oferece conectar ou reconectar.
 */
export function MercadoPagoConnection() {
  const { data: status, isLoading, isError } = useMercadoPagoStatus();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const response = await apiService.payments.oauthConnect();
      if (response.success && response.data?.authorizationUrl) {
        window.location.href = response.data.authorizationUrl;
      } else {
        toast.error(response.message || "Erro ao conectar com Mercado Pago");
      }
    } catch (err) {
      toast.error(
        getErrorMessage(err, "Erro ao iniciar conexão com Mercado Pago"),
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const connected = status?.connected === true;
  const expired = status?.expired === true;
  const expiresAt = formatDate(status?.expiresAt ?? null);
  const connectedAt = formatDate(status?.connectedAt ?? null);

  let title = "Conectar Conta Mercado Pago";
  let description =
    "Conecte a conta Mercado Pago do restaurante para processar pagamentos de pedidos com checkout online, atualização de status via webhook e movimentação automática de caixa.";

  if (connected) {
    title = "Mercado Pago conectado";
    description = [
      status?.mercadoPagoId ? `Conta ${status.mercadoPagoId}` : null,
      connectedAt ? `conectada em ${connectedAt}` : null,
      expiresAt ? `autorização válida até ${expiresAt}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    description = description
      ? `${description.charAt(0).toUpperCase()}${description.slice(1)}.`
      : "A conta do restaurante já está pronta para receber pagamentos online.";
  } else if (expired) {
    title = "Conexão com o Mercado Pago expirada";
    description = expiresAt
      ? `A autorização venceu em ${expiresAt}. Reconecte para voltar a receber pagamentos online.`
      : "A autorização venceu. Reconecte para voltar a receber pagamentos online.";
  }

  const buttonLabel = isConnecting
    ? "Conectando..."
    : connected || expired
      ? "Reconectar"
      : "Conectar Mercado Pago";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-md" aria-live="polite">
        {isLoading ? (
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verificando conexão...
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
              {connected && (
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-emerald-500"
                  aria-hidden="true"
                />
              )}
              {expired && (
                <AlertTriangle
                  className="h-4 w-4 shrink-0 text-amber-500"
                  aria-hidden="true"
                />
              )}
              {title}
            </div>
            <p className="mt-1 text-xs text-muted-foreground text-pretty">
              {description}
            </p>
            {isError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                Não foi possível verificar se a conta já está conectada.
              </p>
            )}
          </>
        )}
      </div>
      <Button
        type="button"
        onClick={handleConnect}
        disabled={isConnecting || isLoading}
        variant={connected ? "outline" : "default"}
        className="shrink-0 gap-2 rounded-lg"
      >
        {isConnecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ExternalLink className="h-4 w-4" />
        )}
        {buttonLabel}
      </Button>
    </div>
  );
}
