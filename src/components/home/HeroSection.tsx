"use client";

import React from "react";
import Image from "next/image";

export function HeroSection() {
  return (
    <>
      <Image
        src="/images/logo_transparent.png"
        alt="Logotipo Homenz"
        width={180}
        height={120}
        priority
        style={{ width: "auto", height: "auto" }}
      />

      <div className="flex flex-col gap-4 max-w-[550px]">
        <h1 className="text-2xl md:text-3xl font-bold leading-tight text-white uppercase">
          Aqui o homem se cuida para vencer
        </h1>
        <p className="text-base md:text-base text-gray-300 leading-relaxed">
          A Homenz transforma estética em poder. Desejo e respeito andam juntos
          quando você sabe se posicionar. Invista em presença, colha resultado.
        </p>
      </div>
    </>
  );
}
