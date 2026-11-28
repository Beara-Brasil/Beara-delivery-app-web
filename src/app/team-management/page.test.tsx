import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { StaffMember } from "@/hooks/use-team-management";
import { useAuthStore } from "@/stores/auth-store";

const {
  mockHookState,
  mockHandleRequestRemove,
  mockHandleCancelRemove,
  mockHandleConfirmRemove,
} = vi.hoisted(() => ({
  mockHookState: {
    staff: [] as StaffMember[],
    allStaff: [] as StaffMember[],
    searchQuery: "",
    setSearchQuery: vi.fn(),
    isLoadingStaff: false,
    isStaffError: false,
    staffError: null,
    refetchStaff: vi.fn(),
    isModalOpen: false,
    formData: { email: "", role: "cook" as const },
    removeTarget: null as StaffMember | null,
    isInviting: false,
    isRemoving: false,
    handleOpenInviteModal: vi.fn(),
    handleCloseModal: vi.fn(),
    updateFormField: vi.fn(),
    handleSendInvite: vi.fn(),
    handleRequestRemove: vi.fn(),
    handleCancelRemove: vi.fn(),
    handleConfirmRemove: vi.fn(),
  },
  mockHandleRequestRemove: vi.fn(),
  mockHandleCancelRemove: vi.fn(),
  mockHandleConfirmRemove: vi.fn(),
}));

mockHookState.handleRequestRemove = mockHandleRequestRemove;
mockHookState.handleCancelRemove = mockHandleCancelRemove;
mockHookState.handleConfirmRemove = mockHandleConfirmRemove;

// Os testes desta página valem com a área do entregador desligada
// (LDMF-539), qualquer que seja o valor real da chave.
vi.mock("@/features/courier/config", () => ({ COURIER_ENABLED: false }));

vi.mock("@/components/protected-route", () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/admin-page-layout", () => ({
  // O botão único do header vira um botão simples: a casca tem teste próprio.
  AdminPageLayout: ({
    children,
    action,
  }: {
    children: ReactNode;
    action?: { label: string; onClick: () => void };
  }) => (
    <div>
      {action && (
        <button type="button" onClick={action.onClick}>
          {action.label}
        </button>
      )}
      <div>{children}</div>
    </div>
  ),
}));

vi.mock("@/hooks/use-team-management", () => ({
  useTeamManagement: () => mockHookState,
}))

import TeamManagementPage from "./page";

const makeStaff = (
  id: string,
  name: string,
  email: string,
  role: "manager" | "cook" | "delivery" | "financial",
): StaffMember => ({
  id,
  name,
  email,
  role,
});

describe("TeamManagementPage - Exibição e Ações de Remover Membro", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: "owner-id",
        name: "Restaurante Dono",
        email: "owner@restaurante.com",
        cpf: "",
        phone: "",
        birthDate: "",
        role: "owner",
      },
    });

    mockHookState.staff = [
      makeStaff("u-cook", "Carlos Cozinheiro", "carlos@cozinha.com", "cook"),
      makeStaff("u-mgr", "Marcos Gerente", "marcos@gerente.com", "manager"),
      makeStaff("owner-id", "Dono no Staff", "owner@restaurante.com", "manager"),
    ];
    mockHookState.allStaff = mockHookState.staff;
    mockHookState.removeTarget = null;
    mockHookState.isRemoving = false;
  });

  it("não oferece Entregador no convite enquanto a área está desligada (LDMF-539)", () => {
    mockHookState.isModalOpen = true;
    try {
      render(<TeamManagementPage />);
      const funcao = screen.getByLabelText(/Função/) as HTMLSelectElement;
      const opcoes = Array.from(funcao.options).map((option) => option.textContent);
      expect(opcoes).toEqual(["Gerente", "Cozinheiro", "Financeiro"]);
    } finally {
      mockHookState.isModalOpen = false;
    }
  });

  it("quem já é entregador continua aparecendo na equipe", () => {
    mockHookState.staff = [makeStaff("u-del", "Diego Entregador", "diego@entrega.com", "delivery")];
    mockHookState.allStaff = mockHookState.staff;
    render(<TeamManagementPage />);
    expect(screen.getByText("Diego Entregador")).toBeInTheDocument();
  });

  it("exibe cabeçalho Ações e botões de remoção quando logado como owner", () => {
    render(<TeamManagementPage />);

    expect(screen.getByText("Ações")).toBeInTheDocument();

    // Owner pode remover cook e manager, mas NÃO a si mesmo (owner-id)
    expect(
      screen.getByRole("button", { name: "Remover Carlos Cozinheiro" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remover Marcos Gerente" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remover Dono no Staff" }),
    ).not.toBeInTheDocument();
  });

  it("respeita a hierarquia quando logado como manager (não remove outro manager nem a si mesmo)", () => {
    useAuthStore.setState({
      user: {
        id: "u-mgr",
        name: "Marcos Gerente",
        email: "marcos@gerente.com",
        cpf: "",
        phone: "",
        birthDate: "",
        role: "manager",
      },
    });

    render(<TeamManagementPage />);

    // Manager pode remover cook
    expect(
      screen.getByRole("button", { name: "Remover Carlos Cozinheiro" }),
    ).toBeInTheDocument();

    // Manager NÃO pode remover a si mesmo
    expect(
      screen.queryByRole("button", { name: "Remover Marcos Gerente" }),
    ).not.toBeInTheDocument();

    // Manager NÃO pode remover outro manager
    expect(
      screen.queryByRole("button", { name: "Remover Dono no Staff" }),
    ).not.toBeInTheDocument();
  });

  it("chama handleRequestRemove ao clicar no botão de remover", async () => {
    const user = userEvent.setup();
    render(<TeamManagementPage />);

    const removeBtn = screen.getByRole("button", {
      name: "Remover Carlos Cozinheiro",
    });
    await user.click(removeBtn);

    expect(mockHandleRequestRemove).toHaveBeenCalledWith(
      expect.objectContaining({ id: "u-cook", name: "Carlos Cozinheiro" }),
    );
  });

  it("exibe o diálogo de confirmação com aviso de perda de acesso ao painel", async () => {
    const user = userEvent.setup();
    mockHookState.removeTarget = mockHookState.staff[0];

    render(<TeamManagementPage />);

    expect(screen.getByText("Remover da equipe?")).toBeInTheDocument();
    expect(
      screen.getByText(/vai perder o acesso ao painel da empresa/i),
    ).toBeInTheDocument();

    // Clica em Cancelar
    const cancelBtn = screen.getByRole("button", { name: "Cancelar" });
    await user.click(cancelBtn);
    expect(mockHandleCancelRemove).toHaveBeenCalled();

    // Clica em Remover
    const confirmBtn = screen.getByRole("button", { name: "Remover" });
    await user.click(confirmBtn);
    expect(mockHandleConfirmRemove).toHaveBeenCalled();
  });

  it("desabilita botões e mostra feedback de carregamento durante a remoção", () => {
    mockHookState.removeTarget = mockHookState.staff[0];
    mockHookState.isRemoving = true;

    render(<TeamManagementPage />);

    const cancelBtn = screen.getByRole("button", { name: "Cancelar" });
    const confirmBtn = screen.getByRole("button", { name: "Removendo..." });

    expect(cancelBtn).toBeDisabled();
    expect(confirmBtn).toBeDisabled();
  });
});
