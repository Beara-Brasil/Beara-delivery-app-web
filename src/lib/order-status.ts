/**
 * Status do pedido (cozinha) e status da entrega (logística) são fluxos
 * separados no backend. Aqui o status do pedido é sempre a fonte da verdade;
 * a entrega só refina o rótulo quando o pedido já saiu para o cliente.
 */

export const ORDER_STEPS = [
  "Confirmado",
  "Em preparo",
  "Pronto",
  "Entregue",
] as const;

/**
 * Pedido pago online (Mercado Pago, ML-01) começa um passo antes: o pedido só
 * é confirmado depois que o pagamento é aprovado.
 */
export const ONLINE_ORDER_STEPS = ["Aguardando pagamento", ...ORDER_STEPS] as const;

/**
 * Pedido em andamento na cozinha. Só estes ganham linha do tempo ao vivo -
 * carrinho, abandonado, concluído e cancelado são estáticos. Status
 * desconhecido também cai fora daqui: melhor um card parado do que uma barra
 * de progresso animada para algo que ninguém está preparando.
 */
const ACTIVE_STATUSES = [
  "AWAITING_PAYMENT",
  "ORDERED",
  "IN_PRODUCTION",
  "READY_FOR_PICKUP",
];

/** Nunca chegou a virar pedido de fato. */
const INERT_STATUSES = ["CART", "ABANDONED"];

const STEP_BY_STATUS: Record<string, number> = {
  AWAITING_PAYMENT: 0,
  ORDERED: 0,
  IN_PRODUCTION: 1,
  READY_FOR_PICKUP: 2,
  COMPLETED: 3,
  CANCELED: 3,
};

// Rotulos curtos: a tag fica na mesma linha do nome da loja, entao cada
// palavra a mais rouba espaco do nome.
const ORDER_STATUS_LABELS: Record<string, string> = {
  CART: "Carrinho",
  AWAITING_PAYMENT: "Aguardando pagamento",
  ORDERED: "Confirmado",
  IN_PRODUCTION: "Em preparo",
  READY_FOR_PICKUP: "Pronto",
  COMPLETED: "Entregue",
  CANCELED: "Cancelado",
  ABANDONED: "Abandonado",
};

/** Entrega já retirada pelo entregador - o pedido está a caminho do cliente. */
const DELIVERY_IN_TRANSIT = ["PICKED_UP"];
const DELIVERY_DELIVERED = ["DELIVERED", "RECEIVED", "COMPLETED"];

/** Aceita tanto o `Order` da API quanto objetos parciais das telas. */
type OrderLike = {
  status?: string | null;
  delivery?: { status?: string | null } | null;
  /** Só o status importa aqui; ausente em rotas que não trazem pagamentos. */
  payments?: Array<{ status?: string | null } | null> | null;
  /** Order do Mercado Pago: o cliente escolheu pagar online (ML-01). */
  mercadoPagoOrderId?: string | null;
};

export function getOrderStatus(order: OrderLike) {
  return String(order?.status ?? "").toUpperCase();
}

function getDeliveryStatus(order: OrderLike) {
  return String(order?.delivery?.status ?? "").toUpperCase();
}

export function isCanceledOrder(order: OrderLike) {
  return getOrderStatus(order) === "CANCELED";
}

/**
 * Algum pagamento do pedido foi reembolsado (pelo app, pelo cancelamento ou
 * no painel do Mercado Pago). Junto com CANCELED, o cliente e a loja veem
 * "Cancelado e reembolsado" em vez de só "Cancelado" (ML-01).
 */
export function isRefundedOrder(order: OrderLike) {
  return (order?.payments ?? []).some(
    (payment) => String(payment?.status ?? "").toUpperCase() === "REFUNDED",
  );
}

export function isActiveOrder(order: OrderLike) {
  return ACTIVE_STATUSES.includes(getOrderStatus(order));
}

/** Carrinho ou pedido abandonado: aparece na lista, mas sem acompanhamento. */
export function isInertOrder(order: OrderLike) {
  return INERT_STATUSES.includes(getOrderStatus(order));
}

export function getOrderStep(order: OrderLike) {
  const step = STEP_BY_STATUS[getOrderStatus(order)];

  if (step === undefined) return 0;

  // Entrega concluída antecipa o último passo mesmo antes de o restaurante
  // fechar o pedido como COMPLETED.
  if (step === 2 && DELIVERY_DELIVERED.includes(getDeliveryStatus(order))) {
    return 3;
  }

  return step;
}

/** O cliente escolheu "Pagar agora" (Mercado Pago). */
export function isOnlinePaymentOrder(order: OrderLike) {
  return (
    Boolean(order?.mercadoPagoOrderId) ||
    getOrderStatus(order) === "AWAITING_PAYMENT"
  );
}

/**
 * Linha do tempo do pedido: as etapas e em qual ele está. Pedido pago online
 * tem "Aguardando pagamento" antes de "Confirmado"; os demais, as 4 de sempre.
 */
export function getOrderTimeline(order: OrderLike): {
  steps: readonly string[];
  step: number;
} {
  const step = getOrderStep(order);
  if (!isOnlinePaymentOrder(order)) return { steps: ORDER_STEPS, step };

  const awaitingPayment = getOrderStatus(order) === "AWAITING_PAYMENT";
  return { steps: ONLINE_ORDER_STEPS, step: awaitingPayment ? 0 : step + 1 };
}

export function getOrderStatusLabel(order: OrderLike) {
  const status = getOrderStatus(order);

  if (status === "READY_FOR_PICKUP") {
    const deliveryStatus = getDeliveryStatus(order);

    if (DELIVERY_IN_TRANSIT.includes(deliveryStatus)) return "A caminho";
    if (DELIVERY_DELIVERED.includes(deliveryStatus)) return "Entregue";
  }

  if (status === "CANCELED" && isRefundedOrder(order)) {
    return "Cancelado e reembolsado";
  }

  return ORDER_STATUS_LABELS[status] ?? "Em andamento";
}

export function getOrderStatusBadgeClass(order: OrderLike) {
  if (isCanceledOrder(order)) return "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400";
  if (isInertOrder(order)) return "bg-gray-100 text-gray-500";
  if (isActiveOrder(order)) return "bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400";

  return "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400";
}

/** Estados da tela "Acompanhe seu pedido". */
export type OrderTrackingStatus =
  | "awaiting_payment"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivering"
  | "delivered";

/**
 * Traduz status do pedido (+ entrega, quando existe) para o passo do rastreio.
 *
 * O mapa antigo desta tela só conhecia `preparing`, `ready`, `in_transit` e
 * afins - nenhum deles existe nos enums do backend. Com isso `IN_PRODUCTION` e
 * `READY_FOR_PICKUP` caíam no fallback e o rastreio ficava travado em
 * "Pedido confirmado" até o pedido ser concluído.
 */
export function getOrderTrackingStatus(order: OrderLike): OrderTrackingStatus {
  const deliveryStatus = getDeliveryStatus(order);

  if (DELIVERY_DELIVERED.includes(deliveryStatus)) return "delivered";

  switch (getOrderStatus(order)) {
    case "COMPLETED":
      return "delivered";
    case "READY_FOR_PICKUP":
      return DELIVERY_IN_TRANSIT.includes(deliveryStatus)
        ? "delivering"
        : "ready";
    case "IN_PRODUCTION":
      return "preparing";
    case "AWAITING_PAYMENT":
      return "awaiting_payment";
    default:
      return "confirmed";
  }
}
