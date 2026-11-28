"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { LocateFixed } from "lucide-react";

import { AddressMap } from "@/components/address-map";
import type { MapArea } from "@/hooks/use-map-area";
import { cn } from "@/lib/utils";
import { Coords } from "@/types/restaurant";

/**
 * Mapa do endereço preso no topo do formulário (LDMF-542). Ver
 * `docs/mapa-do-endereco.md`.
 *
 * - Dentro de janela que rola (modal do perfil, gaveta do cabeçalho), o mapa
 *   fica fixo no topo enquanto os campos rolam por baixo. Sem janela que rola
 *   (checkout, que rola a página inteira e tem cabeçalho fixo), ele só fica
 *   no topo, sem prender.
 * - No celular, com o foco num campo de digitação, o mapa encolhe: o teclado
 *   já ocupa metade da tela.
 */
export const MAP_HEIGHT = 180;
export const MAP_HEIGHT_DESKTOP = 280;
export const MAP_HEIGHT_TYPING = 110;

/** Campos que abrem o teclado do celular (não conta checkbox nem select). */
const TYPING_SELECTOR =
  "input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea";

function isTypingField(element: EventTarget | null): boolean {
  return element instanceof Element && element.matches(TYPING_SELECTOR);
}

function findScrollParent(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null;
  while (node && node !== document.body) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
    node = node.parentElement;
  }
  return null;
}

/**
 * Estilo para o mapa colar no topo da janela que rola, por cima do padding
 * dela (o `sticky` conta a partir do padding). Cada janela tem um padding, por
 * isso é medido, e não fixo no CSS.
 */
function useStickyToScrollParent(ref: React.RefObject<HTMLElement | null>) {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useEffect(() => {
    const parent = findScrollParent(ref.current);
    if (!parent) return;

    const measure = () => {
      const css = getComputedStyle(parent);
      const top = parseFloat(css.paddingTop) || 0;
      const left = parseFloat(css.paddingLeft) || 0;
      const right = parseFloat(css.paddingRight) || 0;
      setStyle({
        position: "sticky",
        // No lugar parado, o paddingTop vira o respiro acima do mapa.
        top: -top,
        paddingTop: top,
        marginLeft: -left,
        marginRight: -right,
        paddingLeft: left,
        paddingRight: right,
      });
    };

    measure();
    // O padding muda com o breakpoint (gaveta: 16px no celular, 24px no PC).
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [ref]);

  return style;
}

/** Foco num campo de digitação do formulário, só em tela de toque. */
function useTypingInForm(ref: React.RefObject<HTMLElement | null>) {
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    const form = ref.current?.parentElement;
    if (!form) return;
    const touch = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    if (!touch) return;

    // Toque no mapa com o teclado aberto: o toque tira o foco do campo, e o
    // mapa crescia no meio do gesto. O Leaflet calculava o ponto com a vista
    // já deslocada, e o pino caía a ~40 m do dedo (medido no iPhone 13
    // emulado). Durante o toque, a altura fica; muda só quando ele termina.
    const panel = ref.current;
    let holding = false;
    let pending: boolean | null = null;
    let releaseTimer: ReturnType<typeof setTimeout> | undefined;
    const apply = (next: boolean) => {
      if (holding) pending = next;
      else setTyping(next);
    };
    const release = (delay: number) => {
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => {
        holding = false;
        if (pending !== null) setTyping(pending);
        pending = null;
      }, delay);
    };
    const onPointerDown = () => {
      clearTimeout(releaseTimer);
      holding = true;
    };
    // Depois do clique do Leaflet (que roda depois deste, no mesmo evento).
    const onClick = () => release(0);
    // Arrasto não gera clique: solta um pouco depois de levantar o dedo.
    const onPointerUp = () => release(400);

    const onFocusIn = (event: FocusEvent) => apply(isTypingField(event.target));
    // Do Número para o Complemento não pisca: o próximo foco já é campo.
    const onFocusOut = (event: FocusEvent) =>
      apply(isTypingField(event.relatedTarget) && form.contains(event.relatedTarget as Node));

    form.addEventListener("focusin", onFocusIn);
    form.addEventListener("focusout", onFocusOut);
    panel?.addEventListener("pointerdown", onPointerDown, true);
    panel?.addEventListener("click", onClick, true);
    window.addEventListener("pointerup", onPointerUp, true);
    window.addEventListener("pointercancel", onPointerUp, true);
    return () => {
      clearTimeout(releaseTimer);
      form.removeEventListener("focusin", onFocusIn);
      form.removeEventListener("focusout", onFocusOut);
      panel?.removeEventListener("pointerdown", onPointerDown, true);
      panel?.removeEventListener("click", onClick, true);
      window.removeEventListener("pointerup", onPointerUp, true);
      window.removeEventListener("pointercancel", onPointerUp, true);
    };
  }, [ref]);

  return typing;
}

function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const query = window.matchMedia?.("(min-width: 640px)");
    if (!query) return;
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener?.("change", update);
    return () => query.removeEventListener?.("change", update);
  }, []);
  return desktop;
}

type Props = {
  coords: Coords | null;
  onSelect: (coords: Coords) => void;
  zoom?: number;
  recenterKey?: number;
  mapArea: MapArea;
  placeLabel: string;
  isSearchingAddress?: boolean;
  isLocatingPin?: boolean;
  addressNotFound?: boolean;
  showUseLocation?: boolean;
  onUseLocation: () => void;
  locatingDevice: boolean;
  deviceLocationError: string | null;
};

export function AddressMapPanel({
  coords,
  onSelect,
  zoom,
  recenterKey,
  mapArea,
  placeLabel,
  isSearchingAddress,
  isLocatingPin,
  addressNotFound,
  showUseLocation,
  onUseLocation,
  locatingDevice,
  deviceLocationError,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const stickyStyle = useStickyToScrollParent(ref);
  const typing = useTypingInForm(ref);
  const desktop = useIsDesktop();

  const mapHeight = typing ? MAP_HEIGHT_TYPING : desktop ? MAP_HEIGHT_DESKTOP : MAP_HEIGHT;

  return (
    <div
      ref={ref}
      data-testid="address-map-panel"
      // `order-first`: fica no topo na tela, mas no código continua depois
      // dos campos, para a ordem do Tab seguir CEP → ... → mapa.
      className={cn(
        "order-first md:col-span-2",
        stickyStyle && "z-10 bg-card pb-3 shadow-[0_8px_12px_-10px_rgba(0,0,0,.25)] dark:bg-background",
      )}
      style={stickyStyle ?? undefined}
    >
      <span className="sr-only">Localização no mapa</span>
      <div className="relative">
        <AddressMap
          mapHeight={mapHeight}
          value={coords}
          onSelect={onSelect}
          zoom={zoom}
          recenterKey={recenterKey}
          stage={mapArea.stage}
          viewBounds={mapArea.viewBounds}
          limitBounds={mapArea.limitBounds}
        />
        {(isSearchingAddress || isLocatingPin) && (
          <span
            role="status"
            className="absolute top-2 left-2 z-[1000] rounded-full bg-card/95 px-2.5 py-1 text-xs font-medium shadow"
          >
            {isSearchingAddress ? "Buscando endereço..." : "Localizando..."}
          </span>
        )}
      </div>

      {/* Embaixo do mapa (pedido do produto). Digitando, some: o teclado já
          ocupa a tela e o botão não serve no meio da digitação. */}
      {showUseLocation && !typing && (
        <button
          type="button"
          onClick={onUseLocation}
          disabled={locatingDevice}
          title={`Use se você está na ${placeLabel} agora.`}
          className="mt-2 inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          <LocateFixed className="size-4 text-brand-500" aria-hidden />
          {locatingDevice ? "Localizando..." : "Usar minha localização"}
        </button>
      )}

      {/* Sem pino não tem linha: o espaço preso é curto, e salvar sem pino
          já avisa "Marque no mapa onde fica o endereço" (pedido do produto). */}
      {addressNotFound ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
          Não encontramos esse endereço no mapa. Arraste o pino até a {placeLabel}.
        </p>
      ) : coords ? (
        <p className="mt-1.5 text-xs text-muted-foreground">
          Confira se o pino está na {placeLabel}. Se não estiver, arraste.
        </p>
      ) : null}
      {deviceLocationError && (
        <p role="alert" className="mt-1 text-xs font-medium text-amber-700 dark:text-amber-400">
          {deviceLocationError}
        </p>
      )}
    </div>
  );
}
