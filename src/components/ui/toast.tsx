import * as React from "react";
import { cn } from "@/lib/utils";
import { Icons } from "./icons";

interface ToastProps {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  onClose?: () => void;
}

export const Toast = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & ToastProps
>(({ className, title, description, variant = "default", onClose, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-lg",
        "border border-zinc-700 bg-zinc-800 p-5 shadow-md transition-all",
        variant === "destructive" && "border-red-500 bg-red-500/10",
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          {title && (
            <h3 className={cn(
              "font-medium text-white",
              variant === "destructive" && "text-red-500"
            )}>
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-zinc-400">
              {description}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-zinc-400 hover:text-white"
          >
            <Icons.close className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});

Toast.displayName = "Toast";

interface ToastProviderProps {
  children: React.ReactNode;
}

interface ToastContextType {
  toast: (props: ToastProps) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<(ToastProps & { id: string })[]>([]);

  const toast = React.useCallback((props: ToastProps) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, ...props }]);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const handleClose = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 md:max-w-[420px]">
        {toasts.map((t) => (
          <Toast
            key={t.id}
            title={t.title}
            description={t.description}
            variant={t.variant}
            onClose={() => handleClose(t.id)}
            className="animate-slide-in-right"
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
} 