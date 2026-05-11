type ToastType = 'error' | 'success' | 'info'
type ToastListener = (msg: string, type: ToastType) => void

let listener: ToastListener | null = null

export const toast = {
  error: (msg: string) => listener?.(msg, 'error'),
  success: (msg: string) => listener?.(msg, 'success'),
  info: (msg: string) => listener?.(msg, 'info'),
  _subscribe: (fn: ToastListener) => { listener = fn },
  _unsubscribe: () => { listener = null },
}
