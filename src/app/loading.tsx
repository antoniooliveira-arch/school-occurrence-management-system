"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-blue-600"></div>
        <p className="text-sm text-slate-500">Carregando...</p>
      </div>
    </div>
  );
}
