/**
 * Opção "Pagar agora" do checkout, pelo Mercado Pago (ML-01).
 *
 * Fica fora de CHECKOUT_PAYMENT_METHODS de propósito: quem cria o pagamento é
 * o POST /payment/checkout no back (como CREDIT_CARD/IMMEDIATE), não o
 * POST /payment do checkout. Mora aqui, e não no hook do checkout, para o
 * componente da forma de pagamento não importar o hook inteiro.
 */
export const ONLINE_PAYMENT_OPTION = "online_mercado_pago";
