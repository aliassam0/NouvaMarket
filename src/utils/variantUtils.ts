export function isStandardSize(s?: string): boolean {
  if (!s) return true;
  const val = s.trim().toLowerCase();
  return ['standard', 'موحد', 'مقاس موحد', 'افتراضي', 'default', 'n/a', 'na', ''].includes(val);
}

export function isStandardColor(c?: string): boolean {
  if (!c) return true;
  const val = c.trim().toLowerCase();
  return ['original', 'standard', 'موحد', 'لون موحد', 'افتراضي', 'default', 'n/a', 'na', ''].includes(val);
}

export function isUnifiedProduct(variants?: { size?: string; color?: string }[]): boolean {
  if (!variants || variants.length === 0) return true;
  if (variants.length === 1) {
    return isStandardSize(variants[0].size) && isStandardColor(variants[0].color);
  }
  return variants.every((v) => isStandardSize(v.size) && isStandardColor(v.color));
}
