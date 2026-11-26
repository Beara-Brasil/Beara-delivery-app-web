import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/api";
import type { MercadoPagoOauthStatusResponse } from "@/services/api";

export const MERCADO_PAGO_STATUS_QUERY_KEY = ["mercado-pago", "oauth-status"];

/**
 * Status da conexão da empresa com o Mercado Pago (LDMF-516).
 *
 * staleTime 0: a conexão muda fora do app (a pessoa vai ao Mercado Pago e
 * volta), então ao abrir a tela sempre confere de novo em vez de confiar no
 * cache de 5 min padrão.
 */
export function useMercadoPagoStatus(enabled = true) {
  return useQuery<MercadoPagoOauthStatusResponse>({
    queryKey: MERCADO_PAGO_STATUS_QUERY_KEY,
    queryFn: async () => {
      const response = await apiService.payments.oauthStatus();
      if (!response.success || !response.data) {
        throw new Error(
          response.message || "Erro ao consultar conexão com Mercado Pago",
        );
      }
      return response.data;
    },
    enabled,
    staleTime: 0,
    retry: false,
  });
}
