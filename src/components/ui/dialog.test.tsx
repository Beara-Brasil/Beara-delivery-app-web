import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dialog, DialogContent, DialogTitle } from "./dialog";

// visualViewport falso: o jsdom não tem teclado nem visualViewport.
class FakeViewport extends EventTarget {
  height = 812;
  offsetTop = 0;
}

describe("DialogContent e o teclado do celular (LDMF-541)", () => {
  let viewport: FakeViewport;

  beforeEach(() => {
    viewport = new FakeViewport();
    vi.stubGlobal("visualViewport", viewport);
    vi.stubGlobal("innerHeight", 812);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const abrir = () =>
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Janela</DialogTitle>
          <input aria-label="Senha" />
        </DialogContent>
      </Dialog>,
    );

  it("sem teclado, não mexe na posição nem na altura", () => {
    abrir();
    const janela = screen.getByRole("dialog");
    expect(janela.style.top).toBe("");
    expect(janela.style.maxHeight).toBe("");
  });

  it("com o teclado aberto, centra na área visível, limita a altura e leva o campo focado para a vista", async () => {
    abrir();
    const campo = screen.getByLabelText("Senha");
    const scroll = vi.fn();
    campo.scrollIntoView = scroll;
    campo.focus();

    act(() => {
      viewport.height = 472;
      viewport.dispatchEvent(new Event("resize"));
    });

    const janela = screen.getByRole("dialog");
    expect(janela.style.top).toBe("236px");
    expect(janela.style.maxHeight).toBe("456px");
    await waitFor(() => expect(scroll).toHaveBeenCalledWith({ block: "nearest" }));

    act(() => {
      viewport.height = 812;
      viewport.dispatchEvent(new Event("resize"));
    });
    expect(janela.style.top).toBe("");
  });

  it("janela fechada não escuta o teclado; ao fechar, para de escutar", () => {
    const add = vi.spyOn(viewport, "addEventListener");
    const remove = vi.spyOn(viewport, "removeEventListener");
    const janela = (open: boolean) => (
      <Dialog open={open}>
        <DialogContent>
          <DialogTitle>Janela</DialogTitle>
        </DialogContent>
      </Dialog>
    );

    const { rerender } = render(janela(false));
    expect(add).not.toHaveBeenCalled();

    rerender(janela(true));
    expect(add).toHaveBeenCalledTimes(2);

    rerender(janela(false));
    expect(remove).toHaveBeenCalledTimes(2);
  });
});
