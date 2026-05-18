export function formatModel(model: string): string {
  const normalized = model
    .replace(/^claude-/, '')
    .replace(/-\d{8}$/, '')
    .replace(/-\d{4}\d*$/, '')
    .replace(/-/g, ' ')
    .replace(/\b(\w)/g, match => match.toUpperCase())
    .replace(/\b4 0\b/g, '4')
    .replace(/\b3 5\b/g, '3.5')
    .replace(/\b3 7\b/g, '3.7')

  return normalized.startsWith('Claude') ? normalized : `Claude ${normalized}`
}
