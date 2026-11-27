import type { Metadata } from "next";
import Link from "next/link";

import { BearaDeliveryFooter } from "@/components/beara-delivery/footer";
import { BearaDeliveryShell } from "@/components/beara-delivery/shell";

import { FaqList } from "./_components/faq-list";
import { LandingHeader } from "./_components/landing-header";
import { OrderBoardDemo } from "./_components/order-board-demo";
import { ADVANTAGES, HERO, REGISTER_HREF, STEPS } from "./content";

const LANDING_TITLE = "Beara Delivery para restaurantes";
const LANDING_DESCRIPTION =
  "Cadastre seu restaurante no Beara Delivery e receba pedidos de clientes da sua região.";

// A prévia do link (WhatsApp, redes) não herda o título da página: sem o
// `openGraph` daqui, ela mostrava o texto do app para clientes.
export const metadata: Metadata = {
  title: "Para restaurantes",
  description: LANDING_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "Beara Delivery",
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    images: [{ url: "/icons/og-image.png", width: 1200, height: 630, alt: "Beara Delivery" }],
  },
  twitter: {
    card: "summary_large_image",
    title: LANDING_TITLE,
    description: LANDING_DESCRIPTION,
    images: ["/icons/twitter-card.png"],
  },
};

const sectionTitle =
  "bd-display m-0 text-[clamp(32px,4.5vw,52px)] leading-none font-extrabold tracking-[-.03em] text-balance";
const kicker = "bd-mono text-[13px] text-(--bd-accent)";
const ctaPrimary =
  "inline-flex min-h-12 items-center rounded-full bg-(--bd-cta-bg) px-[26px] py-4 text-base font-semibold text-(--bd-cta-fg) transition-colors hover:bg-(--bd-cta-hover)";

export default function RestaurantLandingPage() {
  return (
    <BearaDeliveryShell>
      <LandingHeader />

      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden bg-(--bd-hero-bg) text-(--bd-hero-ink)">
          <div
            className="pointer-events-none absolute top-[-30%] right-[-8%] aspect-square w-[min(70vw,820px)] rounded-full bg-[radial-gradient(circle,var(--bd-hero-glow)_0%,transparent_70%)]"
            aria-hidden
          />
          <svg
            viewBox="0 0 1440 80"
            preserveAspectRatio="none"
            aria-hidden
            className="pointer-events-none absolute right-0 bottom-[-1px] left-0 block h-[clamp(32px,5vw,72px)] w-full"
          >
            <path d="M0,80 L0,40 C240,80 480,0 720,30 C960,60 1200,10 1440,40 L1440,80 Z" fill="var(--bd-hero-wave)" />
          </svg>

          <div className="relative mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(100%,440px),1fr))] items-center gap-[clamp(40px,5vw,64px)] px-4 pt-[clamp(48px,8vw,104px)] pb-[clamp(72px,10vw,136px)] sm:px-[clamp(16px,4vw,40px)]">
            <div className="flex flex-col gap-6">
              <span className="bd-mono self-start rounded-full bg-(--bd-surface) px-3.5 py-2 text-[13px] text-(--bd-accent)">
                {HERO.kicker}
              </span>
              <h1 className="bd-display m-0 text-[clamp(40px,6.5vw,80px)] leading-[.95] font-extrabold tracking-[-.035em] text-balance">
                {HERO.title}
              </h1>
              <p className="m-0 max-w-[46ch] text-[clamp(17px,1.5vw,20px)] leading-normal text-pretty text-(--bd-hero-soft)">
                {HERO.text}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={REGISTER_HREF} className={ctaPrimary}>
                  Cadastrar meu restaurante
                </Link>
                <Link
                  href="#como-funciona"
                  className="inline-flex min-h-12 items-center rounded-full border-[1.5px] border-(--bd-hero-ink) px-[26px] py-4 text-base font-semibold"
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
                      ? "bg-(--bd-yellow) text-(--bd-on-yellow)"
                      : "border border-(--bd-line) bg-(--bd-surface)"
                  }`}
                >
                  <span
                    className={`bd-mono flex size-11 items-center justify-center rounded-xl ${
                      last ? "bg-[#1C120C] text-white" : "bg-(--bd-step-bg) text-(--bd-step-fg)"
                    }`}
                    aria-hidden
                  >
                    {step.n}
                  </span>
                  <h3 className="bd-display m-0 text-[22px] font-semibold">{step.title}</h3>
                  <p className={`m-0 text-[15px] leading-normal ${last ? "" : "text-(--bd-muted)"}`}>
                    {step.text}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>

        <section
          id="vantagens"
          className="scroll-mt-20 border-y border-(--bd-line) bg-(--bd-surface)"
        >
          <div className="mx-auto grid max-w-[1240px] grid-cols-[repeat(auto-fit,minmax(min(100%,400px),1fr))] items-start gap-[clamp(32px,5vw,64px)] px-4 py-[clamp(64px,8vw,104px)] sm:px-[clamp(16px,4vw,40px)]">
            <div className="flex flex-col gap-3 md:sticky md:top-[100px]">
              <span className={kicker}>VANTAGENS</span>
              <h2 className={sectionTitle}>Mais pedidos, menos dor de cabeça.</h2>
              <p className="m-0 max-w-[40ch] text-lg leading-[1.55] text-(--bd-muted)">
                Tudo o que o restaurante precisa para vender por delivery, num só lugar.
              </p>
            </div>
            <ul className="m-0 flex list-none flex-col border-t-2 border-(--bd-ink) p-0">
              {ADVANTAGES.map((item) => (
                <li
                  key={item.n}
                  className="grid grid-cols-[48px_minmax(0,1fr)] gap-4 border-b border-(--bd-line) py-6"
                >
                  <span className="bd-mono pt-1 text-[13px] text-(--bd-accent)" aria-hidden>
                    {item.n}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="bd-display m-0 text-[22px] font-semibold tracking-[-.01em]">{item.title}</h3>
                    <p className="m-0 text-base leading-normal text-(--bd-muted)">{item.text}</p>
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
          <div className="flex flex-col items-start gap-4 rounded-[20px] bg-(--bd-hero-bg) p-7 text-(--bd-hero-ink) sm:flex-row sm:items-center sm:justify-between">
            <p className="bd-display m-0 text-2xl font-extrabold tracking-[-.02em]">
              Pronto para começar?
            </p>
            <Link href={REGISTER_HREF} className={ctaPrimary}>
              Cadastrar meu restaurante
            </Link>
          </div>
        </section>
      </main>

      <BearaDeliveryFooter />
    </BearaDeliveryShell>
  );
}
