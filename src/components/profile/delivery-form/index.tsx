"use client";

import { ChevronLeft } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { HandleAddAddress } from "@/components/profile/addresses";
import { toast } from "sonner";
import {
  AddressCoreFields,
  type AddressCoreFieldsProps,
} from "./address-core-fields";

export type {
  AddressFieldProps,
  NeighborhoodOption,
  PinStatusProps,
} from "./address-core-fields";

type Props = AddressCoreFieldsProps & {
  handleCloseAddressModal: () => void;
  handleAddAddress: HandleAddAddress;
  isSavingAddress: boolean;
  isEditing?: boolean;
};

/**
 * Modal de endereço do perfil do cliente e da loja: os campos do núcleo
 * (`AddressCoreFields`) dentro de uma janela, com Voltar e Salvar.
 *
 * No celular a janela ocupa a tela toda (LDMF-540): o cabeçalho fica em cima,
 * os campos rolam no meio e o Salvar fica sempre à vista no rodapé. O mapa
 * fica preso no topo dos campos (`AddressMapPanel`, LDMF-542).
 */
export function DeliveryForm({
  handleCloseAddressModal,
  handleAddAddress,
  isSavingAddress,
  isEditing = false,
  ...coreFields
}: Props) {
  const { addressForm } = coreFields;

  return (
    <Dialog open onOpenChange={(open) => !open && handleCloseAddressModal()}>
      <DialogContent
        hideClose
        className="flex h-dvh max-h-dvh w-full max-w-none flex-col gap-0 overflow-hidden rounded-none border-0 p-0 outline-none sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl sm:border"
        // Sem foco automático no CEP: no celular o teclado abria na hora e
        // cobria metade do modal, num campo que quase ninguém sabe e que o
        // app preenche sozinho. O foco fica na janela (Tab segue funcionando).
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          (event.currentTarget as HTMLElement | null)?.focus?.();
        }}
      >
        {/* Uma linha só (Voltar + título): no celular o cabeçalho fica preso
            em cima dos campos, e ícone e subtítulo gastavam ~90 px (pedido
            do produto, 27/11). A descrição fica para o leitor de tela. */}
        <DialogHeader className="relative flex min-h-14 shrink-0 flex-row items-center justify-center border-b border-border px-14 py-2 text-center sm:text-center">
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Voltar"
              disabled={isSavingAddress}
              className="absolute top-1/2 left-2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-foreground transition-colors hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft className="size-5" aria-hidden />
            </button>
          </DialogClose>
          <DialogTitle className="text-base leading-tight font-extrabold tracking-tight">
            {isEditing ? "Editar Endereço" : "Adicionar Novo Endereço"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Comece pelo CEP. Sem CEP, preencha a rua e o bairro: o mapa mostra
            o local na hora.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={addressForm.handleSubmit(handleAddAddress, (errors) => {
            const firstError = Object.values(errors)[0];
            toast.error(
              firstError?.message ||
                "Verifique os campos obrigatórios do endereço",
            );
          })}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {/* Perfil e loja: quem cadastra costuma estar no lugar. */}
            <AddressCoreFields showUseLocation {...coreFields} />
          </div>

          <div className="flex shrink-0 gap-2 border-t border-border bg-background px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
            {/* No celular o Voltar do cabeçalho faz esse papel. */}
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseAddressModal}
              disabled={isSavingAddress}
              className="hidden h-12 rounded-xl px-5 sm:inline-flex"
            >
              Cancelar
            </Button>
            <GradientButton
              type="submit"
              isLoading={isSavingAddress}
              loadingText={isEditing ? "Atualizando..." : "Salvando..."}
              disabled={isSavingAddress}
              className="h-12 flex-1 rounded-xl text-base font-bold"
            >
              {isEditing ? "Atualizar Endereço" : "Salvar Endereço"}
            </GradientButton>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
