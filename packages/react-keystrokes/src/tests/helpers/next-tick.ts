export const wait = () => new Promise<void>((r) => setTimeout(() => r(), 0))
