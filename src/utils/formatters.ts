export function formatDate(date?: string): string {
  if (!date) return '-'

  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}
