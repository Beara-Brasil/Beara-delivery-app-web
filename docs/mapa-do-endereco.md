# Mapa do endereço

Como o mapa do formulário de endereço se comporta e por quê. Vale para todo
lugar que cadastra endereço, porque é um componente só: o `AddressMap`, dentro
do `AddressCoreFields`, que serve a gaveta de endereço do cabeçalho, o modal
do perfil do cliente, o modal do perfil da loja e o endereço novo do checkout.
Card: LDMF-542.

## Resumo

1. O mapa **acompanha os campos**: começa no Brasil e vai aproximando até a
   cidade conforme o cliente preenche, com a câmera travada.
2. Quando o cliente **escreve o bairro ou marca um ponto**, a câmera fica
   livre, mas presa à cidade.
3. Quando o cliente **marca um ponto** (toque, arrasto do pino ou "Usar minha
   localização"), os **campos acompanham o pino**: muda só o que mudou, e o
   Número nunca muda.

## 1. Câmera por etapa

| Etapa | Quando | Câmera | Mexer no mapa |
| --- | --- | --- | --- |
| `country` | nada preenchido | Brasil | travado |
| `state` | estado escolhido | o estado | travado |
| `city` | cidade escolhida | a cidade | travado |
| `free` | bairro escrito **ou** pino marcado | o pino, no nível do bairro | livre, presa à cidade com 1,5 km de folga |

- **Travado** quer dizer sem arrasto e sem zoom. O **clique continua ligado**
  em todas as etapas: tocar no Brasil ou no estado já marca o pino, preenche
  os campos e pula direto para a etapa livre.
- **Na etapa livre**, dá para aproximar à vontade e afastar só até ver a cidade
  inteira (o zoom mínimo é o que enquadra a cidade). Arrastar para fora da
  cidade para na borda.
- **Os botões + e − estão ocultos** (`zoomControl={false}` em
  `leaflet-address-map.tsx`). Para voltar, é só trocar para `true`.
- **A roda do mouse dá zoom só na etapa livre.** Nas travadas ela continua
  rolando o formulário, para a rolagem não parar no mapa. No PC, sem os botões,
  é o jeito de aproximar e afastar.
- **Zoom fracionado** (`zoomSnap={0.25}`): o enquadramento fica justo no
  Brasil, no estado e na cidade, em vez de arredondar para o nível inteiro de
  baixo. Com zoom inteiro e 220 px, o Brasil ocupava 12% do mapa no PC e
  aparecia a África.

## Onde o mapa fica

O mapa fica **no topo do formulário e preso ao rolar** (`AddressMapPanel`, em
`src/components/profile/delivery-form/address-map-panel.tsx`): o cliente vê o
mapa reagir enquanto preenche os campos. Embaixo dos campos ele ficava longe
do que estava sendo preenchido; fixo embaixo, empilhava com o botão Salvar.

| Situação | Altura | Brasil no mapa (etapa Brasil) |
| --- | --- | --- |
| Celular | 180 px | 42% (343 px de largura) |
| Celular, digitando num campo | 110 px | 25% |
| PC | 280 px | ~53% |

- **Preso só dentro de janela que rola** (modal do perfil e da loja, gaveta do
  cabeçalho). O padding da janela é medido na hora, para o mapa colar no topo.
  No **checkout**, que rola a página inteira e tem cabeçalho fixo, o mapa fica
  no topo do formulário sem prender.
- **Encolhe com o teclado**: no celular (tela de toque), com o foco num campo
  de digitação, o mapa cai para 110 px; checkbox e select não contam. Ao sair
  do campo, volta. No PC não encolhe.
- **Na tela vem primeiro, no código vem por último** (`order-first`): a ordem
  do Tab continua CEP → ... → mapa.
- "Usar minha localização" fica em cima do mapa, e embaixo dele fica uma linha
  só: o aviso de endereço não encontrado, a dica de conferir o pino, ou o
  pedido de marcar o pino.

### De onde vêm os contornos

Os retângulos de estado e cidade vêm da **malha do IBGE**
(`/api/v3/malhas/estados/{UF}` e `/api/v3/malhas/municipios/{código}`,
`qualidade=minima`), em `src/services/ibge.ts`. O código do município sai da
mesma lista de cidades que o formulário já carrega (mesma chave de cache).

**Por que não o Nominatim:** medido em 26/11/2026, o retângulo do Espírito
Santo no Nominatim vai até a longitude -28,6, porque inclui as ilhas de
Trindade e Martim Vaz, a 1.000 km da costa: o zoom no estado mostrava quase só
oceano. Pernambuco (Fernando de Noronha) e Rio Grande do Norte (Atol das
Rocas) têm o mesmo problema. A malha mínima do IBGE não traz essas ilhas, pesa
pouco (ES: 1,8 KB; um município: menos de 1 KB) e não tem o limite de uma
chamada por segundo do Nominatim.

Se o IBGE não responder, a câmera fica no nível acima (cidade sem contorno →
enquadra o estado) e a etapa livre fica sem limite.

### Onde está no código

| O quê | Arquivo |
| --- | --- |
| Etapa, folga e retângulos (funções puras) | `src/lib/map-area.ts` |
| Etapa e contornos para a tela | `src/hooks/use-map-area.ts` |
| Câmera (travar, enquadrar, limitar) | `CameraController` em `src/components/address-map/leaflet-address-map.tsx` |

## 2. Os campos acompanham o pino

Ao marcar um ponto, o app busca o endereço daquela coordenada no Nominatim
(`/reverse`, em `src/lib/nominatim.ts`) e aplica **só o que mudou**, do mais
largo para o mais estreito (`decidePinFill`, em `src/lib/reverse-fill.ts`):

| O ponto novo está em | Muda |
| --- | --- |
| outra cidade (ou outro estado) | Estado (se mudou), Cidade, Bairro e Rua |
| outro bairro da mesma cidade | Bairro e Rua |
| outra rua do mesmo bairro | só a Rua |
| o mesmo lugar | nada |

- **O Número nunca muda.** O mapa erra muito o número da casa, e quem sabe o
  número é o cliente.
- **Bairro e Rua vão juntos** quando a cidade ou o bairro mudam: a rua antiga
  era de outro lugar. Se o mapa não souber o bairro ou a rua do ponto novo, o
  campo fica vazio para o cliente preencher.
- **O que não mudou não é conferido de novo**: trocar só a rua não refaz busca
  de cidade, bairro ou CEP.
- **Cidade nova limpa o CEP**, que era da cidade anterior. Ele volta a ser
  preenchido sozinho pela cidade de CEP único ou pela rua, como em qualquer
  endereço.
- **Bairro do mapa vira o nome oficial da lista** da cidade, inclusive com
  grafia diferente: em Castelo o OpenStreetMap escreve "Bella Vista" e a lista
  tem "Bela Vista" (`matchMapNeighborhood`). Sem par na lista, o bairro entra
  como "Outro", com o nome que o mapa deu.

### Por que os campos não passam pelo caminho normal

Trocar estado, cidade ou bairro à mão limpa os campos seguintes **e o pino**
(`useAddressFields`), e escrever bairro ou rua move o pino (`useAddressPin`).
O preenchimento pelo pino não pode disparar nenhum dos dois: apagaria o Número
e o próprio pino, ou puxaria o pino de volta para o meio da rua. Por isso ele
grava os campos direto no formulário e os marca como "já representados no
pino" (`resetBaseline`). Está em `fillFromPin`, no `useAddressEditor`.

### Uso do Nominatim

A busca pelo pino passa pela mesma fila do resto (no máximo uma chamada por
segundo, regra do servidor público) e tem cache por ponto. Só o último ponto
marcado vale: resposta de um ponto anterior é descartada.

## O que não foi verificado

- Em aparelho real (só no Chromium, no PC).
- Em outras cidades além de Castelo-ES para o casamento de grafia do bairro.
- O OpenStreetMap não conhece rua e bairro em boa parte da zona rural: lá, o
  pino só confirma a cidade, e o cliente preenche o resto.
