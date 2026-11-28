import { describe, expect, it } from "vitest";
import { decidePinFill, matchMapNeighborhood } from "./reverse-fill";

const atual = { state: "ES", city: "Castelo", neighborhood: "Centro", street: "Rua das Orquídeas" };
const ponto = (over: Record<string, string | null>) => ({
  state: "ES",
  city: "Castelo",
  neighborhood: "Centro",
  street: "Rua das Orquídeas",
  ...over,
});

describe("decidePinFill (LDMF-542): só muda o que mudou", () => {
  it("rua diferente no mesmo bairro: muda só a rua", () => {
    expect(decidePinFill(atual, ponto({ street: "Rua das Acerolas" }))).toEqual({ street: "Rua das Acerolas" });
  });

  it("bairro diferente: muda bairro e rua juntos", () => {
    expect(decidePinFill(atual, ponto({ neighborhood: "Niterói", street: "Rua Um" }))).toEqual({
      neighborhood: "Niterói",
      street: "Rua Um",
    });
  });

  it("cidade diferente: muda cidade, bairro e rua; estado só se mudou", () => {
    expect(decidePinFill(atual, ponto({ city: "Alegre", neighborhood: "Vila", street: "Rua X" }))).toEqual({
      city: "Alegre",
      neighborhood: "Vila",
      street: "Rua X",
    });
    expect(
      decidePinFill(atual, ponto({ state: "MG", city: "Muriaé", neighborhood: "Centro", street: "Rua Y" })),
    ).toEqual({ state: "MG", city: "Muriaé", neighborhood: "Centro", street: "Rua Y" });
  });

  it("cidade nova sem bairro ou rua conhecidos: esvazia para o cliente preencher", () => {
    expect(decidePinFill(atual, ponto({ city: "Alegre", neighborhood: null, street: null }))).toEqual({
      city: "Alegre",
      neighborhood: "",
      street: "",
    });
  });

  it("nunca mexe no número", () => {
    const fill = decidePinFill({ ...atual, number: "45" } as never, ponto({ city: "Alegre" }));
    expect(fill).not.toHaveProperty("number");
  });

  it("mesmo lugar, ou ponto sem cidade (oceano): não muda nada", () => {
    expect(decidePinFill(atual, ponto({}))).toBeNull();
    expect(decidePinFill(atual, ponto({ city: null }))).toBeNull();
    expect(decidePinFill(atual, null)).toBeNull();
  });

  it("rua igual escrita diferente (caixa e acento) não conta como mudança", () => {
    expect(decidePinFill(atual, ponto({ street: "RUA DAS ORQUIDEAS" }))).toBeNull();
  });

  it("nome alternativo do mesmo bairro não conta como mudança", () => {
    const mesmoBairro = (a: string, b: string) => [a, b].every((n) => ["Centro", "Centrinho"].includes(n));
    expect(decidePinFill(atual, ponto({ neighborhood: "Centrinho" }), mesmoBairro)).toBeNull();
  });
});

describe("matchMapNeighborhood", () => {
  const lista = {
    city: "Castelo",
    state: "ES",
    neighborhoods: [
      { name: "Bela Vista" },
      { name: "Castelo III", altNames: ["Pombal"] },
    ],
  } as never;

  it("grafia do mapa com letra repetida casa com a lista (medido em Castelo)", () => {
    expect(matchMapNeighborhood(lista, "Bella Vista")?.name).toBe("Bela Vista");
  });

  it("nome alternativo continua valendo", () => {
    expect(matchMapNeighborhood(lista, "Pombal")?.name).toBe("Castelo III");
  });

  it("bairro que não está na lista não casa", () => {
    expect(matchMapNeighborhood(lista, "Niterói")).toBeNull();
    expect(matchMapNeighborhood(null, "Bela Vista")).toBeNull();
  });
});
