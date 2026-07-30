// NHTSA dates arrive as DD/MM/YYYY — convert to ISO so they sort/format the
// same way as every other date in the app.
export function parseNhtsaDate(raw: string | null): string | null {
  if (!raw) return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}
