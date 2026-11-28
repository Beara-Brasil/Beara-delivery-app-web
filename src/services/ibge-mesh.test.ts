import { afterEach, describe, expect, it, vi } from "vitest";
import { getCityBounds, getStateBounds } from "./ibge";

const malha = {
  type: "FeatureCollection",
  features: [{ type: "Feature", geometry: { type: "Polygon", coordinates: [[[-41.87, -21.3], [-39.66, -21.3], [-39.66, -17.89], [-41.87, -17.89]]] } }],
};

describe("malhas do IBGE (LDMF-542)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("estado: pede a malha mínima e devolve o retângulo", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => malha }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await getStateBounds("es")).toEqual({ south: -21.3, west: -41.87, north: -17.89, east: -39.66 });
    const url = String((fetchMock.mock.calls[0] as unknown[])[0]);
    expect(url).toContain("/api/v3/malhas/estados/ES?");
    // "+" cru na query viraria espaço
    expect(url).toContain("formato=application/vnd.geo%2Bjson");
    expect(url).toContain("qualidade=minima");
  });

  it("cidade: só com código IBGE de 7 dígitos", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => malha }));
    vi.stubGlobal("fetch", fetchMock);

    expect(await getCityBounds("abc")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
    await getCityBounds("3201407");
    expect(String((fetchMock.mock.calls[0] as unknown[])[0])).toContain("/malhas/municipios/3201407?");
  });

  it("erro do IBGE vira exceção (o mapa fica no nível acima)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    await expect(getStateBounds("ES")).rejects.toThrow();
  });
});
