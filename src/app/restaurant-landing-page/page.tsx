import type { Metadata } from "next";
import Link from "next/link";

import { BearaDeliveryMark, BearaDeliveryWordmark } from "./_components/beara-delivery-mark";
import { FaqList } from "./_components/faq-list";
import { LandingHeader } from "./_components/landing-header";
import { OrderBoardDemo } from "./_components/order-board-demo";
import { ADVANTAGES, HERO, REGISTER_HREF, STEPS } from "./content";
import { displayFont, monoFont, sansFont } from "./fonts";
import "./landing.css";

export const metadata: Metadata = {
  title: "Para restaurantes",
  description:
    "Cadastre seu restaurante no Beara Delivery e receba pedidos de clientes da sua região.",
};

const sectionTitle =
  "lb-display m-0 text-[clamp(32px,4.5vw,52px)] leading-none font-extrabold tracking-[-.03em] text-balance";
const kicker = "lb-mono text-[13px] text-(--lb-accent)";
const ctaPrimary =
  "inline-flex min-h-12 items-center rounded-full bg-(--lb-cta-bg) px-[26px] py-4 text-base font-semibold text-(--lb-cta-fg) transition-colors hover:bg-(--lb-cta-hover)";

export default function RestaurantLandingPage() {
  return (
    <div
      className={`lb flex min-h-screen flex-col antialiased ${displayFont.variable} ${sansFont.variable} ${monoFont.variable}`}
    >
      <LandingHeader />

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden bg-(--lb-hero-bg) text-(--lb-hero-ink)">
          <BearaDeliveryMark
            decorative
            size={640}
            className="pointer-events-none absolute right-[-6%] bottom-[-14%] h-auto w-[min(52vw,640px)] text-(--lb-hero-mark) opacity-[.09]"
          />
          <div
            className="pointer-events-none absolute top-[-30%] right-[-8%] aspect-square w-[min(70vw,820px)] rounded-full bg-[radial-gradient(circle,var(--lb-hero-glow)_0%,transparent_70%)]"
            aria-hidden
          />
          <svg
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            aria-hidden
            className="pointer-events-none absolute right-0 bottom-[-1px] left-0 block h-[clamp(32px,5vw,72px)] w-full"
          >
            <path d="M0,80 L0,40 C240,80 480,0 720,30 C960,60 1200,10 1440,40 L1440,80 Z" fill="var(--lb-hero-wave)" />
          </svg>

          <div className="relative mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-[clamp(40px,5vw,64px)] px-4 pt-[clamp(48px,8vw,104px)] pb-[clamp(72px,10vw,136px)] sm:px-[clamp(16px,4vw,40px)]">
            <div className="flex flex-col gap-6">
              <span className="lb-mono self-start rounded-full bg-(--lb-surface) px-3.5 py-2 text-[13px] text-(--lb-accent)">
                {HERO.kicker}
              </span>
              <h1 className="lb-display m-0 text-[clamp(40px,6.5vw,80px)] leading-[.95] font-extrabold tracking-[-.035em] text-balance">
                {HERO.title}
              </h1>
              <p className="m-0 max-w-[46ch] text-[clamp(17px,1.5vw,20px)] leading-normal text-pretty text-(--lb-hero-soft)">
                {HERO.text}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={REGISTER_HREF} className={ctaPrimary}>
                  Cadastrar meu restaurante
                </Link>
                <Link
                  href="#como-funciona"
                  className="inline-flex min-h-12 items-center rounded-full border-[1.5px] border-(--lb-hero-ink) px-[26px] py-4 text-base font-semibold"
                >
                  Como funciona
                </Link>
              </div>
            </div>
            <OrderBoardDemo />
          </div>
        </section>

        <section
          id="como-funciona"
          className="mx-auto flex w-full max-w-[1240px] scroll-mt-20 flex-col gap-10 px-4 py-[clamp(64px,8vw,104px)] sm:px-[clamp(16px,4vw,40px)]"
        >
          <div className="flex max-w-[640px] flex-col gap-3">
            <span className={kicker}>COMO FUNCIONA</span>
            <h2 className={sectionTitle}>Do cadastro ao primeiro pedido.</h2>
          </div>
          <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-4 p-0">
            {STEPS.map((step, index) => {
              const last = index === STEPS.length - 1;
              return (
                <li
                  key={step.n}
                  className={`flex flex-col gap-3.5 rounded-[20px] p-7 ${
                    last
                      ? "bg-(--lb-yellow) text-(--lb-on-yellow)"
                      : "border border-(--lb-line) bg-(--lb-surface)"
                  }`}
                >
                  <span
                    className={`lb-mono flex size-11 items-center justify-center rounded-xl ${
                      last ? "bg-[#1C120C] text-white" : "bg-(--lb-step-bg) text-(--lb-step-fg)"
                    }`}
                    aria-hidden
                  >
                    {step.n}
                  </span>
                  <h3 className="lb-display m-0 text-[22px] font-semibold">{step.title}</h3>
                  <p className={`m-0 text-[15px] leading-normal ${last ? "" : "text-(--lb-muted)"}`}>
                    {step.text}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        <section
          id="vantagens"
          className="scroll-mt-20 border-y border-(--lb-line) bg-(--lb-surface)"
        >
          <div className="mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-start gap-[clamp(32px,5vw,64px)] px-4 py-[clamp(64px,8vw,104px)] sm:px-[clamp(16px,4vw,40px)]">
            <div className="flex flex-col gap-3 md:sticky md:top-[100px]">
              <span className={kicker}>VANTAGENS</span>
              <h2 className={sectionTitle}>Mais pedidos, menos dor de cabeça.</h2>
              <p className="m-0 max-w-[40ch] text-lg leading-[1.55] text-(--lb-muted)">
                Tudo o que o restaurante precisa para vender por delivery, num só lugar.
              </p>
            </div>
            <ul className="m-0 flex list-none flex-col border-t-2 border-(--lb-ink) p-0">
              {ADVANTAGES.map((item) => (
                <li
                  key={item.n}
                  className="grid grid-cols-[48px_minmax(0,1fr)] gap-4 border-b border-(--lb-line) py-6"
                >
                  <span className="lb-mono pt-1 text-[13px] text-(--lb-accent)" aria-hidden>
                    {item.n}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="lb-display m-0 text-[22px] font-semibold tracking-[-.01em]">{item.title}</h3>
                    <p className="m-0 text-base leading-normal text-(--lb-muted)">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          id="duvidas"
          className="mx-auto flex w-full max-w-[880px] scroll-mt-20 flex-col gap-8 px-4 py-[clamp(64px,8vw,104px)] sm:px-[clamp(16px,4vw,40px)]"
        >
          <div className="flex flex-col gap-3">
            <span className={kicker}>DÚVIDAS</span>
            <h2 className={sectionTitle}>Perguntas frequentes</h2>
          </div>
          <FaqList />
          <div className="flex flex-col items-start gap-4 rounded-[20px] bg-(--lb-hero-bg) p-7 text-(--lb-hero-ink) sm:flex-row sm:items-center sm:justify-between">
            <p className="lb-display m-0 text-2xl font-extrabold tracking-[-.02em]">
              Pronto para começar?
            </p>
            <Link href={REGISTER_HREF} className={ctaPrimary}>
              Cadastrar meu restaurante
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-(--lb-footer-bg) text-(--lb-footer-text)">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm sm:px-[clamp(16px,4vw,40px)]">
          <Link href="/" className="flex items-center gap-2.5 text-white" aria-label="Beara Delivery: início">
            <BearaDeliveryMark size={26} className="text-white" />
            <BearaDeliveryWordmark accentClassName="text-(--lb-yellow)" />
          </Link>
          <nav aria-label="Rodapé" className="flex flex-wrap gap-x-5">
            <Link href="/" className="inline-flex min-h-11 items-center hover:text-white">
              Pedir no app
            </Link>
            <Link href="/privacy" className="inline-flex min-h-11 items-center hover:text-white">
              Privacidade
            </Link>
            <Link href="/terms" className="inline-flex min-h-11 items-center hover:text-white">
              Termos
            </Link>
          </nav>
          <span>© 2026 Beara</span>
        </div>
      </footer>
    </div>
  );
}
