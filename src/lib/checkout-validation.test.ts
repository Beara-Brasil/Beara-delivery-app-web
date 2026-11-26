import { describe, expect, it } from "vitest";
import {
  describeMissingFields,
  isInvalidOptionalCpf,
  getCheckoutFieldErrors,
} from "./checkout-validation";

const COMPLETE = {
  name: "Cliente",
  phone: "11999999999",
  cpf: "",
  zipCode: "29360-000",
  street: "Rua Jocarly Garcia",
  number: "100",
  neighborhood: "São Miguel",
  city: "Castelo",
  state: "ES",
};

describe("getCheckoutFieldErrors", () => {
  it("entrega completa não tem erro", () => {
    expect(
      getCheckoutFieldErrors({
        values: COMPLETE,
        orderType: "delivery",
        hasCpf: true,
      }),
    ).toEqual({});
  });

  it("aponta cada campo de endereço que falta", () => {
    expect(
      getCheckoutFieldErrors({
        values: { ...COMPLETE, street: "", number: "  ", neighborhood: "" },
        orderType: "delivery",
        hasCpf: true,
      }),
    ).toEqual({
      street: "Informe a rua.",
      number: "Informe o número.",
      neighborhood: "Informe o bairro.",
    });
  });

  it("CEP pela metade é erro no CEP", () => {
    expect(
      getCheckoutFieldErrors({
        values: { ...COMPLETE, zipCode: "1393-0" },
        orderType: "delivery",
        hasCpf: true,
      }),
    ).toEqual({ zipCode: "Informe o CEP com 8 dígitos." });
  });

  it("nome, telefone e CPF (só quando a conta não tem CPF)", () => {
    const values = { ...COMPLETE, name: "", phone: "", cpf: "123" };

    expect(
      getCheckoutFieldErrors({ values, orderType: "delivery", hasCpf: false }),
    ).toEqual({
      name: "Informe seu nome completo.",
      phone: "Informe seu telefone.",
      cpf: "Informe um CPF válido.",
    });
    expect(
      getCheckoutFieldErrors({ values, orderType: "delivery", hasCpf: true }),
    ).not.toHaveProperty("cpf");
    // CPF em branco é opcional (ML-01).
    expect(
      getCheckoutFieldErrors({
        values: { ...values, cpf: "" },
        orderType: "delivery",
        hasCpf: false,
      }),
    ).not.toHaveProperty("cpf");
  });

  it("retirada ignora o endereço, como antes", () => {
    const noAddress = {
      ...COMPLETE,
      zipCode: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "",
    };

    expect(
      getCheckoutFieldErrors({
        values: noAddress,
        orderType: "pickup",
        hasCpf: true,
      }),
    ).toEqual({});
    expect(
      getCheckoutFieldErrors({
        values: { ...noAddress, phone: "" },
        orderType: "pickup",
        hasCpf: true,
      }),
    ).toEqual({ phone: "Informe seu telefone." });
  });
});

describe("describeMissingFields", () => {
  it("um campo: a mensagem dele; vários: a lista", () => {
    expect(describeMissingFields({ number: "Informe o número." })).toBe(
      "Informe o número.",
    );
    expect(
      describeMissingFields({ street: "x", number: "y", state: "z" }),
    ).toBe("Falta preencher: Rua, Número, Estado.");
  });
});

describe("isInvalidOptionalCpf (ML-01)", () => {
  it("em branco não é inválido", () => {
    expect(isInvalidOptionalCpf("")).toBe(false);
    expect(isInvalidOptionalCpf(undefined)).toBe(false);
    expect(isInvalidOptionalCpf("   ")).toBe(false);
  });

  it("pela metade é inválido", () => {
    expect(isInvalidOptionalCpf("123.45")).toBe(true);
  });

  it("completo e válido passa", () => {
    expect(isInvalidOptionalCpf("123.456.789-00")).toBe(false);
  });
});
