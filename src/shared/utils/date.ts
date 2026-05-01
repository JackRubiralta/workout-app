// Date helpers shared across nutrition + workout features. Calendar-day
// math (no timezone juggling beyond setHours(0)) is sufficient for this
// app — every "day" is anchored to the user's local midnight.

export function startOfDay(d: Date | string | number): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function addDays(d: Date | string | number, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatDateLong(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function formatDateHeading(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return (
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  );
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function relativeDay(
  iso: string | null | undefined,
  { lowercase = false }: { lowercase?: boolean } = {},
): string {
  if (!iso) return '';
  const today = startOfDay(new Date());
  const that = startOfDay(new Date(iso));
  const diffDays = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (diffDays === 0) return lowercase ? 'today' : 'Today';
  if (diffDays === 1) return lowercase ? 'yesterday' : 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)}w ago`;
  return formatDateShort(iso);
}

// yyyy-mm-dd in local time. Used as the key into `logsByDate` so the
// "Today" lens doesn't accidentally walk back across the UTC boundary.
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
