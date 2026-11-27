import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BearaDeliveryFooter } from "@/components/beara-delivery/footer";
import { BearaDeliveryMark, BearaDeliveryWordmark } from "@/components/beara-delivery/mark";
import { BearaDeliveryShell } from "@/components/beara-delivery/shell";
import { LOGIN_HREF, STEPS } from "@/app/restaurant-landing-page/content";

import { RegisterForm } from "./_components/register-form";

export const metadata: Metadata = {
  title: "Cadastro de restaurante",
  description: "Cadastre seu restaurante no Beara Delivery. Sem taxa de adesão.",
};

export default function RestaurantRegisterPage() {
  return (
    <BearaDeliveryShell>
      <header className="sticky top-0 z-20 border-b border-(--bd-line) bg-(--bd-surface)">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-3 px-4 sm:h-[68px] sm:px-[clamp(16px,4vw,40px)]">
          <Link
            href="/restaurant-landing-page"
            className="inline-flex min-h-11 items-center gap-2 text-[15px] font-semibold hover:text-(--bd-accent)"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Voltar
          </Link>
          <Link href="/" className="flex items-center gap-2 text-(--bd-ink)" aria-label="Beara Delivery: início">
            <BearaDeliveryMark size={30} className="size-7 shrink-0 sm:size-[30px]" />
            <span className="hidden sm:inline">
              <BearaDeliveryWordmark accentClassName="text-(--bd-accent)" />
            </span>
          </Link>
          <Link href={LOGIN_HREF} className="inline-flex min-h-11 items-center text-[15px] font-semibold hover:text-(--bd-accent)">
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1240px] flex-1 items-start gap-6 px-4 py-6 sm:px-[clamp(16px,4vw,40px)] sm:py-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <aside className="relative flex flex-col gap-5 overflow-hidden rounded-[24px] bg-(--bd-hero-bg) p-6 text-(--bd-hero-ink) sm:p-8 lg:sticky lg:top-[92px]">
          <span className="bd-mono relative self-start rounded-full bg-(--bd-surface) px-3.5 py-2 text-[13px] text-(--bd-accent)">
            {">_ CADASTRO DE RESTAURANTE"}
          </span>
          <h1 className="bd-display relative m-0 text-[clamp(36px,5vw,56px)] leading-[.95] font-extrabold tracking-[-.035em] text-balance">
            Cadastre seu restaurante.
          </h1>
          <p className="relative m-0 max-w-[40ch] text-[17px] leading-normal text-(--bd-hero-soft)">
            Leva poucos minutos e a conta fica pronta na hora. Sem taxa de adesão.
          </p>

          {/* No celular, os passos saem: o formulário precisa aparecer logo. */}
          <ol className="relative m-0 hidden list-none flex-col gap-4 p-0 lg:flex">
            {STEPS.map((step) => (
              <li key={step.n} className="flex gap-3">
                <span
                  className="bd-mono flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-(--bd-surface) text-sm text-(--bd-accent)"
                  aria-hidden
                >
                  {step.n}
                </span>
                <div className="flex flex-col gap-0.5">
                  <strong className="bd-display text-lg">{step.title}</strong>
                  <span className="text-[15px] leading-snug text-(--bd-hero-soft)">{step.text}</span>
                </div>
              </li>
            ))}
          </ol>

          <Image
            src="/brand/bili.webp"
            alt="Bili, mascote do Beara Delivery"
            width={560}
            height={542}
            sizes="200px"
            className="relative hidden h-auto w-[200px] self-end drop-shadow-[0_14px_18px_rgba(90,35,5,.35)] lg:block"
          />
        </aside>

        <RegisterForm />
      </main>

      <BearaDeliveryFooter />
    </BearaDeliveryShell>
  );
}
