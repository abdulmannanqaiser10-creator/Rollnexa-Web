export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function uniqueSlug(base: string): string {
  const root = slugify(base) || "machine";
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${root}-${suffix}`;
}
