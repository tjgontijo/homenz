"use client";

import React from "react";
import { ActionButton } from "./ActionButton";

interface ButtonItem {
  label: string;
  href: string;
}

interface ActionButtonsProps {
  items: ButtonItem[];
}

export function ActionButtons({ items }: ActionButtonsProps) {
  return (
    <>
      {items.map((button) => (
        <ActionButton
          key={button.label}
          label={button.label}
          href={button.href}
        />
      ))}
    </>
  );
}
