# Decisões: por que é assim

Coisas que parecem estranhas, ou que dá vontade de "consertar", mas que
foram decididas de propósito. Cada linha tem o card do Jira com o motivo.

**Antes de desfazer qualquer item daqui, pergunte.** A regra do `CLAUDE.md`
vale: nunca "corrija" comportamento que pode ser intencional.

Legenda da última coluna:

- ✅ **Manter**: continua certo.
- 🔁 **Rever quando...**: é provisório e depende de algo externo.
- ⚠️ **Dívida**: funciona, mas vale melhorar num card próprio.

## Desempenho

| Decisão | Por quê | Card | Continuar? |
| --- | --- | --- | --- |
| Sem barrel `@/hooks`; importe cada hook pelo arquivo | O barrel levava os hooks do app inteiro e o zod para todas as telas. A home caiu de 450 para 369 kB | LDMF-478 | ✅ O lint dá erro se alguém importar `@/hooks` |
| Sem `backdrop-blur` no `Card`, no header e nos elementos fixos | Cada desfoque vira uma camada de GPU. No PC, o cardápio rolando caiu de 1823 para 338 ms de GPU a cada 3 s | LDMF-475 | ✅ Não use `backdrop-blur` em lista nem em elemento fixo |
| Manchas do fundo paradas (sem `animate-pulse`) | A animação contínua mantinha a GPU ocupada com a tela parada | LDMF-476 | ✅ Evite animação infinita, principalmente dentro de card |
| Sentry sem Session Replay | O Replay dobrava o travamento ao abrir a tela e somava 2 a 4 MB por aba | LDMF-477 | ✅ |
| Mudança visual pequena é aceita quando há ganho de desempenho | Ex.: o header ficou quase branco em vez de translúcido | LDMF-479 | ✅ |

## Dados e back

| Decisão | Por quê | Card | Continuar? |
| --- | --- | --- | --- |
| Token só em cookie `httpOnly`; tudo passa por `/api/proxy` | O JavaScript da página não consegue ler o token | — | ✅ |
| Proxy só autentica quando a chamada pede (`X-Auth-Required`) | Algumas rotas públicas respondem diferente com token | — | ✅ |
| Cache do proxy `private`, nunca `public` | Com `public`, o CDN da Vercel mostrava dado velho por até 2 min | LDMF-348 | ✅ |
| Loja aberta/fechada calculada no front pelo horário | O `isOpen` guardado no back fica desatualizado | LDMF-469 | 🔁 Quando o back calcular na hora, o front pode voltar a confiar nele |
| Horário sempre de Brasília (`America/Sao_Paulo`), sem fuso por loja | Decisão do responsável; o `timeZone` por empresa do back não é usado | LDMF-480 | ✅ Até existir loja fora do fuso |
| Loja ligada ao caixa usa o `isOpen` do back | Nenhuma loja usa isso hoje | LDMF-469, LDMF-480 | 🔁 Rever quando alguma loja usar |
| Listagem da home calcula Aberto/Fechado só pela grade (`openingHours` de `GET /company`), sem uma chamada por loja | `GET /company` não traz `linkedToCashRegister`; loja ligada ao caixa ficou fora do escopo. Sem o campo `openingHours` na resposta, a linha não mostra selo | LDMF-480 | 🔁 Rever quando alguma loja usar o caixa |
| Dado pessoal fora do `localStorage` | Privacidade: e-mail, telefone e nascimento ficam só em memória | LDMF-424 | ✅ |
| Carrinho salva só `orderId` e `ownerId` | O carrinho de verdade é o do back; o `ownerId` evita usar o carrinho de outra conta | LDMF-317 (contexto) | ✅ |
| `/api/auth/register` não repassa o `role` do corpo | Qualquer pessoa conseguia criar conta admin pelo site | LDMF-425 | ✅ Nunca repasse `role` vindo do navegador |
| Foto de prato baixada pelo servidor (`/api/product-image/download`) | R2 e S3 não liberam CORS | LDMF-489 | ✅ |
| "Transferência Bancária" fora das escolhas de método (Caixa e Finanças) | Decisão do responsável; não foi conferido na doc do back se ele recusa o método | LDMF-391 | ✅ |

## Telas e regras de negócio

| Decisão | Por quê | Card | Continuar? |
| --- | --- | --- | --- |
| Só o entregador abre `/delivery-dashboard` | A gerência troca pagamento em Finanças, não ali | LDMF-324 | ✅ |
| Área do entregador desligada (`COURIER_ENABLED = false` em `src/features/courier/config.ts`): `/delivery-dashboard` responde 404 e o entregador some de menus, convite de equipe, login de teste, cozinha e checkout | A entrega passou a ser do próprio restaurante; o gerenciamento de entregadores vai para o Beara Entregas. O código fica em `src/features/courier`, só fora de vista. No back, o pedido de entrega continua criando uma entrega `PENDING`, que fica assim quando a cozinha conclui o pedido | LDMF-539 | 🔁 Para religar, troque a chave para `true` |
| Conta de restaurante vê o cardápio de outra loja só para leitura | Staff não compra | LDMF-473 | ✅ |
| Staff não vê endereços nem histórico no perfil | O back não libera essas rotas para staff | LDMF-481 | ✅ |
| Entregador não aceita entrega a mais de 25 km | Regra de negócio; endereço sem coordenada também bloqueia | LDMF-321 | ✅ O filtro do front só esconde; a regra de verdade é do back |
| Comanda em duas vias (cozinha sem preço; entrega/balcão com valores e troco) | Referência do Plus Delivery | LDMF-471 | ✅ |
| Configurações do caixa salvam na hora, só neste navegador | Não existe rota no back para isso | LDMF-382, LDMF-463 | 🔁 Se o back ganhar a rota, migrar |
| Cópia de prato nasce indisponível e abre no modal de edição | Definido no card; a pessoa revisa antes de liberar | LDMF-489 | ✅ |
| Tema escuro desligado (`THEME_LOCKED_TO_LIGHT = true`) | O design escuro não foi revisado | — | 🔁 Os tokens já existem; falta revisar tela por tela |
| CSP em modo "só relata" | Observar o que quebraria antes de bloquear | LDMF-426 | 🔁 Ligar `CSP_ENFORCE` depois de conferir os relatos |
| Landing e cadastro de restaurantes com identidade própria (fontes Bricolage, Instrument Sans e JetBrains Mono; laranja `#F26B1D`), escopada em `.bd` pelo `BearaDeliveryShell` (`src/components/beara-delivery/`) | É a família da marca Beara (o site institucional usa as mesmas fontes e símbolo, em azul e ciano). Só essas duas telas usam por enquanto; trocar o `brand-500` do app inteiro é decisão separada | LDMF-538 | 🔁 Rever quando decidirem levar a identidade para o resto do app |
| Landing de restaurantes sem números de vitrine, tempo de entrega nem promoções | "500+ restaurantes", "50k pedidos", "4.8★", "entrega em 30 min" e "repasse em 48h" não tinham fonte. O tempo de entrega está escondido no app (LDMF-534), não há promoção ativa e a entrega é do próprio restaurante | LDMF-538 | ✅ Só volte a citar quando existir de verdade; os textos ficam em `content.ts` |

## Código

| Decisão | Por quê | Continuar? |
| --- | --- | --- |
| Algumas imagens continuam `<img>` (foto do cliente, logo do restaurante, prato, miniaturas do entregador) | Host não declarado no `next.config` derruba a tela inteira | 🔁 Até decisão em card próprio (`CLAUDE.md`) |
| `@/utils` (barrel) configura o dayjs ao ser importado (pt-BR, utc, plugins) | Quem usa `dayjs` conta com isso | ⚠️ Não troque os imports de `@/utils` por caminhos diretos sem garantir que o dayjs continue configurado |
| Existem 4 `formatCurrency` diferentes | Comportamento diferente para valor inválido: uns mostram "R$ 0,00", outro "R$ NaN" | ⚠️ Unificar muda o que aparece na tela; precisa de card e teste |
| `"use client"` na maioria dos arquivos | O app é client-side (Zustand, TanStack Query, socket) | ✅ |
| Teclado do celular: `interactiveWidget: "resizes-content"` no `viewport` e `DialogContent` que se ajusta ao `visualViewport` (`useKeyboardViewport`) | Com a página mantendo o tamanho (padrão do Chrome no Android e do Safari no iPhone), os campos de baixo das janelas centralizadas ficavam atrás do teclado sem ter como subir. O iPhone ignora a primeira; a segunda cobre os dois (LDMF-541) | ✅ Janela nova com campo: use o `DialogContent`, não uma janela fixa própria |
