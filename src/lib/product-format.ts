export function bytes(size: number): string {
  if (!size || size <= 0) return '0 بايت'
  const units = ['بايت', 'كيلوبايت', 'ميغابايت', 'غيغابايت']
  let i = 0
  let n = size
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}