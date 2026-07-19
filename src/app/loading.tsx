"use client";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f2f5]">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-blue-600"></div>
        </div>
        <p className="text-[13px] text-slate-500 font-medium">Carregando...</p>
      </div>
    </div>
  );
}
