"use client";

import { useQuery } from "@tanstack/react-query";

import { normalizeText } from "@/lib/geocode";
import {
  BRAZIL_BOUNDS,
  CITY_MARGIN_KM,
  getMapStage,
  includePoint,
  padBounds,
  type MapBounds,
  type MapStage,
} from "@/lib/map-area";
import { getCities, getCityBounds, getStateBounds } from "@/services/ibge";
import { Coords } from "@/types/restaurant";

export type MapArea = {
  stage: MapStage;
  /** Enquadramento das etapas travadas (Brasil, estado, cidade). */
  viewBounds: MapBounds;
  /**
   * Limite da câmera na etapa livre: a cidade com folga. `null` quando não
   * deu para saber o contorno da cidade (aí a câmera fica sem limite).
   */
  limitBounds: MapBounds | null;
};

/**
 * Etapa e enquadramento do mapa do endereço (LDMF-542). Os contornos vêm da
 * malha do IBGE; a lista de cidades usa a mesma chave de cache do
 * `useAddressFields`, então não busca de novo.
 */
export function useMapArea({
  state,
  city,
  neighborhood,
  pin,
  enabled = true,
}: {
  state?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  pin: Coords | null;
  enabled?: boolean;
}): MapArea {
  const uf = (state ?? "").trim().toUpperCase();
  const cityName = (city ?? "").trim();

  const citiesQuery = useQuery({
    queryKey: ["ibge", "cities", uf],
    queryFn: () => getCities(uf),
    enabled: enabled && uf.length === 2,
    staleTime: Infinity,
    retry: 1,
  });

  const cityKey = normalizeText(cityName);
  const ibgeCode =
    citiesQuery.data?.find((item) => normalizeText(item.name) === cityKey)
      ?.ibgeCode ?? "";

  const stateBounds = useQuery({
    queryKey: ["ibge", "mesh", "state", uf],
    queryFn: () => getStateBounds(uf),
    enabled: enabled && uf.length === 2,
    staleTime: Infinity,
    retry: 1,
  }).data;

  const cityBounds = useQuery({
    queryKey: ["ibge", "mesh", "city", ibgeCode],
    queryFn: () => getCityBounds(ibgeCode),
    enabled: enabled && !!ibgeCode,
    staleTime: Infinity,
    retry: 1,
  }).data;

  const stage = getMapStage({ state: uf, city: cityName, neighborhood, hasPin: !!pin });

  // Enquanto o contorno não chega (ou se o IBGE falhar), fica o nível acima.
  const viewBounds =
    stage === "country"
      ? BRAZIL_BOUNDS
      : stage === "state"
        ? (stateBounds ?? BRAZIL_BOUNDS)
        : (cityBounds ?? stateBounds ?? BRAZIL_BOUNDS);

  const limitBounds =
    stage === "free" && cityBounds && cityName
      ? includePoint(padBounds(cityBounds, CITY_MARGIN_KM), pin)
      : null;

  return { stage, viewBounds, limitBounds };
}
