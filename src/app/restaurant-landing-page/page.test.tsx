import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RestaurantLandingPage from "./page";

// next/font só funciona no build do Next; no teste basta a classe da variável.
vi.mock("@/components/beara-delivery/fonts", () => ({
  displayFont: { variable: "font-display-var" },
  sansFont: { variable: "font-sans-var" },
  monoFont: { variable: "font-mono-var" },
}));

describe("RestaurantLandingPage", () => {
  it("leva todos os botões de cadastro para /restaurant-register", () => {
    render(<RestaurantLandingPage />);

    const ctas = [
      ...screen.getAllByRole("link", { name: "Cadastrar" }),
      ...screen.getAllByRole("link", { name: "Cadastrar meu restaurante" }),
    ];
    expect(ctas.length).toBeGreaterThanOrEqual(3);
    ctas.forEach((cta) => expect(cta).toHaveAttribute("href", "/restaurant-register"));
  });

  it("liga o rodapé aos termos e à privacidade (no mock eram textos soltos)", () => {
    render(<RestaurantLandingPage />);

    const rodape = within(screen.getByRole("navigation", { name: "Rodapé" }));
    expect(rodape.getByRole("link", { name: "Termos" })).toHaveAttribute("href", "/terms");
    expect(rodape.getByRole("link", { name: "Privacidade" })).toHaveAttribute("href", "/privacy");
    expect(rodape.getByRole("link", { name: "Pedir no app" })).toHaveAttribute("href", "/");
  });

  it("não promete o que o app não faz: estatística inventada, tempo de entrega, promoção ou análise", () => {
    const { container } = render(<RestaurantLandingPage />);
    const texto = container.textContent ?? "";

    expect(texto).not.toMatch(/500\+|50k|4\.8/);
    expect(texto).not.toMatch(/tempo de entrega/i);
    expect(texto).not.toMatch(/promo|desconto|frete grátis/i);
    expect(texto).not.toMatch(/equipe revisa/i);
  });

  it("abre e fecha as perguntas frequentes com aria-expanded", () => {
    render(<RestaurantLandingPage />);

    const pergunta = screen.getByRole("button", { name: /Como abro e fecho a loja/ });
    expect(pergunta).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(pergunta);

    expect(pergunta).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/abre e fecha sozinha/)).toBeVisible();
  });

  it("avança o pedido no painel de demonstração com os nomes da cozinha", () => {
    render(<RestaurantLandingPage />);

    const novos = within(screen.getByRole("region", { name: "Novos" }));
    const preparo = within(screen.getByRole("region", { name: "Em preparo" }));
    expect(preparo.getAllByRole("article")).toHaveLength(1);

    fireEvent.click(novos.getByRole("button", { name: "Iniciar preparo" }));

    expect(preparo.getAllByRole("article")).toHaveLength(2);
    expect(novos.getByText("Nenhum pedido novo")).toBeInTheDocument();
    expect(screen.getByText(/saindo do forno/)).toBeInTheDocument();
  });

  it("abre o menu do celular e fecha com Esc", () => {
    render(<RestaurantLandingPage />);

    const botao = screen.getByRole("button", { name: "Abrir menu" });
    fireEvent.click(botao);
    expect(botao).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Já tenho conta" })).toHaveAttribute("href", "/?auth=required");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Abrir menu" })).toHaveAttribute("aria-expanded", "false");
  });
});
