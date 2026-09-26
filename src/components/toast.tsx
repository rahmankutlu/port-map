"use client";
import { CheckCircle2, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type ToastContextValue = { notify: (message: string) => void };
const ToastContext = createContext<ToastContextValue>({
  notify: () => undefined,
});
export function ToastProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<
    Array<{ id: number; message: string }>
  >([]);
  const notify = useCallback((message: string) => {
    const id = Date.now();
    setMessages((items) => [...items, { id, message }]);
    window.setTimeout(
      () => setMessages((items) => items.filter((item) => item.id !== id)),
      3500,
    );
  }, []);
  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="toast-region" aria-live="polite">
        {messages.map((item) => (
          <div className="toast" key={item.id}>
            <CheckCircle2 size={17} />
            <span>{item.message}</span>
            <button
              aria-label="Dismiss notification"
              onClick={() =>
                setMessages((items) =>
                  items.filter((entry) => entry.id !== item.id),
                )
              }
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
export const useToast = () => useContext(ToastContext);
