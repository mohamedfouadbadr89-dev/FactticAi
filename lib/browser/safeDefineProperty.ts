export function safeDefineProperty(obj: any, key: string, descriptor: PropertyDescriptor) {
  const existing = Object.getOwnPropertyDescriptor(obj, key);

  if (existing && (existing.get || existing.set)) {
    return;
  }

  try {
    Object.defineProperty(obj, key, descriptor);
  } catch {
    console.warn("Safe defineProperty skipped:", key);
  }
}
