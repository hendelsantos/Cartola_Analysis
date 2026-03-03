import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorAlertProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorAlert({
  message = "Erro ao carregar dados. Tente novamente.",
  onRetry,
}: ErrorAlertProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-danger/30 bg-danger/5 p-8 text-center">
      <AlertTriangle className="h-10 w-10 text-danger" />
      <p className="text-sm text-danger">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg bg-danger/10 px-4 py-2 text-sm font-medium text-danger transition-colors hover:bg-danger/20"
        >
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </button>
      )}
    </div>
  );
}
