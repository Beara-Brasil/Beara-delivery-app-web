import { describe, expect, it } from "vitest";
import { KEYBOARD_MIN_HEIGHT, readKeyboardViewport } from "./use-keyboard-viewport";

describe("readKeyboardViewport", () => {
  it("teclado aberto: devolve a altura e o topo da área visível", () => {
    expect(readKeyboardViewport(812, { height: 472, offsetTop: 0 })).toEqual({ height: 472, top: 0 });
  });

  it("barra do navegador mexendo não conta como teclado", () => {
    expect(readKeyboardViewport(812, { height: 812 - KEYBOARD_MIN_HEIGHT, offsetTop: 0 })).toBeNull();
  });

  it("página que encolhe sozinha (resizes-content) não precisa de compensação", () => {
    expect(readKeyboardViewport(472, { height: 472, offsetTop: 0 })).toBeNull();
  });

  it("sem visualViewport, não faz nada", () => {
    expect(readKeyboardViewport(812, null)).toBeNull();
  });
});
