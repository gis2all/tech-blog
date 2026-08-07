export function getUmamiWebsiteId(
  isProduction: boolean,
  websiteId: string | undefined,
): string | undefined {
  if (!isProduction) return undefined;
  return websiteId?.trim() || undefined;
}
