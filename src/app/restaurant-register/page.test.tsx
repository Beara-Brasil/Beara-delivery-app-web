import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import RestaurantRegisterPage from "./page";

vi.mock("@/components/beara-delivery/fonts", () => ({
  displayFont: { variable: "font-display-var" },
  sansFont: { variable: "font-sans-var" },
  monoFont: { variable: "font-mono-var" },
}));

// Referências estáveis: mock com identidade nova a cada render causa laço.
const handleInputChange = vi.fn();
const handleSubmit = vi.fn((event: { preventDefault: () => void }) => event.preventDefault());
const registerData = {
  tradeName: "",
  legalName: "",
  cnpj: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  description: "",
  actionRadius: "10",
  birthDate: "",
};
const noErrors: string[] = [];

let hookState = {
  isLoggedIn: false,
  canRegisterOnAccount: false,
  accountLabel: "",
  registerData,
  handleInputChange,
  passwordErrors: noErrors,
  passwordMatch: true,
  isFormValid: true,
  isLoading: false,
  submitMessage: null as null | { type: "success" | "error"; text: string },
  handleSubmit,
};

vi.mock("@/hooks/use-restaurant-registration", () => ({
  useRestaurantRegistration: () => hookState,
}));

describe("RestaurantRegisterPage", () => {
  beforeEach(() => {
    handleInputChange.mockClear();
    handleSubmit.mockClear();
    hookState = { ...hookState, isLoggedIn: false, canRegisterOnAccount: false, isFormValid: true };
  });

  it("mantém os campos com os mesmos ids (usados pelo e2e) e manda o que foi digitado ao hook", () => {
    render(<RestaurantRegisterPage />);

    for (const id of ["tradeName", "legalName", "cnpj", "description", "actionRadius", "email", "phone", "password", "confirmPassword", "birthDate", "acceptTerms"]) {
      expect(document.getElementById(id), id).not.toBeNull();
    }

    fireEvent.change(document.getElementById("tradeName")!, { target: { value: "Pizzaria do João" } });
    expect(handleInputChange).toHaveBeenCalledWith("tradeName", "Pizzaria do João");
  });

  it("só libera o envio depois de aceitar os termos", () => {
    render(<RestaurantRegisterPage />);

    const enviar = screen.getByRole("button", { name: "Cadastrar restaurante" });
    expect(enviar).toBeDisabled();
    fireEvent.submit(enviar.closest("form")!);
    expect(handleSubmit).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("checkbox"));
    expect(enviar).toBeEnabled();

    // submit direto: o jsdom barraria o clique pelos campos required vazios
    fireEvent.submit(enviar.closest("form")!);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("logado como cliente, esconde os campos de acesso e mostra a conta", () => {
    hookState = { ...hookState, isLoggedIn: true, canRegisterOnAccount: true, accountLabel: "dono@teste.com" };
    render(<RestaurantRegisterPage />);

    expect(document.getElementById("password")).toBeNull();
    expect(document.getElementById("birthDate")).toBeNull();
    expect(screen.getByText("dono@teste.com")).toBeInTheDocument();
  });

  it("volta para a landing e não promete análise da equipe", () => {
    const { container } = render(<RestaurantRegisterPage />);

    expect(screen.getByRole("link", { name: "Voltar" })).toHaveAttribute("href", "/restaurant-landing-page");
    expect(container.textContent).not.toMatch(/equipe revisa/i);
  });
});
