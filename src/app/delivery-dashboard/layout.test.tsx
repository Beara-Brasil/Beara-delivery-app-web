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
});
