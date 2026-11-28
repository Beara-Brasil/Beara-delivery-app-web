import { Coords } from "@/types/restaurant";

/**
 * Câmera do mapa do endereço por etapa (LDMF-542). Ver
 * `docs/mapa-do-endereco.md` para o fluxo inteiro.
 *
 * - `country`: nada preenchido → Brasil, mapa travado;
 * - `state`: estado escolhido → zoom no estado, travado;
 * - `city`: cidade escolhida → zoom na cidade, travado;
 * - `free`: bairro escrito ou pino marcado → câmera livre, presa à cidade com
 *   folga de `CITY_MARGIN_KM`.
 */
export type MapStage = "country" | "state" | "city" | "free";

/** Retângulo geográfico, em graus. */
export type MapBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

/** Brasil continental, com folga pequena. */
export const BRAZIL_BOUNDS: MapBounds = {
  south: -33.8,
  west: -74.0,
  north: 5.3,
  east: -34.7,
};

/** Folga além do limite da cidade na etapa livre ("1 ou 2 km"). */
export const CITY_MARGIN_KM = 1.5;

const KM_PER_DEGREE = 111.32;

export function getMapStage({
  state,
  city,
  neighborhood,
  hasPin,
}: {
  state?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  hasPin: boolean;
}): MapStage {
  // Pino marcado (clique, GPS, CEP, endereço salvo) ou bairro escrito: o
  // cliente já está no nível da rua. Clicar no Brasil ou no estado cai aqui
  // direto, sem passar pelas etapas travadas.
  if (hasPin || neighborhood?.trim()) return "free";
  if (city?.trim()) return "city";
  if (state?.trim()) return "state";
  return "country";
}

/** Retângulo aumentado em `km` para cada lado. */
export function padBounds(bounds: MapBounds, km: number): MapBounds {
  const latPad = km / KM_PER_DEGREE;
  const midLat = ((bounds.south + bounds.north) / 2) * (Math.PI / 180);
  const lngPad = km / (KM_PER_DEGREE * Math.max(Math.cos(midLat), 0.01));

  return {
    south: bounds.south - latPad,
    west: bounds.west - lngPad,
    north: bounds.north + latPad,
    east: bounds.east + lngPad,
  };
}

/**
 * Retângulo que também contém o ponto. Pino salvo fora da cidade (endereço
 * antigo com a cidade errada) não pode ficar preso do lado de fora.
 */
export function includePoint(bounds: MapBounds, point: Coords | null): MapBounds {
  if (!point) return bounds;
  return {
    south: Math.min(bounds.south, point.lat),
    west: Math.min(bounds.west, point.lng),
    north: Math.max(bounds.north, point.lat),
    east: Math.max(bounds.east, point.lng),
  };
}

/** Chave estável para usar como dependência de efeito. */
export function boundsKey(bounds: MapBounds | null | undefined): string {
  if (!bounds) return "";
  return [bounds.south, bounds.west, bounds.north, bounds.east]
    .map((value) => value.toFixed(5))
    .join(",");
}

/**
 * Retângulo de um GeoJSON (malha do IBGE). Aceita Feature, FeatureCollection
 * ou geometria pura; devolve `null` se não achar nenhum ponto.
 */
export function boundsFromGeoJson(geojson: unknown): MapBounds | null {
  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;

  const visit = (node: unknown): void => {
    if (!Array.isArray(node)) return;
    if (node.length >= 2 && typeof node[0] === "number" && typeof node[1] === "number") {
      const [lng, lat] = node as number[];
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      south = Math.min(south, lat);
      north = Math.max(north, lat);
      west = Math.min(west, lng);
      east = Math.max(east, lng);
      return;
    }
    node.forEach(visit);
  };

  const walk = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    const item = value as {
      features?: unknown[];
      geometry?: unknown;
      geometries?: unknown[];
      coordinates?: unknown;
    };
    item.features?.forEach(walk);
    if (item.geometry) walk(item.geometry);
    item.geometries?.forEach(walk);
    if (item.coordinates) visit(item.coordinates);
  };

  walk(geojson);
  return Number.isFinite(south) ? { south, west, north, east } : null;
}
