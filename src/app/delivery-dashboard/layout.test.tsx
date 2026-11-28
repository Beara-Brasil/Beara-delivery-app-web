import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// notFound do Next lança para interromper a renderização; aqui basta saber
// que foi chamado.
const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
vi.mock("next/navigation", () => ({ notFound }));

// A chave vem mockada: o teste vale com o valor real em true ou false.
const courier = vi.hoisted(() => ({ enabled: false }));
vi.mock("@/features/courier/config", () => ({
  get COURIER_ENABLED() {
    return courier.enabled;
  },
}));

vi.mock("@/components/protected-route", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/features/courier/components/delivery-tab-bar", () => ({
  DeliveryTabBar: () => null,
}));

import DeliveryAreaLayout from "./layout";

describe("DeliveryAreaLayout", () => {
  it("responde 404 enquanto a área do entregador está desligada (LDMF-539)", () => {
    expect(() => render(<DeliveryAreaLayout>conteúdo</DeliveryAreaLayout>)).toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("ligada, mostra a área", () => {
    courier.enabled = true;
    try {
      notFound.mockClear();
      const { container } = render(<DeliveryAreaLayout>conteúdo</DeliveryAreaLayout>);
      expect(container.textContent).toContain("conteúdo");
      expect(notFound).not.toHaveBeenCalled();
    } finally {
      courier.enabled = false;
    }
  });
});
