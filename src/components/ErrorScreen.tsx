import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import AnimatedBackground from "@/components/ui/AnimatedBackground";
import GlassPanel from "@/components/ui/GlassPanel";

interface ErrorScreenProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onGoHome: () => void;
}

const ErrorScreen = ({
  title = "Connection Error",
  message,
  onRetry,
  onGoHome,
}: ErrorScreenProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AnimatedBackground />

      <GlassPanel className="p-8 max-w-md w-full text-center" animate>
        <div className="space-y-6">
          {/* Error icon */}
          <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          {/* Error message */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            <p className="text-muted-foreground">{message}</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full py-3 rounded-xl btn-gradient text-primary-foreground font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
            )}
            <button
              onClick={onGoHome}
              className="w-full py-3 rounded-xl glass-subtle text-foreground font-medium flex items-center justify-center gap-2 hover:bg-secondary/50 transition-colors"
            >
              <Home className="w-5 h-5" />
              Go Home
            </button>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
};

export default ErrorScreen;
