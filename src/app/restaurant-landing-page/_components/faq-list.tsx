"use client";

import { useState } from "react";

import { FAQ } from "../content";

export function FaqList() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-2.5">
      {FAQ.map((item, index) => {
        const open = openIndex === index;
        const answerId = `lb-faq-${index}`;

        return (
          <div
            key={item.question}
            className="overflow-hidden rounded-2xl border border-(--lb-line) bg-(--lb-surface)"
          >
            <h3>
              <button
                type="button"
                aria-expanded={open}
                aria-controls={answerId}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-4 px-[22px] py-4 text-left text-[17px] font-semibold"
              >
                <span className="min-w-0 flex-1">{item.question}</span>
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--lb-bg) text-lg text-(--lb-accent)"
                  aria-hidden
                >
                  {open ? "−" : "+"}
                </span>
              </button>
            </h3>
            <p
              id={answerId}
              hidden={!open}
              className="px-[22px] pb-[22px] text-base leading-[1.55] text-(--lb-muted)"
            >
              {item.answer}
            </p>
          </div>
        );
      })}
    </div>
  );
}
