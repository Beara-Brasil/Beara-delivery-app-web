"use client";

import { useEffect, useState } from "react";

/**
 * Área que sobra acima do teclado do celular (LDMF-541).
 *
 * No Chrome do Android (padrão) e no Safari do iPhone, abrir o teclado não
 * muda o tamanho da página: só o `visualViewport` encolhe. Uma janela fixa no
 * meio da tela fica com a metade de baixo atrás do teclado e, se o conteúdo
 * cabe nela, não tem rolagem para o campo subir.
 *
 * Devolve a altura e o topo da área visível enquanto o teclado está aberto, e
 * `null` com ele fechado ou quando a página já encolhe sozinha
 * (`interactiveWidget: "resizes-content"`): aí não há nada a compensar.
 */
export type KeyboardViewport = { height: number; top: number };

/** Menos que isso é barra do navegador sumindo ou aparecendo, não teclado. */
export const KEYBOARD_MIN_HEIGHT = 120;

export function readKeyboardViewport(
  innerHeight: number,
  viewport: { height: number; offsetTop: number } | null | undefined,
): KeyboardViewport | null {
  if (!viewport) return null;
  const covered = innerHeight - viewport.height;
  if (covered <= KEYBOARD_MIN_HEIGHT) return null;
  return { height: viewport.height, top: viewport.offsetTop };
}

export function useKeyboardViewport(enabled = true): KeyboardViewport | null {
  const [state, setState] = useState<KeyboardViewport | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const next = readKeyboardViewport(window.innerHeight, viewport);
      // Mesmo valor: devolve o estado antigo para não renderizar à toa.
      setState((prev) =>
        prev?.height === next?.height && prev?.top === next?.top ? prev : next,
      );
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [enabled]);

  return state;
}
