import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { BRAND } from "@/lib/brand";

export function AuthFlow() {
  useEffect(() => {
    // God Mode Universal Auth: Redirect to Master Hub!
    window.location.href = "https://janubhai.space/auth?app=nagrikparty";
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <Loader2 className="h-12 w-12 animate-spin text-saffron mb-4" />
      <h2 className="text-2xl font-bold font-heading mb-2">Connecting to {BRAND.name} Network...</h2>
      <p className="text-slate-500">Redirecting to secure login gateway...</p>
    </div>
  );
}
