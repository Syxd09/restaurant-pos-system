import { toast as sonner } from "sonner";

export const toast = {
  error: (message: string, options?: Parameters<typeof sonner.error>[1]) =>
    sonner.error(message, { duration: 6_000, ...options }),
  success: (message: string, options?: Parameters<typeof sonner.success>[1]) =>
    sonner.success(message, { duration: 3_500, ...options }),
  info: (message: string, options?: Parameters<typeof sonner.info>[1]) =>
    sonner.info(message, { duration: 3_500, ...options }),
  warning: (message: string, options?: Parameters<typeof sonner.warning>[1]) =>
    sonner.warning(message, { duration: 5_000, ...options }),
  dismiss: sonner.dismiss,
};
