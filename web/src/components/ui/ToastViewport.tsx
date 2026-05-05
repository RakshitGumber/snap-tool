import { Icon } from "@iconify/react";
import { AnimatePresence, motion } from "framer-motion";

import { useToastStore } from "@/stores/useToastStore";

const TOAST_STYLES = {
  success: {
    container:
      "border-[#4FBF87]/35 bg-[#EAF8F0] text-[#1C5D3D] dark:border-[#68DC98]/40 dark:bg-[#183226] dark:text-[#B6F0CA]",
    icon: "solar:check-circle-linear",
    iconClassName: "text-[#2F9B68] dark:text-[#68DC98]",
    dismissClassName:
      "text-[#1C5D3D]/70 hover:bg-[#1C5D3D]/10 dark:text-[#B6F0CA]/70 dark:hover:bg-white/8",
  },
  error: {
    container:
      "border-[#D96A5A]/35 bg-[#FFF0EC] text-[#8A2F23] dark:border-[#E98A7E]/35 dark:bg-[#3B221E] dark:text-[#F6C0B8]",
    icon: "solar:danger-circle-linear",
    iconClassName: "text-[#C54E3E] dark:text-[#F19A8D]",
    dismissClassName:
      "text-[#8A2F23]/70 hover:bg-[#8A2F23]/10 dark:text-[#F6C0B8]/70 dark:hover:bg-white/8",
  },
  info: {
    container:
      "border-border-color/70 bg-card-bg text-title-color",
    icon: "solar:bell-linear",
    iconClassName: "text-accent",
    dismissClassName:
      "text-title-color/60 hover:bg-title-color/10 dark:hover:bg-white/8",
  },
} as const;

export const ToastViewport = () => {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-[70] sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-auto sm:w-full sm:max-w-sm">
      <ol className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const style = TOAST_STYLES[toast.variant];
            const liveMode = toast.variant === "error" ? "assertive" : "polite";
            const role = toast.variant === "error" ? "alert" : "status";

            return (
              <motion.li
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                role={role}
                aria-live={liveMode}
                className={`pointer-events-auto rounded-2xl border shadow-[0_18px_36px_rgba(15,23,42,0.16)] backdrop-blur-sm ${style.container}`}
              >
                <div className="flex gap-3 px-4 py-3">
                  <div className="pt-0.5">
                    <Icon
                      icon={style.icon}
                      className={`text-xl ${style.iconClassName}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    {toast.title ? (
                      <p className="text-sm font-bold font-sans">{toast.title}</p>
                    ) : null}
                    <p className="text-sm font-sans leading-5">{toast.message}</p>
                  </div>

                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => dismissToast(toast.id)}
                    className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${style.dismissClassName}`}
                  >
                    <Icon icon="solar:close-circle-linear" className="text-lg" />
                  </button>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
};
