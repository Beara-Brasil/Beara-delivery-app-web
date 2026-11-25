"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { LOGIN_HREF, NAV_LINKS, REGISTER_HREF } from "../content";
import { BearaDeliveryMark, BearaDeliveryWordmark } from "./beara-delivery-mark";

export function LandingHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Esc fecha o menu do celular
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-20 border-b border-(--lb-line) bg-(--lb-surface)">
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-4 sm:h-[68px] sm:px-[clamp(16px,4vw,40px)]">
        <Link
          href="/"
          onClick={close}
          className="flex min-w-0 shrink-0 items-center gap-2 text-(--lb-ink) sm:gap-2.5"
          aria-label="Beara Delivery: início"
        >
          {/* shrink-0: no mock o símbolo encolhia até sumir em 375px */}
          <BearaDeliveryMark size={30} className="size-7 shrink-0 sm:size-[30px]" />
          <BearaDeliveryWordmark accentClassName="text-(--lb-accent)" />
          <span className="lb-mono hidden rounded-full border border-(--lb-line) px-2.5 py-1 text-xs text-(--lb-accent) lg:inline">
            para restaurantes
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 md:gap-5">
          <nav aria-label="Seções" className="hidden gap-6 text-[15px] font-medium md:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="py-3 hover:text-(--lb-accent)">
                {link.label}
              </Link>
            ))}
            <Link href={LOGIN_HREF} className="py-3 hover:text-(--lb-accent)">
              Entrar
            </Link>
          </nav>
          <Link
            href={REGISTER_HREF}
            className="inline-flex min-h-11 items-center rounded-full bg-(--lb-cta-bg) px-3.5 text-[15px] font-semibold whitespace-nowrap text-(--lb-cta-fg) transition-colors hover:bg-(--lb-cta-hover) sm:px-5"
          >
            Cadastrar
          </Link>
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full border border-(--lb-line) md:hidden"
            aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuOpen}
            aria-controls="lb-menu-movel"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="lb-menu-movel"
          aria-label="Seções"
          className="border-t border-(--lb-line) bg-(--lb-surface) px-4 pb-4 md:hidden"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={close}
              className="lb-display flex min-h-14 items-center border-b border-(--lb-line) text-xl font-extrabold"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={LOGIN_HREF}
            onClick={close}
            className="lb-display flex min-h-14 items-center text-xl font-extrabold text-(--lb-accent)"
          >
            Já tenho conta
          </Link>
        </nav>
      )}
    </header>
  );
}
