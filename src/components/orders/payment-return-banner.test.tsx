import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PaymentReturnBanner, readPaymentReturn } from "./payment-return-banner";

// Referências estáveis: criadas uma vez, só limpas entre os testes.
const navigation = vi.hoisted(() => ({
  params: new URLSearchParams(),
  replace: vi.fn(),
}));
const checkout = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  useSearchParams: () => navigation.params,
  useRouter: () => ({ replace: navigation.replace }),
  usePathname: () => "/orders",
}));
vi.mock("@/services/api", () => ({ apiService: { payments: { checkout } } }));
vi.mock("sonner", () => ({ toast: { error: toastError } }));

function renderBanner(query: string, status: string | null, onRefresh = vi.fn()) {
  navigation.params = new URLSearchParams(query);
  render(<PaymentReturnBanner findOrderStatus={() => status} onRefresh={onRefresh} />);
  return { onRefresh };
}

const originalLocation = window.location;
const assign = vi.fn();

beforeEach(() => {
  navigation.replace.mockReset();
  checkout.mockReset();
  toastError.mockReset();
  assign.mockReset();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, assign },
  });
});

afterEach(() => {
  vi.useRealTimers();
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});

describe("readPaymentReturn", () => {
  it("só reconhece orderId com resultado válido", () => {
    expect(readPaymentReturn(new URLSearchParams("orderId=o1&payment=success"))).toEqual({
      orderId: "o1",
      result: "success",
    });
    expect(readPaymentReturn(new URLSearchParams("orderId=o1&payment=outro"))).toBeNull();
    expect(readPaymentReturn(new URLSearchParams("payment=success"))).toBeNull();
    expect(readPaymentReturn(new URLSearchParams(""))).toBeNull();
  });
});

describe("PaymentReturnBanner (ML-01)", () => {
  it("sem parâmetros não mostra nada", () => {
    renderBanner("", null);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("aprovado e já confirmado: avisa que foi para a loja", () => {
    renderBanner("orderId=o1&payment=success", "IN_PRODUCTION");

    expect(screen.getByText("Pagamento aprovado!")).toBeInTheDocument();
    expect(screen.getByText("Seu pedido foi enviado para a loja.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pagar/i })).not.toBeInTheDocument();
  });

  it("aprovado mas o webhook ainda não chegou: avisa e atualiza a lista sozinho", () => {
    vi.useFakeTimers();
    const { onRefresh } = renderBanner("orderId=o1&payment=success", "AWAITING_PAYMENT");

    expect(screen.getByText(/Estamos confirmando com o Mercado Pago/)).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onRefresh).toHaveBeenCalledTimes(2);

    // Para depois de 1 minuto.
    act(() => {
      vi.advanceTimersByTime(120_000);
    });
    expect(onRefresh).toHaveBeenCalledTimes(12);
  });

  it("recusado com pedido ainda pagável: tentar de novo abre o checkout", async () => {
    checkout.mockResolvedValue({ success: true, data: { checkoutUrl: "https://mp.test/1" } });
    renderBanner("orderId=o1&payment=failure", "AWAITING_PAYMENT");

    expect(screen.getByText("Pagamento não concluído")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Tentar pagar de novo/ }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://mp.test/1"));
    expect(checkout).toHaveBeenCalledWith("o1");
  });

  it("recusado com pedido cancelado: não oferece pagar", () => {
    renderBanner("orderId=o1&payment=failure", "CANCELED");

    expect(screen.getByText("Este pedido não pode mais ser pago online.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /pagar/i })).not.toBeInTheDocument();
  });

  it("pendente (Pix em aberto): oferece abrir o pagamento", () => {
    renderBanner("orderId=o1&payment=pending", "AWAITING_PAYMENT");

    expect(screen.getByText("Pagamento em processamento")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Abrir pagamento/ })).toBeInTheDocument();
  });

  it("falha ao abrir o checkout mostra o erro", async () => {
    checkout.mockResolvedValue({ success: false, message: "Mercado Pago não conectado" });
    renderBanner("orderId=o1&payment=failure", "AWAITING_PAYMENT");

    fireEvent.click(screen.getByRole("button", { name: /Tentar pagar de novo/ }));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith("Mercado Pago não conectado"));
    expect(assign).not.toHaveBeenCalled();
  });

  it("fechar limpa os parâmetros da URL", () => {
    renderBanner("orderId=o1&payment=success", "IN_PRODUCTION");

    fireEvent.click(screen.getByRole("button", { name: "Fechar aviso" }));

    expect(navigation.replace).toHaveBeenCalledWith("/orders");
  });
});
