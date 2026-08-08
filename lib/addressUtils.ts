/**
 * Shared address formatting. All "property + unit + subunit" display
 * strings across the app should go through here so the format is
 * consistent (Accounting income list, transaction detail, tenant screens).
 *
 * Format: "<street>, <city>" [" — Unit <name>"] [" — Room <name>"]
 * Missing unit/subunit levels are simply omitted, never shown blank.
 */

export interface AddressLike {
  address1?: string | null;
  city?: string | null;
}

export function getPropertyAddress(property: AddressLike | null | undefined): string {
  if (!property) return 'Unknown Address';
  const parts = [property.address1, property.city].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Unknown Address';
}

export function getFullAddressWithUnit(
  property: AddressLike | null | undefined,
  unitName?: string | null,
  subUnitName?: string | null
): string {
  const parts = [getPropertyAddress(property)];
  if (unitName) parts.push(`Unit ${unitName}`);
  if (subUnitName) parts.push(`Room ${subUnitName}`);
  return parts.join(' — ');
}
