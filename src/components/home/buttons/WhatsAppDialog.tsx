"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CTA_BUTTON_CLASSES } from "./ActionButton";

type ContactFormData = {
  name: string;
  phone: string;
};

type ContactErrors = Partial<Record<keyof ContactFormData, string>>;

interface WhatsAppDialogProps {
  label: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: ContactFormData;
  errors: ContactErrors;
  onNameChange: (value: string) => void;
  onPhoneChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

export function WhatsAppDialog({
  label,
  open,
  onOpenChange,
  formData,
  errors,
  onNameChange,
  onPhoneChange,
  onSubmit,
  isSubmitting,
}: WhatsAppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className={CTA_BUTTON_CLASSES}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="border-white/10 bg-[#0b162b] text-white shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-white">Solicitação de Contato</DialogTitle>
          <DialogDescription className="text-white/70">
            Informe seu nome e whatsapp para que um de nossos especialistas entre em contato e apresente as melhores opções para o seu objetivo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-white">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="Digite seu nome"
              className="text-white placeholder:text-white/40"
            />
            {errors.name && <p className="text-sm text-red-400">{errors.name}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone" className="text-white">WhatsApp</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              pattern="[0-9]*"
              value={formData.phone}
              onChange={onPhoneChange}
              placeholder="(61) 99999-9999"
              className="text-white placeholder:text-white/40"
            />
            {errors.phone && <p className="text-sm text-red-400">{errors.phone}</p>}
          </div>
        </div>
        <DialogFooter className="sm:flex-row">
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="w-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2 font-semibold text-white shadow-lg transition hover:from-cyan-400 hover:to-blue-500"
          >
            {isSubmitting ? "Enviando..." : "Solicitar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
