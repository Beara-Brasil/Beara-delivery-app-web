import Link from "next/link";

import { BearaDeliveryMark, BearaDeliveryWordmark } from "./mark";

export function BearaDeliveryFooter() {
  return (
    <footer className="bg-(--bd-footer-bg) text-(--bd-footer-text)">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm sm:px-[clamp(16px,4vw,40px)]">
        <Link href="/" className="flex items-center gap-2.5 text-white" aria-label="Beara Delivery: início">
          <BearaDeliveryMark size={26} className="text-white" />
          <BearaDeliveryWordmark accentClassName="text-(--bd-yellow)" />
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
  );
}
