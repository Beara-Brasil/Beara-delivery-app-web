import Image from "next/image";

// Cabeça do Bili, o mascote: a mesma imagem do app (`BearMascot`). Antes era
// o símbolo da família Beara (orelhas + blocos); trocado a pedido do produto.
export function BearaDeliveryMark({
  size = 30,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/brand/bear_delivery_icon.png"
      width={size}
      height={size}
      // Sempre dentro de link com aria-label ("Beara Delivery: início")
      alt=""
      className={["object-contain", className].filter(Boolean).join(" ")}
    />
  );
}

export function BearaDeliveryWordmark({ accentClassName }: { accentClassName: string }) {
  return (
    <span className="bd-display whitespace-nowrap text-lg font-extrabold sm:text-[22px] tracking-[.01em]">
      BEARA <span className={`font-semibold ${accentClassName}`}>Delivery</span>
    </span>
  );
}
