export const logger = {
  info: (...args: any[]) => {
    console.log("[FACTTIC INFO]", ...args)
  },

  warn: (...args: any[]) => {
    console.warn("[FACTTIC WARN]", ...args)
  },

  error: (...args: any[]) => {
    console.error("[FACTTIC ERROR]", ...args)
  },

  debug: (...args: any[]) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[FACTTIC DEBUG]", ...args)
    }
  }
}