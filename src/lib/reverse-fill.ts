import { normalizeText } from "@/lib/geocode";
import {
  findNeighborhood,
  type CityNeighborhoods,
  type Neighborhood,
} from "@/services/neighborhoods";
import type { ReverseAddress } from "@/lib/nominatim";
import { isSameStreet } from "@/lib/street-type";

/**
 * O que o pino muda nos campos (LDMF-542). Ver `docs/mapa-do-endereco.md`.
 *
 * Só muda o que mudou, do mais largo para o mais estreito:
 * - cidade (ou estado) diferente → Estado, Cidade, Bairro e Rua;
 * - bairro diferente (na mesma cidade) → Bairro e Rua;
 * - rua diferente (no mesmo bairro) → só a Rua.
 *
 * Com cidade ou bairro novos, Bairro e Rua vão juntos: a rua antiga era de
 * outro lugar. Se o mapa não souber o bairro ou a rua do ponto novo, o campo
 * fica vazio para o cliente preencher. O Número nunca muda.
 */
export type PinFillFields = {
  state: string;
  city: string;
  neighborhood: string;
  street: string;
};

export function decidePinFill(
  current: Partial<PinFillFields>,
  found: ReverseAddress | null,
  sameNeighborhood: (a: string, b: string) => boolean = (a, b) =>
    normalizeText(a) === normalizeText(b),
): Partial<PinFillFields> | null {
  // Sem cidade (oceano, fora do Brasil): não há o que preencher.
  if (!found?.city) return null;

  const sameState =
    !found.state || normalizeText(found.state) === normalizeText(current.state);
  const sameCity = normalizeText(found.city) === normalizeText(current.city);

  if (!sameState || !sameCity) {
    return {
      ...(found.state && !sameState ? { state: found.state } : {}),
      city: found.city,
      neighborhood: found.neighborhood ?? "",
      street: found.street ?? "",
    };
  }

  const currentNeighborhood = current.neighborhood?.trim() ?? "";
  if (
    found.neighborhood &&
    !(currentNeighborhood && sameNeighborhood(found.neighborhood, currentNeighborhood))
  ) {
    return { neighborhood: found.neighborhood, street: found.street ?? "" };
  }

  if (found.street && !isSameStreet(found.street, current.street ?? "")) {
    return { street: found.street };
  }

  return null;
}

/** Sem caixa, acento e letra repetida: "Bella Vista" e "Bela Vista" casam. */
function looseKey(value: string) {
  return normalizeText(value).replace(/(\p{L})\1+/gu, "$1").replace(/\s+/g, " ");
}

/**
 * Bairro da lista oficial para o nome que veio do mapa. O OpenStreetMap às
 * vezes escreve diferente da lista (medido em Castelo: "Bella Vista" no mapa,
 * "Bela Vista" na lista); sem isso o bairro cairia em "Outro".
 */
export function matchMapNeighborhood(
  list: CityNeighborhoods | null | undefined,
  name: string | null | undefined,
): Neighborhood | null {
  const exact = findNeighborhood(list, name);
  if (exact || !list || !name?.trim()) return exact;

  const key = looseKey(name);
  return (
    list.neighborhoods.find(
      (item) =>
        looseKey(item.name) === key ||
        item.altNames?.some((alt) => looseKey(alt) === key),
    ) ?? null
  );
}
