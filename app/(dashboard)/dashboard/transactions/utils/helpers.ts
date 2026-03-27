// Helpers for TransactionsClient

export function formatDateTime(ts: string): string {
  const d = new Date(ts);
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year  = d.getFullYear();
  const h24   = d.getHours();
  const mins  = d.getMinutes();
  const ampm  = h24 >= 12 ? "PM" : "AM";
  const h12   = h24 % 12 || 12;
  const time  = mins === 0 ? `${h12}${ampm}` : `${h12}:${String(mins).padStart(2, "0")}${ampm}`;
  return `${day}/${month}/${year} ${time}`;
}

export function isToday(ts: string): boolean {
  const d = new Date(ts);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function fmtValue(v: string, sign: string) {
  return `${sign}$${Number.parseFloat(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function submitLabel(items: { inventory: number; quantity: number }[]): string {
  const count = items.filter((i) => i.inventory > 0 && i.quantity > 0).length;
  return `Submit ${count} item${count === 1 ? "" : "s"}`;
}
