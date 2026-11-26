import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MercadoPagoConnection } from "./mercado-pago-connection";

// Referências estáveis: criadas uma vez e só limpas entre os testes.
const oauthStatus = vi.hoisted(() => vi.fn());
const oauthConnect = vi.hoisted(() => vi.fn());

vi.mock("@/services/api", () => ({
  apiService: { payments: { oauthStatus, oauthConnect } },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MercadoPagoConnection />
    </QueryClientProvider>,
  );
}

const disconnected = {
  connected: false,
  expired: false,
  mercadoPagoId: null,
  expiresAt: null,
  connectedAt: null,
};

beforeEach(() => {
  oauthStatus.mockReset();
  oauthConnect.mockReset();
});

describe("Conexão com o Mercado Pago (LDMF-516)", () => {
  it("sem conta, oferece conectar", async () => {
    oauthStatus.mockResolvedValue({ success: true, data: disconnected });
    renderComponent();

    expect(
      await screen.findByText("Conectar Conta Mercado Pago"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Conectar Mercado Pago" }),
    ).toBeEnabled();
  });

  it("conectada, mostra a conta e a validade e oferece reconectar", async () => {
    oauthStatus.mockResolvedValue({
      success: true,
      data: {
        connected: true,
        expired: false,
        mercadoPagoId: "485859278",
        expiresAt: "2027-05-24T17:26:11.625Z",
        connectedAt: "2026-11-25T17:26:11.626Z",
      },
    });
    renderComponent();

    expect(
      await screen.findByText("Mercado Pago conectado"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Conta 485859278, conectada em 25/11/2026, autorização válida até 24/05/2027.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reconectar" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Conectar Mercado Pago" }),
    ).not.toBeInTheDocument();
  });

  it("expirada, avisa e oferece reconectar", async () => {
    oauthStatus.mockResolvedValue({
      success: true,
      data: {
        connected: false,
        expired: true,
        mercadoPagoId: "485859278",
        expiresAt: "2026-01-10T12:00:00.000Z",
        connectedAt: "2025-07-14T12:00:00.000Z",
      },
    });
    renderComponent();

    expect(
      await screen.findByText("Conexão com o Mercado Pago expirada"),
    ).toBeInTheDocument();
    expect(screen.getByText(/venceu em 10\/01\/2026/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reconectar" })).toBeEnabled();
  });

  it("se o status falhar, avisa e mantém o botão de conectar", async () => {
    oauthStatus.mockResolvedValue({ success: false, message: "Erro 500" });
    renderComponent();

    expect(
      await screen.findByText(
        "Não foi possível verificar se a conta já está conectada.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Conectar Mercado Pago" }),
    ).toBeEnabled();
  });
});
