import { describe, expect, it } from "vitest";
import {
  boundsFromGeoJson,
  getMapStage,
  includePoint,
  padBounds,
} from "./map-area";

describe("getMapStage (LDMF-542)", () => {
  it("vai do Brasil ao estado e à cidade, travado", () => {
    expect(getMapStage({ hasPin: false })).toBe("country");
    expect(getMapStage({ state: "ES", hasPin: false })).toBe("state");
    expect(getMapStage({ state: "ES", city: "Castelo", hasPin: false })).toBe("city");
  });

  it("bairro escrito ou pino marcado solta a câmera", () => {
    expect(getMapStage({ state: "ES", city: "Castelo", neighborhood: "Centro", hasPin: false })).toBe("free");
    // Clicar no Brasil já marca o pino: pula direto para a etapa livre.
    expect(getMapStage({ hasPin: true })).toBe("free");
  });
});

describe("padBounds", () => {
  it("abre ~1,5 km para cada lado", () => {
    const castelo = { south: -20.6717, west: -41.4147, north: -20.4338, east: -41.0176 };
    const padded = padBounds(castelo, 1.5);
    // 1,5 km ≈ 0,0135° de latitude
    expect(castelo.south - padded.south).toBeCloseTo(0.0135, 3);
    expect(padded.north - castelo.north).toBeCloseTo(0.0135, 3);
    // longitude abre um pouco mais, pela latitude (cos 20,5° ≈ 0,94)
    expect(castelo.west - padded.west).toBeCloseTo(0.0144, 3);
  });
});

describe("includePoint", () => {
  it("estica o limite para um pino salvo fora dele", () => {
    const bounds = { south: -21, west: -42, north: -20, east: -41 };
    expect(includePoint(bounds, { lat: -19.5, lng: -41.5 }).north).toBe(-19.5);
    expect(includePoint(bounds, null)).toEqual(bounds);
  });
});

describe("boundsFromGeoJson", () => {
  it("lê o retângulo de uma malha do IBGE", () => {
    const geojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "MultiPolygon",
            coordinates: [[[[-41.4, -20.6], [-41.0, -20.6], [-41.0, -20.4], [-41.4, -20.4], [-41.4, -20.6]]]],
          },
        },
      ],
    };
    expect(boundsFromGeoJson(geojson)).toEqual({ south: -20.6, west: -41.4, north: -20.4, east: -41.0 });
  });

  it("sem pontos devolve null", () => {
    expect(boundsFromGeoJson({ type: "FeatureCollection", features: [] })).toBeNull();
    expect(boundsFromGeoJson(null)).toBeNull();
  });
});
