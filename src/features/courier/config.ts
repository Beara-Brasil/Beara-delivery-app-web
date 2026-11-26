/**
 * Área do entregador desligada (LDMF-539): a entrega passou a ser do próprio
 * restaurante, e o gerenciamento de entregadores vai para o Beara Entregas.
 *
 * O código continua aqui em `src/features/courier`, só fora de vista. Para
 * religar, basta trocar para `true`: a rota /delivery-dashboard volta a abrir
 * e o entregador reaparece nos menus, no convite de equipe, no login de teste,
 * na cozinha e no checkout - cada um desses pontos lê esta chave.
 *
 * O back não muda: o pedido de entrega continua criando um registro de entrega
 * PENDING, que fica assim quando a cozinha conclui o pedido.
 */
export const COURIER_ENABLED = false;
