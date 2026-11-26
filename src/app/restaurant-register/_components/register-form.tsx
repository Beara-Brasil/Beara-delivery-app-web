"use client";

import { BirthDateInput } from "@/components/birth-date-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRestaurantRegistration } from "@/hooks/use-restaurant-registration";
import { formatCnpj, formatPhoneDisplay, getBirthDateError } from "@/utils";
import { CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, type ReactNode } from "react";

// Campos no tom da identidade Beara Delivery (variáveis --bd-* do theme.css).
const fieldClass =
  "h-12 rounded-xl border-2 border-(--bd-line) bg-(--bd-surface) text-(--bd-ink) placeholder:text-(--bd-faint) focus-visible:border-(--bd-accent) focus-visible:ring-0 transition-colors";
const labelClass = "text-sm font-semibold text-(--bd-ink) cursor-pointer";
const hintClass = "text-xs text-(--bd-muted)";
const okClass = "flex items-center gap-1 text-xs font-semibold text-(--bd-ready-text)";
const errorClass = "text-xs text-red-700 dark:text-red-300";

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    // O <legend> nativo quebra a borda e abre um vão: fica só para leitor de
    // tela, e o título visível é um texto comum.
    <fieldset className="m-0 flex min-w-0 flex-col gap-4 border-0 border-t border-(--bd-line) p-0 pt-6 first:border-t-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <p className="bd-mono m-0 text-[13px] text-(--bd-accent) uppercase" aria-hidden>
        {title}
      </p>
      {children}
    </fieldset>
  );
}

function Field({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-2">{children}</div>;
}

export function RegisterForm() {
  const {
    isLoggedIn,
    canRegisterOnAccount,
    accountLabel,
    registerData,
    handleInputChange,
    passwordErrors,
    passwordMatch,
    isFormValid,
    isLoading,
    submitMessage,
    handleSubmit,
  } = useRestaurantRegistration();

  // Aceite dos termos e da política (LDMF-281). Só trava o envio na tela: o
  // backend não tem campo pra guardar o aceite, então não vai no corpo.
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="flex flex-col gap-6 rounded-[24px] border border-(--bd-line) bg-(--bd-surface) p-5 shadow-[0_40px_80px_-40px_var(--bd-shadow)] sm:p-8">
      <div className="flex flex-col gap-2">
        <h2 className="bd-display m-0 text-[28px] leading-tight font-extrabold tracking-[-.02em]">
          Dados do cadastro
        </h2>
        <p className="m-0 text-[15px] leading-normal text-(--bd-muted)">
          {isLoggedIn
            ? "Preencha os dados do restaurante. Ele será cadastrado na sua conta, sem criar outra."
            : "Preencha os dados abaixo para criar sua conta e cadastrar seu restaurante. Depois, é só entrar para acessar o painel."}
        </p>
      </div>

      {/* Logado: a empresa vai pra conta atual (LDMF-295). Staff ou dono já
          têm restaurante - aí só explica, sem formulário útil. */}
      {isLoggedIn && (
        <div
          className={
            canRegisterOnAccount
              ? "rounded-xl border border-(--bd-line) bg-(--bd-bg) px-4 py-3 text-sm"
              : "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
          }
        >
          {canRegisterOnAccount ? (
            <>
              Cadastrando o restaurante na conta{" "}
              <strong className="break-all">{accountLabel}</strong>. Depois do
              cadastro, você vai entrar de novo para acessar o painel.
            </>
          ) : (
            "Sua conta já está ligada a um restaurante. Para cadastrar outro, use uma conta de cliente."
          )}
        </div>
      )}

      <form
        onSubmit={(event) => {
          if (!acceptedTerms) {
            event.preventDefault();
            return;
          }
          void handleSubmit(event);
        }}
        className="flex flex-col gap-6"
      >
        <FormSection title="Restaurante">
          <Field>
            <Label htmlFor="tradeName" className={labelClass}>
              Nome fantasia
            </Label>
            <Input
              id="tradeName"
              type="text"
              placeholder="Ex: Pizzaria do João"
              value={registerData.tradeName}
              onChange={(e) => handleInputChange("tradeName", e.target.value)}
              className={fieldClass}
              required
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="legalName" className={labelClass}>
                Razão social
              </Label>
              <Input
                id="legalName"
                type="text"
                placeholder="Ex: Pizzaria do João LTDA"
                value={registerData.legalName}
                onChange={(e) => handleInputChange("legalName", e.target.value)}
                className={fieldClass}
                required
              />
            </Field>

            <Field>
              <Label htmlFor="cnpj" className={labelClass}>
                CNPJ
              </Label>
              <Input
                id="cnpj"
                type="text"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                value={registerData.cnpj}
                onChange={(e) => handleInputChange("cnpj", formatCnpj(e.target.value))}
                maxLength={18}
                className={fieldClass}
                required
              />
            </Field>
          </div>

          <Field>
            <Label htmlFor="description" className={labelClass}>
              Descrição do restaurante
            </Label>
            <Input
              id="description"
              type="text"
              placeholder="Ex: Pizzaria especializada em massas artesanais"
              value={registerData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={fieldClass}
              required
            />
          </Field>

          <Field>
            <Label htmlFor="actionRadius" className={labelClass}>
              Raio de entrega (km)
            </Label>
            <Input
              id="actionRadius"
              type="text"
              inputMode="numeric"
              placeholder="Ex: 10"
              value={registerData.actionRadius}
              onChange={(e) =>
                handleInputChange("actionRadius", e.target.value.replace(/\D/g, "").slice(0, 3))
              }
              aria-describedby="actionRadius-hint"
              className={fieldClass}
            />
            <p id="actionRadius-hint" className={hintClass}>
              Distância máxima de entrega, em km (1 a 3 dígitos). Vazio usa o
              padrão; 0 = loja sem entrega.
            </p>
          </Field>
        </FormSection>

        <FormSection title="Contato">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <Label htmlFor="email" className={labelClass}>
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="restaurante@email.com"
                value={registerData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className={fieldClass}
                required
              />
            </Field>

            <Field>
              <Label htmlFor="phone" className={labelClass}>
                Telefone
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={registerData.phone}
                onChange={(e) => handleInputChange("phone", formatPhoneDisplay(e.target.value))}
                maxLength={15}
                className={fieldClass}
                required
              />
            </Field>
          </div>
        </FormSection>

        {!isLoggedIn && (
          <FormSection title="Acesso do responsável">
            <Field>
              <Label htmlFor="password" className={labelClass}>
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite uma senha forte"
                value={registerData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                isPasswordVisible={showPassword}
                onTogglePasswordVisibility={() => setShowPassword((prev) => !prev)}
                className={fieldClass}
                required
              />
              {registerData.password && (
                <div className="flex flex-col gap-1">
                  {passwordErrors.length === 0 ? (
                    <p className={okClass}>
                      <CheckCircle className="size-3.5" aria-hidden />
                      Senha forte
                    </p>
                  ) : (
                    passwordErrors.map((error) => (
                      <p key={error} className={errorClass}>
                        {error}
                      </p>
                    ))
                  )}
                </div>
              )}
            </Field>

            <Field>
              <Label htmlFor="confirmPassword" className={labelClass}>
                Confirmar senha
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Digite a senha novamente"
                value={registerData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                isPasswordVisible={showPassword}
                showPasswordToggle={false}
                className={fieldClass}
                required
              />
              {registerData.confirmPassword &&
                (passwordMatch ? (
                  <p className={okClass}>
                    <CheckCircle className="size-3.5" aria-hidden />
                    Senhas coincidem
                  </p>
                ) : (
                  <p className={errorClass}>Senhas não coincidem</p>
                ))}
            </Field>

            <Field>
              <Label htmlFor="birthDate" className={labelClass}>
                Data de nascimento do responsável
              </Label>
              <BirthDateInput
                id="birthDate"
                value={registerData.birthDate}
                onChange={(value) => handleInputChange("birthDate", value)}
                error={getBirthDateError(registerData.birthDate)}
                className={fieldClass}
              />
            </Field>
          </FormSection>
        )}

        <div className="flex items-start gap-3">
          <Checkbox
            id="acceptTerms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            className="mt-0.5 size-5 rounded-md border-2 border-(--bd-accent) data-[state=checked]:bg-(--bd-accent) data-[state=checked]:text-(--bd-surface)"
          />
          <Label htmlFor="acceptTerms" className="text-sm leading-snug font-medium text-(--bd-ink)">
            <span>
              {isLoggedIn ? "Li" : "Tenho 18 anos ou mais e li"} e aceito os{" "}
              <Link href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-(--bd-accent) underline">
                Termos de uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-(--bd-accent) underline">
                Política de privacidade
              </Link>
              .
            </span>
          </Label>
        </div>

        {submitMessage && (
          <div
            role={submitMessage.type === "error" ? "alert" : "status"}
            className={`rounded-xl border-2 p-4 text-sm ${
              submitMessage.type === "success"
                ? "border-(--bd-ready-line) bg-(--bd-ready-bg) text-(--bd-ready-text)"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
            }`}
          >
            {submitMessage.text}
          </div>
        )}

        <button
          type="submit"
          disabled={!isFormValid || !acceptedTerms || isLoading}
          className="inline-flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-(--bd-cta-bg) px-6 text-lg font-semibold text-(--bd-cta-fg) transition-colors hover:bg-(--bd-cta-hover) disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Cadastrando...
            </>
          ) : (
            "Cadastrar restaurante"
          )}
        </button>

        <p className="m-0 text-center text-sm text-(--bd-muted)">
          Já possui cadastro?{" "}
          <Link href="/?auth=required" className="font-semibold text-(--bd-accent) hover:underline">
            Fazer login
          </Link>
        </p>
      </form>
    </div>
  );
}
