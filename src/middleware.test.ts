// @vitest-environment node
import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// Chave da área do entregador (LDMF-539), trocada por teste.
const courier = vi.hoisted(() => ({ enabled: false }));
vi.mock("@/features/courier/config", () => ({
  get COURIER_ENABLED() {
    return courier.enabled;
  },
}));

import { middleware } from "./middleware";

/** Token só com o payload: o middleware não confere assinatura. */
function sessionFor(role: string) {
  const payload = Buffer.from(JSON.stringify({ sub: "u1", role, companyId: null })).toString("base64url");
  return `x.${payload}.y`;
}

function request(path: string, role?: string) {
  const req = new NextRequest(`http://localhost${path}`);
  if (role) req.cookies.set("like_session", sessionFor(role));
  return req;
}

const rewriteOf = (res: Response) => res.headers.get("x-middleware-rewrite");

describe("middleware: área do entregador (LDMF-539)", () => {
  afterEach(() => {
    courier.enabled = false;
  });

  it.each(["/delivery-dashboard", "/delivery-dashboard/historico", "/delivery-dashboard/ajustes"])(
    "desligada, %s vira uma rota que não existe (404), mesmo para o entregador",
    (path) => {
      for (const role of [undefined, "delivery", "owner"]) {
        const res = middleware(request(path, role));
        expect(rewriteOf(res)).toBe("http://localhost/_area-do-entregador-desligada");
      }
    },
  );

  it("desligada, não pega rota que só começa parecido", () => {
    const res = middleware(request("/delivery-dashboard-x"));
    expect(rewriteOf(res)).toBeNull();
  });

  it("ligada, volta a regra de antes: entregador entra, dono vai para /unauthorized, visitante para o login", () => {
    courier.enabled = true;

    expect(rewriteOf(middleware(request("/delivery-dashboard", "delivery")))).toBeNull();
    expect(middleware(request("/delivery-dashboard", "delivery")).headers.get("location")).toBeNull();
    expect(middleware(request("/delivery-dashboard", "owner")).headers.get("location")).toBe(
      "http://localhost/unauthorized",
    );
    expect(middleware(request("/delivery-dashboard")).headers.get("location")).toBe(
      "http://localhost/?openAuth=true",
    );
  });
});
