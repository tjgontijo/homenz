"use client";

import { useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Image from "next/image";
import { toast } from "sonner";

import {
  applyWhatsAppMask,
  normalizeWhatsApp,
  validateWhatsApp,
} from "@/lib/masks/phone";
import { CTA_BUTTON_CLASSES } from "@/components/home/buttons/ActionButton";

type SubmitStatus = "idle" | "submitting" | "submitted";

type SelectOption = {
  label: string;
  value: string;
};

const ORIGIN_OPTIONS = [
  { label: "Instagram", value: "Instagram" },
  { label: "Messenger", value: "Messenger" },
  { label: "Whatsapp", value: "Whatsapp" },
  { label: "Indicação", value: "Indicação" },
  { label: "Ligação", value: "Ligação" },
  { label: "Balcão", value: "Balcão" },
  { label: "Google Meu Negócio", value: "Google Meu Negócio" },
  { label: "Banner Externo", value: "Banner Externo" },
  { label: "Flyer", value: "Flyer" },
  { label: "Evento", value: "Evento" },
  { label: "Parceria Comercial", value: "Parceria Comercial" },
  { label: "Reativação de Cliente Antigo", value: "Reativação de Cliente Antigo" },
] as const satisfies readonly SelectOption[];

const MEDIUM_OPTIONS = [
  { label: "Pago", value: "Pago" },
  { label: "Orgânico", value: "Orgânico" },
] as const satisfies readonly SelectOption[];

const originValues = new Set<string>(
  ORIGIN_OPTIONS.map((option) => option.value)
);

const mediumValues = new Set<string>(
  MEDIUM_OPTIONS.map((option) => option.value)
);

const createLeadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Informe o nome"),
  whatsapp: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || validateWhatsApp(value),
      "Informe um WhatsApp válido"
    ),
  origin: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || originValues.has(value),
      "Selecione uma origem válida"
    ),
  medium: z
    .string()
    .trim()
    .optional()
    .refine(
      (value) => !value || mediumValues.has(value),
      "Selecione um meio válido"
    ),
});

type CreateLeadFormValues = z.infer<typeof createLeadSchema>;

type Payload = {
  name: string;
  whatsapp?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  origin?: string;
  medium?: string;
};

export default function CreateLeadPage() {
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      name: "",
      whatsapp: "",
      origin: "",
      medium: "",
    },
  });

  const originOptions = useMemo(() => ORIGIN_OPTIONS, []);
  const mediumOptions = useMemo(() => MEDIUM_OPTIONS, []);

  const onSubmit = async (values: CreateLeadFormValues) => {
    setStatus("submitting");

    const payload: Payload = {
      name: values.name,
      whatsapp: values.whatsapp ? normalizeWhatsApp(values.whatsapp) : null,
      utm_source: values.origin ?? null,
      utm_medium: values.medium ?? null,
      origin: values.origin || undefined,
      medium: values.medium || undefined,
    };

    try {
      const response = await fetch(
        "https://webhook.elev8.com.br/webhook/8c9a8d62-81f9-4290-ba3d-b3669f1c0025",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...payload,
            submittedAt: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro ao enviar lead (${response.status})`);
      }

      setStatus("submitted");
      reset();
      toast.success("Lead registrado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar lead:", error);
      toast.error("Não foi possível registrar o lead. Tente novamente.");
      setStatus("idle");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0a1427] to-[#112240] text-white flex flex-col items-center">
      <section className="w-full max-w-[600px] px-5 md:px-0 pt-8 pb-16 flex flex-col items-center gap-8 text-sm">
        <Image
          src="/images/logo_transparent.png"
          alt="Logotipo Homenz"
          width={180}
          height={120}
          style={{ width: "auto", height: "auto" }}
          priority
        />

        {status !== "submitted" ? (
          <form
            className="w-full rounded-3xl border border-white/10 bg-white/5 px-6 py-8 text-left shadow-xl shadow-black/30 backdrop-blur"
            onSubmit={handleSubmit(onSubmit)}
          >
            <header className="text-center">
              <h1 className="text-[22px] font-semibold text-white">
                Cadastro de Leads
              </h1>
              <p className="pt-2 text-[14px] text-white/70">
                Preencha as informações para registrar um novo lead.
              </p>
            </header>

            <div className="mt-8 flex flex-col gap-6">
              <div>
                <label
                  className="mb-2 block text-[14px] font-semibold text-white"
                  htmlFor="name"
                >
                  Nome <span className="text-cyan-300">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-[14px] text-white placeholder:text-white/40 outline-none transition focus:border-cyan-400 focus:bg-white/15"
                  placeholder="Digite o nome completo"
                  {...register("name")}
                />
                {errors.name ? (
                  <p className="pt-2 text-[12px] text-red-300">
                    {errors.name.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  className="mb-2 block text-[14px] font-semibold text-white"
                  htmlFor="whatsapp"
                >
                  WhatsApp
                </label>
                <Controller
                  control={control}
                  name="whatsapp"
                  render={({ field }) => (
                    <input
                      id="whatsapp"
                      type="tel"
                      inputMode="tel"
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-[14px] text-white placeholder:text-white/40 outline-none transition focus:border-cyan-400 focus:bg-white/15"
                      placeholder="Somente números: 6199999999"
                      value={field.value ?? ""}
                      onChange={(event) =>
                        field.onChange(applyWhatsAppMask(event.target.value))
                      }
                    />
                  )}
                />
                {errors.whatsapp ? (
                  <p className="pt-2 text-[12px] text-red-300">
                    {errors.whatsapp.message}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  className="mb-2 block text-[14px] font-semibold text-white"
                  htmlFor="origin"
                >
                  Origem
                </label>
                <div className="rounded-xl border border-white/20 bg-white/10 transition focus-within:border-cyan-400 focus-within:bg-white/15">
                  <select
                    id="origin"
                    className="w-full appearance-none rounded-xl bg-transparent px-4 py-3 text-[14px] text-white focus:outline-none"
                    defaultValue=""
                    {...register("origin")}
                  >
                    <option value="" disabled className="text-gray-900">
                      Selecione uma opção...
                    </option>
                    {originOptions.map(({ label, value }) => (
                      <option key={value} value={value} className="text-gray-900">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-[14px] font-semibold text-white"
                  htmlFor="medium"
                >
                  Meio
                </label>
                <div className="rounded-xl border border-white/20 bg-white/10 transition focus-within:border-cyan-400 focus-within:bg-white/15">
                  <select
                    id="medium"
                    className="w-full appearance-none rounded-xl bg-transparent px-4 py-3 text-[14px] text-white focus:outline-none"
                    defaultValue=""
                    {...register("medium")}
                  >
                    <option value="" disabled className="text-gray-900">
                      Selecione uma opção...
                    </option>
                    {mediumOptions.map(({ label, value }) => (
                      <option key={value} value={value} className="text-gray-900">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={`${CTA_BUTTON_CLASSES} !mt-10 !h-12 flex items-center justify-center gap-2 text-base`}
              disabled={status === "submitting"}
            >
              {status === "submitting" ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      fill="currentColor"
                    />
                  </svg>
                  Enviando...
                </span>
              ) : (
                "Enviar"
              )}
            </button>
          </form>
        ) : (
          <div className="w-full rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center shadow-xl shadow-black/30 backdrop-blur">
            <h2 className="text-[22px] font-semibold text-white">
              Formulário enviado
            </h2>
            <p className="pt-2 text-[14px] text-white/70">
              Seu lead foi registrado com sucesso.
            </p>
            <button
              className={`${CTA_BUTTON_CLASSES} !mt-8 !h-12 flex items-center justify-center text-base`}
              onClick={() => setStatus("idle")}
              type="button"
            >
              Cadastrar outro lead
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
