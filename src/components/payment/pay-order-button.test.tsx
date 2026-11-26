import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PayOrderButton } from "./pay-order-button";

const checkout = vi.hoisted(() => vi.fn());
const toastError = vi.hoisted(() => vi.fn());

vi.mock("@/services/api", () => ({ apiService: { payments: { checkout } } }));
vi.mock("sonner", () => ({ toast: { error: toastError } }));

const originalLocation = window.location;
const assign = vi.fn();

beforeEach(() => {
  checkout.mockReset();
  toastError.mockReset();
  assign.mockReset();
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...originalLocation, assign },
  });
});

afterEach(() => {
  Object.defineProperty(window, "location", { configurable: true, value: originalLocation });
});

describe("PayOrderButton (ML-01)", () => {
  it("mostra o logo do Mercado Pago e leva ao checkout do pedido", async () => {
    checkout.mockResolvedValue({ success: true, data: { checkoutUrl: "https://mp.test/1" } });
    render(<PayOrderButton orderId="o1" />);

    expect(screen.getByAltText("Mercado Pago")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Pagar agora/ }));

    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://mp.test/1"));
    expect(checkout).toHaveBeenCalledWith("o1");
  });

  it("Pix já gerado (409 do back): mostra a mensagem e não sai do app", async () => {
    checkout.mockResolvedValue({
      success: false,
      message: "Já existe um pagamento em andamento para este pedido",
    });
    render(<PayOrderButton orderId="o1" />);

    fireEvent.click(screen.getByRole("button", { name: /Pagar agora/ }));

    await waitFor(() =>
      expect(toastError).toHaveBeenCalledWith("Já existe um pagamento em andamento para este pedido"),
    );
    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Pagar agora/ })).toBeEnabled();
  });
});
