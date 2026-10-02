import React from "react";
import { ShieldCheck } from "lucide-react";
import LiveNexusLogo from "@dashboard/componentes/LiveNexusLogo";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="relative min-h-screen w-full">
      <div className="absolute left-6 top-6 z-10 hidden md:block">
        <LiveNexusLogo />
      </div>
      <div className="flex min-h-screen items-center justify-center md:justify-end md:pr-12 lg:pr-24">
        <div className="w-full max-w-md px-4 py-10 md:px-0">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 ring-1 ring-violet-500/30">
              <Icon className="h-7 w-7 text-violet-300" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
          </div>
          <div className="rounded-2xl border border-violet-500/20 bg-black/50 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
            {children}
          </div>
          {footer && <p className="mt-6 text-center text-sm text-slate-400">{footer}</p>}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4 text-violet-400" />
            <span>Seus dados estão protegidos · Criptografia avançada</span>
          </div>
        </div>
      </div>
    </div>
  );
}
