export interface ProductShareLink {
  id: string;
  productId: string;
  title?: string;
  sellingPrice: number;
  size: string;
  color: string;
  quantity: number;
  active: boolean; // true = active, false = disabled
  createdAt: string;
  updatedAt: string;
}

export interface ProductShareConfig {
  productId: string;
  sellingPrice: number;
  size: string;
  color: string;
  quantity: number;
  updatedAt: string;
}

export function getProductShareLinks(
  productId: string,
  defaultPrice: number,
  defaultSize = 'Standard',
  defaultColor = 'Standard'
): ProductShareLink[] {
  try {
    const rawLinks = localStorage.getItem(`nouvamarket_share_links_${productId}`);
    if (rawLinks) {
      const parsed = JSON.parse(rawLinks);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    // Check legacy single config
    const rawLegacy = localStorage.getItem(`nouvamarket_share_config_${productId}`);
    if (rawLegacy) {
      const parsedLegacy = JSON.parse(rawLegacy);
      const initialLink: ProductShareLink = {
        id: 'link-default',
        productId,
        title: 'الرابط الرئيسي',
        sellingPrice: parsedLegacy.sellingPrice ?? defaultPrice,
        size: parsedLegacy.size || defaultSize,
        color: parsedLegacy.color || defaultColor,
        quantity: parsedLegacy.quantity || 1,
        active: true,
        createdAt: parsedLegacy.updatedAt || new Date().toISOString(),
        updatedAt: parsedLegacy.updatedAt || new Date().toISOString(),
      };
      saveProductShareLinks(productId, [initialLink]);
      return [initialLink];
    }
  } catch (e) {
    console.error('Error reading share links:', e);
  }

  // Fallback initial default link
  const defaultLink: ProductShareLink = {
    id: `link-${Date.now()}`,
    productId,
    title: 'الرابط الرئيسي',
    sellingPrice: defaultPrice,
    size: defaultSize,
    color: defaultColor,
    quantity: 1,
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveProductShareLinks(productId, [defaultLink]);
  return [defaultLink];
}

export function saveProductShareLinks(productId: string, links: ProductShareLink[]) {
  try {
    localStorage.setItem(`nouvamarket_share_links_${productId}`, JSON.stringify(links));
    const firstActive = links.find((l) => l.active) || links[0];
    if (firstActive) {
      localStorage.setItem(
        `nouvamarket_share_config_${productId}`,
        JSON.stringify({
          productId,
          sellingPrice: firstActive.sellingPrice,
          size: firstActive.size,
          color: firstActive.color,
          quantity: firstActive.quantity,
          updatedAt: firstActive.updatedAt,
        })
      );
    }
  } catch (e) {
    console.error('Error saving share links:', e);
  }
}

export function saveSingleShareLink(
  link: Omit<ProductShareLink, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  defaultPrice: number
): ProductShareLink[] {
  const currentLinks = getProductShareLinks(link.productId, defaultPrice, link.size, link.color);
  const now = new Date().toISOString();

  if (link.id) {
    const updated = currentLinks.map((l) =>
      l.id === link.id
        ? {
            ...l,
            ...link,
            updatedAt: now,
          }
        : l
    );
    saveProductShareLinks(link.productId, updated);
    return updated;
  } else {
    const newLink: ProductShareLink = {
      ...link,
      id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [newLink, ...currentLinks];
    saveProductShareLinks(link.productId, updated);
    return updated;
  }
}

export function updateShareLinkPrice(
  productId: string,
  linkId: string,
  newPrice: number,
  defaultPrice: number
): ProductShareLink[] {
  const currentLinks = getProductShareLinks(productId, defaultPrice);
  const now = new Date().toISOString();
  const updated = currentLinks.map((l) => (l.id === linkId ? { ...l, sellingPrice: newPrice, updatedAt: now } : l));
  saveProductShareLinks(productId, updated);
  return updated;
}

export function toggleShareLinkActive(
  productId: string,
  linkId: string,
  defaultPrice: number
): ProductShareLink[] {
  const currentLinks = getProductShareLinks(productId, defaultPrice);
  const now = new Date().toISOString();
  const updated = currentLinks.map((l) => (l.id === linkId ? { ...l, active: !l.active, updatedAt: now } : l));
  saveProductShareLinks(productId, updated);
  return updated;
}

export function deleteShareLink(productId: string, linkId: string, defaultPrice: number): ProductShareLink[] {
  const currentLinks = getProductShareLinks(productId, defaultPrice);
  const updated = currentLinks.filter((l) => l.id !== linkId);
  saveProductShareLinks(productId, updated);
  return updated;
}

export function getShareLinkById(
  productId: string,
  linkId?: string | null,
  defaultPrice: number = 0,
  defaultSize = 'Standard',
  defaultColor = 'Standard'
): ProductShareLink {
  const links = getProductShareLinks(productId, defaultPrice, defaultSize, defaultColor);
  if (linkId) {
    const found = links.find((l) => l.id === linkId);
    if (found) return found;
  }
  const firstActive = links.find((l) => l.active);
  if (firstActive) return firstActive;
  return (
    links[0] || {
      id: 'fallback',
      productId,
      title: 'الرابط الرئيسي',
      sellingPrice: defaultPrice,
      size: defaultSize,
      color: defaultColor,
      quantity: 1,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );
}

export function getProductShareConfig(
  productId: string,
  defaultPrice: number,
  defaultSize = 'Standard',
  defaultColor = 'Standard'
): ProductShareConfig {
  const link = getShareLinkById(productId, null, defaultPrice, defaultSize, defaultColor);
  return {
    productId: link.productId,
    sellingPrice: link.sellingPrice,
    size: link.size,
    color: link.color,
    quantity: link.quantity,
    updatedAt: link.updatedAt,
  };
}

export function saveProductShareConfig(config: ProductShareConfig) {
  saveSingleShareLink(
    {
      productId: config.productId,
      sellingPrice: config.sellingPrice,
      size: config.size,
      color: config.color,
      quantity: config.quantity,
      active: true,
      title: 'الرابط الرئيسي',
    },
    config.sellingPrice
  );
}

