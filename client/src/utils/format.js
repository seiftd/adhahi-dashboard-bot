export function formatDate(value) {
  if (!value) return 'لا يوجد';
  return new Intl.DateTimeFormat('ar-DZ', {
    dateStyle: 'short',
    timeStyle: 'medium'
  }).format(new Date(value));
}

export function statusColor(value) {
  if (value === true || ['online', 'ready', 'checking'].includes(value)) return 'text-emerald-300 bg-emerald-400/10';
  if (['starting', 'idle'].includes(value)) return 'text-amber-200 bg-amber-400/10';
  return 'text-rose-200 bg-rose-400/10';
}
