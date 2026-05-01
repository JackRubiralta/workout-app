// Date helpers shared across nutrition + workout features. Calendar-day
// math (no timezone juggling beyond setHours(0)) is sufficient for this
// app — every "day" is anchored to the user's local midnight.

export function startOfDay(d) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function addDays(d, n) {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}

export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

// Long form for headings: "Monday, Jan 5".
export function formatDateLong(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

// Short-weekday heading with year: "Mon, Jan 5, 2026". Used on detail
// screens that span multiple years (session detail).
export function formatDateHeading(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

// Short-weekday + clock time: "Mon, Jan 5 · 8:00 AM". Used where the
// time-of-day matters (food log entries — when did you eat this?).
export function formatDateTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    + ' · '
    + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Short form for compact metadata: "Jan 5" — appends the year only when
// it differs from the current calendar year.
export function formatDateShort(iso) {
  const d = new Date(iso);
  const now = new Date();
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

// Time-of-day with locale formatting: "4:32 PM".
export function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Relative day label: "Today" / "Yesterday" / "3d ago" / "2w ago" / short
// date. Pass `lowercase: true` for mid-sentence usage ("today" / "yesterday").
export function relativeDay(iso, { lowercase = false } = {}) {
  if (!iso) return '';
  const today = startOfDay(new Date());
  const that = startOfDay(new Date(iso));
  const diffDays = Math.round((today - that) / 86400000);
  if (diffDays === 0) return lowercase ? 'today' : 'Today';
  if (diffDays === 1) return lowercase ? 'yesterday' : 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.round(diffDays / 7)}w ago`;
  return formatDateShort(iso);
}
