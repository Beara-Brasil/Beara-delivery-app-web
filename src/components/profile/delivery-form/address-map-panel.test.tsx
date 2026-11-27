import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BRAZIL_BOUNDS } from "@/lib/map-area";

import {
  AddressMapPanel,
  MAP_HEIGHT,
  MAP_HEIGHT_TYPING,
} from "./address-map-panel";

// O mapa de verdade (Leaflet) não importa aqui: só a altura que ele recebe.
vi.mock("@/components/address-map", () => ({
  AddressMap: ({ mapHeight }: { mapHeight: number }) => (
    <div data-testid="mapa" data-height={mapHeight} />
  ),
}));

const baseProps = {
  coords: null,
  onSelect: vi.fn(),
  mapArea: { stage: "country" as const, viewBounds: BRAZIL_BOUNDS, limitBounds: null },
  placeLabel: "sua casa",
  onUseLocation: vi.fn(),
  locatingDevice: false,
  deviceLocationError: null,
};

function mockPointer(coarse: boolean) {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      matches: query.includes("coarse") ? coarse : false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

/** Formulário como o real: campos e o painel como irmãos. */
function renderInForm({ scrolls }: { scrolls: boolean }) {
  return render(
    <div data-testid="janela" style={scrolls ? { overflowY: "auto", padding: "20px" } : undefined}>
      <div>
        <input aria-label="Rua" />
        <input aria-label="Sem número" type="checkbox" />
        <AddressMapPanel {...baseProps} />
      </div>
    </div>,
  );
}

const height = () => Number(screen.getByTestId("mapa").dataset.height);
const panel = () => screen.getByTestId("address-map-panel");

describe("AddressMapPanel (LDMF-542)", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("dentro de janela que rola, fica preso no topo por cima do padding", () => {
    mockPointer(false);
    renderInForm({ scrolls: true });

    expect(panel().style.position).toBe("sticky");
    expect(panel().style.top).toBe("-20px");
    expect(panel().style.marginLeft).toBe("-20px");
  });

  it("sem janela que rola (checkout), fica no topo sem prender", () => {
    mockPointer(false);
    renderInForm({ scrolls: false });

    expect(panel().style.position).toBe("");
    expect(panel().className).toContain("order-first");
  });

  it("no celular, encolhe com o foco num campo de digitação e volta ao sair", () => {
    mockPointer(true);
    renderInForm({ scrolls: true });
    expect(height()).toBe(MAP_HEIGHT);

    act(() => screen.getByLabelText("Rua").focus());
    expect(height()).toBe(MAP_HEIGHT_TYPING);

    act(() => screen.getByLabelText("Rua").blur());
    expect(height()).toBe(MAP_HEIGHT);
  });

  it("checkbox não abre teclado: o mapa não encolhe", () => {
    mockPointer(true);
    renderInForm({ scrolls: true });

    act(() => screen.getByLabelText("Sem número").focus());
    expect(height()).toBe(MAP_HEIGHT);
  });

  it("no PC, o foco num campo não encolhe o mapa", () => {
    mockPointer(false);
    renderInForm({ scrolls: true });

    act(() => screen.getByLabelText("Rua").focus());
    expect(height()).not.toBe(MAP_HEIGHT_TYPING);
  });

  it("Usar minha localização fica em cima do mapa", () => {
    mockPointer(false);
    const onUseLocation = vi.fn();
    render(<AddressMapPanel {...baseProps} showUseLocation onUseLocation={onUseLocation} />);

    fireEvent.click(screen.getByRole("button", { name: "Usar minha localização" }));
    expect(onUseLocation).toHaveBeenCalledTimes(1);
  });
});
