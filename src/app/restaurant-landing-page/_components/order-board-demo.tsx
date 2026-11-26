"use client";

import Image from "next/image";
import { useState } from "react";

import { KITCHEN_COLUMNS } from "@/components/kitchen/types";
import { formatCurrency } from "@/utils/format-currency";

import { BILI_MESSAGES, DEMO_ORDERS } from "../content";

// Mesmos nomes, mensagens e botões da cozinha de verdade, para a
// demonstração não prometer um fluxo diferente do painel.
const [NEW_COLUMN, PREP_COLUMN, READY_COLUMN] = KITCHEN_COLUMNS;
const COLUMNS = [
  { config: NEW_COLUMN, tone: "new" },
  { config: PREP_COLUMN, tone: "prep" },
  { config: READY_COLUMN, tone: "ready" },
] as const;

const TONE_CLASSES = {
  new: { box: "bg-(--bd-new-bg) border-(--bd-new-line)", line: "border-(--bd-new-line)", text: "text-(--bd-new-text)" },
  prep: { box: "bg-(--bd-prep-bg) border-(--bd-prep-line)", line: "border-(--bd-prep-line)", text: "text-(--bd-prep-text)" },
  ready: { box: "bg-(--bd-ready-bg) border-(--bd-ready-line)", line: "border-(--bd-ready-line)", text: "text-(--bd-ready-text)" },
} as const;

const AFTER_ADVANCE = [BILI_MESSAGES.preparing, BILI_MESSAGES.ready, BILI_MESSAGES.completed];

export function OrderBoardDemo() {
  // etapa de cada pedido: 0 novo, 1 em preparo, 2 pronto
  const [stages, setStages] = useState<number[]>([0, 1, 2]);
  const [message, setMessage] = useState<string>(BILI_MESSAGES.start);

  // "Concluir" devolve o pedido para Novos: a demonstração roda sem fim
  const advance = (index: number) => {
    const from = stages[index];
    setStages((current) => current.map((stage, i) => (i === index ? (stage + 1) % 3 : stage)));
    setMessage(AFTER_ADVANCE[from]);
  };

  return (
    <div className="relative flex justify-center pt-[clamp(130px,15vw,175px)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center">
        <div className="relative h-[clamp(130px,15vw,175px)] w-full max-w-[560px]">
          <div className="absolute top-[clamp(8px,2vw,24px)] left-0 flex max-w-[58%] flex-col gap-0.5 rounded-[18px_18px_4px_18px] bg-(--bd-surface) px-4 py-3 text-(--bd-ink) shadow-[0_12px_24px_-12px_var(--bd-shadow)]">
            <span className="bd-mono text-xs text-(--bd-accent)">BILI · mascote Beara Delivery</span>
            <strong className="text-[15px] leading-[1.3]" aria-live="polite">
              {message}
            </strong>
          </div>
          <Image
            src="/brand/bili.webp"
            alt="Bili, mascote do Beara Delivery"
            width={560}
            height={542}
            priority
            sizes="(min-width: 1024px) 260px, 190px"
            className="absolute top-0 right-0 h-auto w-[clamp(170px,21vw,260px)] origin-bottom rotate-6 drop-shadow-[0_14px_18px_rgba(90,35,5,.35)]"
          />
        </div>
      </div>

      <div className="relative z-[1] flex w-full max-w-[560px] flex-col gap-3 rounded-[22px] bg-(--bd-surface) p-3.5 text-(--bd-ink) shadow-[0_40px_80px_-30px_var(--bd-shadow)] lg:[transform:perspective(1400px)_rotateY(-6deg)_rotateX(3deg)]">
        <div className="flex items-center justify-between px-1 py-0.5">
          <strong className="bd-display text-lg">Painel de pedidos</strong>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-(--bd-accent)">
            <span className="size-2 rounded-full bg-[#22C55E]" aria-hidden />
            Loja aberta
          </span>
        </div>

        {/* No celular, as colunas rolam para o lado: espremidas em 375px os
            nomes viravam "M…" e o preço saía do card. */}
        <div
          className="-mx-3.5 grid snap-x snap-mandatory auto-cols-[minmax(200px,76%)] grid-flow-col gap-2 overflow-x-auto px-3.5 pb-1 sm:mx-0 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0"
          role="group"
          aria-label="Demonstração do painel da cozinha"
        >
          {COLUMNS.map(({ config, tone }, column) => {
            const toneClasses = TONE_CLASSES[tone];
            const orders = DEMO_ORDERS.map((order, index) => ({ order, index })).filter(
              ({ index }) => stages[index] === column,
            );

            return (
              <section
                key={config.status}
                aria-label={config.label}
                className={`flex min-w-0 snap-start flex-col rounded-[14px] border ${toneClasses.box}`}
              >
                <div className={`flex items-center justify-between border-b px-3 py-2.5 ${toneClasses.line}`}>
                  <strong className={`text-[13px] ${toneClasses.text}`}>{config.label}</strong>
                  <span className="rounded-md bg-(--bd-surface) px-2 py-0.5 text-xs font-semibold">
                    {orders.length}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-2">
                  {orders.map(({ order, index }) => (
                    <article
                      key={order.id}
                      className="flex flex-col rounded-[10px] border border-(--bd-line) bg-(--bd-surface) shadow-[0_4px_10px_-6px_rgba(90,35,5,.25)]"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-(--bd-line) px-2.5 py-2">
                        <strong className="text-[13px]">{order.id}</strong>
                        <span className="text-xs whitespace-nowrap text-(--bd-faint)">{order.minutes} min</span>
                      </div>
                      <div className="flex flex-col gap-1.5 px-2.5 py-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-(--bd-chip) text-xs font-bold text-(--bd-accent)"
                            aria-hidden
                          >
                            {order.customer[0]}
                          </span>
                          <span className="truncate text-xs font-semibold">{order.customer}</span>
                        </div>
                        <span className="text-xs leading-[1.35] text-(--bd-ink-soft)">{order.items}</span>
                        <div className="flex flex-wrap items-baseline justify-between gap-x-1.5 border-t border-(--bd-line) pt-1.5">
                          <span className="text-xs text-(--bd-faint)">{order.payment}</span>
                          <strong className="text-[13px] whitespace-nowrap">{formatCurrency(order.total)}</strong>
                        </div>
                      </div>
                      {config.actionLabel && (
                        <div className="px-2 pb-2">
                          <button
                            type="button"
                            onClick={() => advance(index)}
                            className="min-h-9 w-full cursor-pointer rounded-lg bg-linear-to-r from-(--bd-action-from) to-(--bd-action-to) px-1.5 py-2 text-xs font-semibold text-white"
                          >
                            {config.actionLabel}
                          </button>
                        </div>
                      )}
                    </article>
                  ))}
                  {orders.length === 0 && (
                    <p className="flex min-h-[110px] flex-1 items-center justify-center text-center text-xs text-(--bd-faint)">
                      {config.emptyMessage}
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
