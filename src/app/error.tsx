"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("Application error:", error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4">
      <div className="text-center">
        <AlertTriangle className="mx-auto h-16 w-16 text-red-400" />
        <h1 className="mt-4 text-2xl font-bold text-white">Terjadi Kesalahan</h1>
        <p className="mt-2 text-slate-400">
          Maaf, terjadi kesalahan yang tidak terduga. Silakan coba lagi.
        </p>
        <Button onClick={reset} className="mt-6">
          <RefreshCw className="mr-2 h-4 w-4" />
          Coba Lagi
        </Button>
      </div>
    </div>
  );
}
