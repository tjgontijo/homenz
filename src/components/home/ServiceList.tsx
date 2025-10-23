"use client";

import React from "react";

interface ServiceItem {
  description: string;
}

interface ServiceListProps {
  items: ServiceItem[];
}

export function ServiceList({ items }: ServiceListProps) {
  return (
    <div className="w-full bg-white/5 backdrop-blur-sm rounded-2xl border border-cyan-400/20 shadow-lg p-6 text-left text-base leading-relaxed max-w-[550px]">
      <h2 className="text-2xl font-bold text-zinc-100 mb-6 text-center md:text-left">
        O que fazemos por você:
      </h2>
      <ul className="flex flex-col gap-4">
        {items.map((service) => (
          <li
            key={service.description}
            className="flex items-start text-slate-100"
          >
            <span className="mr-3 text-cyan-300 text-lg font-bold">✦</span>
            <span className="flex-1">{service.description}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
