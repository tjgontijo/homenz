"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { DialogTrigger } from "@/components/ui/dialog";
import { CTA_BUTTON_CLASSES } from "./ActionButton";

interface WhatsAppButtonProps {
  label: string;
  onClick?: () => void;
}

export function WhatsAppButton({ label, onClick }: WhatsAppButtonProps) {
  return (
    <DialogTrigger asChild>
      <Button
        size="lg"
        className={CTA_BUTTON_CLASSES} 
        onClick={onClick}
      >
        {label}
      </Button>
    </DialogTrigger>
  );
}
