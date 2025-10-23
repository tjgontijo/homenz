"use client";

import React from "react";
import Link from "next/link";

export const CTA_BUTTON_CLASSES =
  "w-full rounded-full cursor-pointer bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-4 text-base font-semibold transition-all duration-300 hover:from-cyan-400 hover:to-blue-500 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 block text-center !h-auto";

interface ActionButtonProps {
  label: string;
  href: string;
}

export function ActionButton({ label, href }: ActionButtonProps) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={CTA_BUTTON_CLASSES}
    >
      {label}
    </Link>
  );
}
