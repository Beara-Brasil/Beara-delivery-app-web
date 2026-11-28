// Textos da landing de restaurantes num lugar só (LDMF-538). Só entra aqui o
// que o app faz hoje: frete estimado por endereço (o tempo de entrega está
// escondido, LDMF-534), entrega feita pelo próprio restaurante e nenhuma
// promoção ativa. Prometer o que não existe já virou problema antes.

export const REGISTER_HREF = "/restaurant-register";
export const LOGIN_HREF = "/?openAuth=true";

export const NAV_LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#vantagens", label: "Vantagens" },
  { href: "#duvidas", label: "Dúvidas" },
] as const;

export const HERO = {
  kicker: ">_ SEJA UM PARCEIRO BEARA",
  title: "Seu restaurante no app que a cidade já usa.",
  text: "Receba pedidos de clientes perto de você, com o frete calculado pelo endereço. Você cozinha, o painel organiza os pedidos.",
} as const;

export const STEPS = [
  {
    title: "Cadastre a loja",
    text: "Envie os dados do restaurante e o raio de entrega. A conta fica pronta na hora.",
  },
  {
    title: "Monte o cardápio",
    text: "Fotos, preços e categorias. Defina também o horário de funcionamento.",
  },
  {
    title: "Comece a vender",
    text: "Com o cardápio e o horário prontos, os pedidos chegam direto no seu painel.",
  },
].map((step, i) => ({ ...step, n: String(i + 1).padStart(2, "0") }));

export const ADVANTAGES = [
  {
    title: "Clientes da sua região",
    text: "Você define o raio de entrega e recebe pedidos de quem está dentro dele.",
  },
  {
    title: "Frete calculado por endereço",
    text: "O cliente vê o frete antes de pedir, sem você precisar responder um a um.",
  },
  {
    title: "Cozinha organizada",
    text: "Os pedidos ficam separados por etapa: novos, em preparo e prontos.",
  },
  {
    title: "Painel simples",
    text: "Atualize o status dos pedidos e edite o cardápio pelo celular ou pelo computador.",
  },
].map((item, i) => ({ ...item, n: String(i + 1).padStart(2, "0") }));

export const FAQ = [
  {
    question: "Preciso ter entregador próprio?",
    answer:
      "Sim. Por enquanto, a entrega é feita pelo próprio restaurante. Em breve, o Beara Entregas vai ajudar nessa parte.",
  },
  {
    question: "Quanto custa para participar?",
    answer:
      "Não tem taxa de adesão: você cadastra a loja sem pagar nada. Para receber pagamentos online, conecte a conta Mercado Pago do restaurante no painel.",
  },
  {
    // Sem prometer que a loja aparece na hora: a lista do app não mostra toda
    // loja recém-cadastrada (Kauan, 28/11).
    question: "Em quanto tempo consigo começar?",
    answer:
      "O cadastro é imediato e você já entra no painel. Lá você monta o cardápio e o horário de funcionamento para começar a receber pedidos.",
  },
  {
    question: "Como abro e fecho a loja?",
    answer:
      "A loja abre e fecha sozinha, pelo horário de funcionamento que você define no painel.",
  },
  {
    question: "Já tenho conta de cliente. Preciso criar outra?",
    answer:
      "Não. Entre com a sua conta e cadastre o restaurante nela mesma.",
  },
] as const;

// Mensagens do Bili no painel de demonstração, na ordem do fluxo da cozinha.
export const BILI_MESSAGES = {
  start: "Pedido novo chegando! Bora aceitar?",
  preparing: "Tá saindo do forno! Cheirinho bom daqui.",
  ready: "Pedido pronto! Agora é só entregar.",
  completed: "Concluído! E já chegou outro pedido.",
} as const;

export const DEMO_ORDERS = [
  { id: "#1042", customer: "Mariana Souza", items: "2× X-Burguer, 1× Refri lata", payment: "Pix", total: 58.9, minutes: 2 },
  { id: "#1041", customer: "Carlos Lima", items: "1× Pizza calabresa G, 1× Guaraná 2L", payment: "Cartão", total: 74, minutes: 9 },
  { id: "#1040", customer: "Ana Ribeiro", items: "1× Açaí 500ml + granola", payment: "Dinheiro", total: 22.5, minutes: 15 },
] as const;
