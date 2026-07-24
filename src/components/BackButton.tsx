import { useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export function BackButton({ to }: { to?: string }) {
  const navigate = useNavigate();
  const router = useRouter();

  const handleClick = () => {
    if (to) {
      navigate({ to });
      return;
    }
    // fallback: use history if possible, else /
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.history.back();
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-secondary"
    >
      <ArrowLeft className="h-4 w-4" />
      Back
    </button>
  );
}
