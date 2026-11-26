/**
 * API de localidades do IBGE (pública, sem chave).
 * https://servicodados.ibge.gov.br/api/docs/localidades
 *
 * Estados: `[{ id, sigla, nome }]`; municípios: `[{ id, nome }]`. Lemos só
 * esses campos e descartamos o que vier fora desse formato.
 */

import { boundsFromGeoJson, type MapBounds } from "@/lib/map-area";

const BASE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades";

export type IbgeState = { uf: string; name: string };
export type IbgeCity = { ibgeCode: string; name: string };

async function getJson(path: string): Promise<unknown[]> {
  const response = await fetch(`${BASE_URL}${path}`);
  if (!response.ok) throw new Error(`IBGE respondeu ${response.status}`);

  const data: unknown = await response.json();
  return Array.isArray(data) ? data : [];
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function getStates(): Promise<IbgeState[]> {
  const data = await getJson("/estados?orderBy=nome");

  return data
    .map((item) => {
      const raw = item as { sigla?: unknown; nome?: unknown };
      return { uf: text(raw.sigla).toUpperCase(), name: text(raw.nome) };
    })
    .filter((state) => state.uf.length === 2 && state.name);
}

export async function getCities(uf: string): Promise<IbgeCity[]> {
  const sigla = uf.trim().toUpperCase();
  if (sigla.length !== 2) return [];

  const data = await getJson(
    `/estados/${encodeURIComponent(sigla)}/municipios?orderBy=nome`,
  );

  return data
    .map((item) => {
      const raw = item as { id?: unknown; nome?: unknown };
      return {
        ibgeCode: raw.id === undefined || raw.id === null ? "" : String(raw.id),
        name: text(raw.nome),
      };
    })
    .filter((city) => city.name);
}

/**
 * Malhas do IBGE (LDMF-542): o contorno do estado e da cidade só para
 * enquadrar o mapa do endereço. `qualidade=minima` basta (o ES vem com 1,8 KB
 * e um município com menos de 1 KB) e não traz ilhas oceânicas: no Nominatim
 * o retângulo do ES ia até Trindade, a 1.000 km da costa, e o zoom mostrava
 * quase só oceano.
 */
const MESH_URL = "https://servicodados.ibge.gov.br/api/v3/malhas";
const MESH_QUERY = "formato=application/vnd.geo%2Bjson&qualidade=minima";

async function getMeshBounds(path: string): Promise<MapBounds | null> {
  const response = await fetch(`${MESH_URL}${path}?${MESH_QUERY}`);
  if (!response.ok) throw new Error(`IBGE respondeu ${response.status}`);
  return boundsFromGeoJson(await response.json());
}

export function getStateBounds(uf: string): Promise<MapBounds | null> {
  const sigla = uf.trim().toUpperCase();
  if (sigla.length !== 2) return Promise.resolve(null);
  return getMeshBounds(`/estados/${encodeURIComponent(sigla)}`);
}

export function getCityBounds(ibgeCode: string): Promise<MapBounds | null> {
  const code = ibgeCode.trim();
  if (!/^\d{7}$/.test(code)) return Promise.resolve(null);
  return getMeshBounds(`/municipios/${code}`);
}
