import { parseBrasilApiCoords } from "@/lib/address-coordinates";
import type { Coords } from "@/types/restaurant";

export interface CepAddress {
  /** Só dígitos. */
  zipCode: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  /** Código IBGE do município ("3201407" = Castelo); vazio se não veio. */
  ibgeCode: string;
  /** Coordenada do logradouro (não do número) - nem todo CEP tem. */
  coords: Coords | null;
}

export class CepNotFoundError extends Error {
  constructor() {
    super("CEP não encontrado");
    this.name = "CepNotFoundError";
  }
}

/** A API respondeu, mas não conseguiu consultar (rede, 5xx, formato). */
class CepServiceError extends Error {}

const text = (value: unknown) => (typeof value === "string" ? value : "");

/**
 * Principal (LDMF-260): BrasilAPI v2. Além do endereço, devolve a coordenada
 * do logradouro (ponto de partida do pino) e o código IBGE da cidade.
 */
async function fetchFromBrasilApi(digits: string): Promise<CepAddress> {
  let response: Response;
  try {
    response = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`);
  } catch {
    throw new CepServiceError("BrasilAPI fora do ar");
  }

  if (response.status === 404) throw new CepNotFoundError();
  if (!response.ok) throw new CepServiceError(`BrasilAPI ${response.status}`);

  const data = await response.json();

  return {
    zipCode: digits,
    street: text(data.street),
    neighborhood: text(data.neighborhood),
    city: text(data.city),
    state: text(data.state),
    ibgeCode: text(data.ibge?.city),
    coords: parseBrasilApiCoords(data),
  };
}

/**
 * Reserva: ViaCEP. Mesmo endereço e código IBGE, sem coordenada. CEP que
 * não existe volta 200 com `{"erro": "true"}`.
 */
async function fetchFromViaCep(digits: string): Promise<CepAddress> {
  let response: Response;
  try {
    response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  } catch {
    throw new CepServiceError("ViaCEP fora do ar");
  }

  if (!response.ok) throw new CepServiceError(`ViaCEP ${response.status}`);

  const data = await response.json();
  if (data?.erro === true || data?.erro === "true") throw new CepNotFoundError();

  return {
    zipCode: digits,
    street: text(data.logradouro),
    neighborhood: text(data.bairro),
    city: text(data.localidade),
    state: text(data.uf),
    ibgeCode: text(data.ibge),
    coords: null,
  };
}

/**
 * Busca o CEP na BrasilAPI e, se ela falhar, na ViaCEP.
 *
 * O 404 da BrasilAPI também passa pela ViaCEP: ela responde 404 quando os
 * serviços dela por trás falham, não só quando o CEP não existe. Só é "CEP
 * não encontrado" quando nenhuma das duas acha; se a reserva também cair,
 * vale o que a principal disse.
 */
export async function fetchCepAddress(cep: string): Promise<CepAddress> {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) throw new Error("CEP incompleto");

  let primaryError: unknown;
  try {
    return await fetchFromBrasilApi(digits);
  } catch (error) {
    primaryError = error;
  }

  try {
    return await fetchFromViaCep(digits);
  } catch (fallbackError) {
    if (fallbackError instanceof CepNotFoundError) throw fallbackError;
    if (primaryError instanceof CepNotFoundError) throw primaryError;
    throw new Error("Erro ao buscar CEP");
  }
}

export type StreetCepQuery = {
  /** UF, ex.: "ES". */
  state: string;
  city: string;
  /** Logradouro completo ("Rua Sete de Setembro"). */
  street: string;
  neighborhood?: string;
  /** Número da casa: em rua com CEP por faixa ("até 218 - lado par"). */
  number?: string;
};

/** Nome da via sem o tipo, para a segunda tentativa. */
function withoutStreetType(street: string) {
  return street.replace(
    /^(rua|r\.?|avenida|av\.?|travessa|tv\.?|praça|praca|estrada|rodovia|alameda|beco|ladeira|largo|viela)\s+/i,
    "",
  );
}

type StreetCepResult = {
  cep: string;
  bairro: string;
  logradouro: string;
  complemento: string;
};

const keyOf = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

/**
 * Memória da sessão (LDMF-542): uma consulta por rua. Trocar o número ou o
 * bairro escolhe de novo na lista guardada, sem ir à ViaCEP.
 */
const streetResults = new Map<string, StreetCepResult[]>();
/** Cidade de CEP único já vista: as outras ruas dela nem consultam. */
const cityWideCep = new Map<string, string>();

/** Limpa a memória (testes). */
export function resetStreetCepCache() {
  streetResults.clear();
  cityWideCep.clear();
}

async function searchViaCepByStreet(
  state: string,
  city: string,
  street: string,
): Promise<StreetCepResult[]> {
  const cacheKey = [state, keyOf(city), keyOf(street)].join("|");
  const cached = streetResults.get(cacheKey);
  if (cached) return cached;

  const path = [state, city, street].map((part) => encodeURIComponent(part.trim()));
  const response = await fetch(`https://viacep.com.br/ws/${path.join("/")}/json/`);
  if (!response.ok) return [];

  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];

  const results = data
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        cep: text(row.cep).replace(/\D/g, ""),
        bairro: text(row.bairro),
        logradouro: text(row.logradouro),
        complemento: text(row.complemento),
      };
    })
    .filter((item) => item.cep.length === 8);
  // Só guarda o que achou: sem resultado, a próxima tentativa consulta de novo.
  if (results.length) streetResults.set(cacheKey, results);
  return results;
}

/**
 * O número cabe na faixa do complemento da ViaCEP? Formatos medidos em
 * Vitória: "até 218 - lado par", "de 127 a 255 - lado ímpar",
 * "de 220 ao fim - lado par". Com os dois lados juntos, o número vem com
 * barra (medido em Curitiba, Rua Marechal Floriano): "até 178/179",
 * "de 180/181 a 929/930", "de 10462/10463 ao fim". `null` quando o
 * complemento não é faixa (CEP de prédio ou loja, como "495 Lojas 3 e 4", ou
 * vazio).
 */
export function numberFitsRange(complement: string, number: number): boolean | null {
  const range = keyOf(complement);
  const parity = range.includes("lado par") ? 0 : range.includes("lado impar") ? 1 : null;
  if (parity !== null && number % 2 !== parity) return false;

  // "178/179": o primeiro é o começo da faixa; o último, o fim.
  const NUM = String.raw`(\d+)(?:\/(\d+))?`;
  const until = range.match(new RegExp(`^ate ${NUM}`));
  if (until) return number <= Number(until[2] ?? until[1]);
  const between = range.match(new RegExp(`^de ${NUM} a ${NUM}`));
  if (between) {
    return number >= Number(between[1]) && number <= Number(between[4] ?? between[3]);
  }
  const toEnd = range.match(new RegExp(`^de ${NUM} ao fim`));
  if (toEnd) return number >= Number(toEnd[1]);
  return null;
}

/** Faixa genérica da rua (sem número de prédio): serve sem saber o número. */
const isStreetWide = (item: StreetCepResult) => !/^\d/.test(item.complemento.trim());

function pickStreetCep(
  results: StreetCepResult[],
  neighborhood: string | undefined,
  number: string | undefined,
): string | null {
  const houseNumber = Number.parseInt((number ?? "").replace(/\D/g, ""), 10);
  if (Number.isFinite(houseNumber)) {
    const inRange = results.find((item) => numberFitsRange(item.complemento, houseNumber));
    if (inRange) return inRange.cep;
  }

  // Faixa que deixa o número de fora não serve, nem como CEP do bairro.
  const excludes = (item: StreetCepResult) =>
    Number.isFinite(houseNumber) && numberFitsRange(item.complemento, houseNumber) === false;
  const general = results.filter((item) => isStreetWide(item) && !excludes(item));
  const pool = general.length ? general : results.filter((item) => !excludes(item));
  // Toda faixa da rua deixa o número de fora: melhor pedir o CEP do que
  // chutar um que já se sabe errado.
  if (!pool.length) return null;
  const sameNeighborhood = neighborhood
    ? pool.find((item) => keyOf(item.bairro) === keyOf(neighborhood))
    : undefined;
  return (sameNeighborhood ?? pool[0]).cep;
}

/**
 * CEP pelo endereço, para quem não sabe o CEP (LDMF-258: "preenchido
 * automaticamente se ficar vazio"). ViaCEP, busca por UF, cidade e rua:
 * cidade de CEP único devolve o CEP da cidade (Alegre 29500-000); cidade
 * grande devolve os CEPs da rua. Vale o da faixa do número, quando a rua
 * tem CEP por faixa; senão, o do bairro escolhido; senão, o primeiro.
 * Tenta com o logradouro completo e, sem resultado, só com o nome. `null`
 * quando não acha ou a consulta falha - o cliente digita o CEP.
 */
export async function findCepByStreet({
  state,
  city,
  street,
  neighborhood,
  number,
}: StreetCepQuery): Promise<string | null> {
  const uf = state.trim().toUpperCase();
  if (uf.length !== 2 || !city.trim()) return null;

  const cityKey = `${uf}|${keyOf(city)}`;
  const known = cityWideCep.get(cityKey);
  if (known) return known;

  const attempts = [street.trim(), withoutStreetType(street.trim())].filter(
    (value, index, all) => value.length >= 3 && all.indexOf(value) === index,
  );

  try {
    for (const attempt of attempts) {
      const results = await searchViaCepByStreet(uf, city, attempt);
      if (!results.length) continue;

      // Uma linha sem logradouro é o CEP da cidade inteira.
      if (results.length === 1 && !results[0].logradouro) {
        cityWideCep.set(cityKey, results[0].cep);
        return results[0].cep;
      }
      return pickStreetCep(results, neighborhood, number);
    }
  } catch {
    return null;
  }

  return null;
}
