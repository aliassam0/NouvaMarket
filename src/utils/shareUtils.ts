import { Product, UpsellOffer, MarketerCustomization, MarketerReview } from '../types';
import { getStoredProducts } from '../data/mockProducts';

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
  sellerId?: string;
  upsells?: UpsellOffer[]; // UpSells customized or created by the seller for this link
  customization?: MarketerCustomization; // Differentiating elements (video, reviews, whatsapp, button color, custom images/description)
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
  // Find current product to automatically link its UpSells if created by seller/supplier
  const allProds = getStoredProducts();
  const prod = allProds.find((p) => p.id === productId);
  const prodUpsells = prod?.upsells && Array.isArray(prod.upsells) && prod.upsells.length > 0 ? prod.upsells : undefined;
  const prodCustomization = getProductDefaultCustomization(productId);

  try {
    let parsed: ProductShareLink[] | null = linksMemoryCache.get(productId) || null;
    if (!parsed) {
      const rawLinks = localStorage.getItem(`nouvamarket_share_links_${productId}`);
      if (rawLinks) {
        parsed = JSON.parse(rawLinks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          linksMemoryCache.set(productId, parsed);
        }
      }
    }

    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      // Automatically link product upsells and default customization if the link doesn't have custom ones
      const merged = parsed.map((l: ProductShareLink) => ({
        ...l,
        upsells: l.upsells && Array.isArray(l.upsells) && l.upsells.length > 0 ? l.upsells : prodUpsells,
        customization: l.customization
          ? {
              ...prodCustomization,
              ...l.customization,
              customMainImages:
                l.customization.customMainImages && l.customization.customMainImages.length > 0
                  ? l.customization.customMainImages
                  : prodCustomization?.customMainImages,
              customDescriptionImages:
                l.customization.customDescriptionImages && l.customization.customDescriptionImages.length > 0
                  ? l.customization.customDescriptionImages
                  : prodCustomization?.customDescriptionImages,
              reviews:
                l.customization.reviews && l.customization.reviews.length > 0
                  ? l.customization.reviews
                  : prodCustomization?.reviews,
            }
          : prodCustomization,
      }));
      return merged;
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
        upsells: prodUpsells,
        customization: prodCustomization,
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
    upsells: prodUpsells,
    customization: prodCustomization,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  saveProductShareLinks(productId, [defaultLink]);
  return [defaultLink];
}

// In-memory fallback caches to ensure the app never crashes or loses active data if localStorage quota is tight
const customizationMemoryCache = new Map<string, MarketerCustomization>();
const linksMemoryCache = new Map<string, ProductShareLink[]>();

/**
 * Safe localStorage setter that handles QuotaExceededError smoothly without crashing the application.
 */
function safeSetStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e: any) {
    const isQuota =
      e &&
      (e.name === 'QuotaExceededError' ||
        e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        e.code === 22 ||
        e.code === 1014 ||
        String(e).includes('quota') ||
        String(e).includes('Quota'));

    if (isQuota) {
      console.warn(`[SafeStorage] LocalStorage quota reached while setting "${key}". Activating safety fallback.`);
      try {
        // Clear any temporary debug or scratch keys if present (never touch accounts, sellers, suppliers, products!)
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('nouvamarket_temp_') || k.startsWith('debug_'))) {
            localStorage.removeItem(k);
          }
        }
        localStorage.setItem(key, value);
        return true;
      } catch {
        return false;
      }
    } else {
      console.warn(`[SafeStorage] Could not set key "${key}":`, e);
      return false;
    }
  }
}

export function saveProductShareLinks(productId: string, links: ProductShareLink[]) {
  // Always update in-memory cache
  linksMemoryCache.set(productId, links);

  try {
    // Sanitize links so we do not duplicate heavy image arrays across multiple links in localStorage
    const prodCustomization = getProductDefaultCustomization(productId);
    const sanitizedLinks = links.map((l) => {
      if (!l.customization) return l;
      const c = { ...l.customization };
      // Omit duplicate heavy image arrays from individual link objects since getProductShareLinks merges from prodCustomization
      if (
        c.customMainImages &&
        prodCustomization?.customMainImages &&
        JSON.stringify(c.customMainImages) === JSON.stringify(prodCustomization.customMainImages)
      ) {
        delete c.customMainImages;
      }
      if (
        c.customDescriptionImages &&
        prodCustomization?.customDescriptionImages &&
        JSON.stringify(c.customDescriptionImages) === JSON.stringify(prodCustomization.customDescriptionImages)
      ) {
        delete c.customDescriptionImages;
      }
      return {
        ...l,
        customization: Object.keys(c).length > 0 ? c : undefined,
      };
    });

    const success = safeSetStorage(`nouvamarket_share_links_${productId}`, JSON.stringify(sanitizedLinks));
    if (!success) {
      // If sanitized links couldn't fit, store minimal links metadata
      const minimalLinks = links.map((l) => ({
        id: l.id,
        productId: l.productId,
        title: l.title,
        sellingPrice: l.sellingPrice,
        size: l.size,
        color: l.color,
        quantity: l.quantity,
        active: l.active,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      }));
      safeSetStorage(`nouvamarket_share_links_${productId}`, JSON.stringify(minimalLinks));
    }

    const firstActive = links.find((l) => l.active) || links[0];
    if (firstActive) {
      safeSetStorage(
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
    console.warn('Notice saving share links:', e);
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

export function updateShareLinkUpsells(
  productId: string,
  linkId: string,
  upsells: UpsellOffer[],
  defaultPrice: number
): ProductShareLink[] {
  const currentLinks = getProductShareLinks(productId, defaultPrice);
  const now = new Date().toISOString();
  const updated = currentLinks.map((l) => (l.id === linkId ? { ...l, upsells, updatedAt: now } : l));
  saveProductShareLinks(productId, updated);
  return updated;
}

export function updateShareLinkCustomization(
  productId: string,
  linkId: string,
  customization: MarketerCustomization,
  defaultPrice: number
): ProductShareLink[] {
  const currentLinks = getProductShareLinks(productId, defaultPrice);
  const now = new Date().toISOString();
  const updated = currentLinks.map((l) => (l.id === linkId ? { ...l, customization, updatedAt: now } : l));
  saveProductShareLinks(productId, updated);
  saveProductDefaultCustomization(productId, customization);
  return updated;
}

export function saveProductDefaultCustomization(productId: string, customization: MarketerCustomization) {
  // Always update in-memory cache immediately so active views have instant access
  customizationMemoryCache.set(productId, customization);

  try {
    // Sanitize and trim customization arrays to keep storage reasonable
    const trimmedCustomization: MarketerCustomization = {
      ...customization,
      customMainImages: customization.customMainImages ? customization.customMainImages.slice(0, 6) : undefined,
      customDescriptionImages: customization.customDescriptionImages
        ? customization.customDescriptionImages.slice(0, 6)
        : undefined,
      reviews: customization.reviews ? customization.reviews.slice(0, 12) : undefined,
    };

    const success = safeSetStorage(
      `nouvamarket_customization_${productId}`,
      JSON.stringify(trimmedCustomization)
    );

    if (!success) {
      // If saving full customization failed due to quota, save a lightweight version without heavy images
      // so marketer settings, video, and WhatsApp options are never lost!
      const lightweightCustomization: MarketerCustomization = {
        videoUrl: customization.videoUrl,
        videoTitle: customization.videoTitle,
        showReviews: customization.showReviews,
        showWhatsApp: customization.showWhatsApp,
        whatsappNumber: customization.whatsappNumber,
        whatsappMessage: customization.whatsappMessage,
        buttonColor: customization.buttonColor,
        customDescription: customization.customDescription,
        reviews: customization.reviews?.map((r) => ({ ...r, image: undefined })),
      };
      safeSetStorage(
        `nouvamarket_customization_${productId}`,
        JSON.stringify(lightweightCustomization)
      );
    }

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(
      new CustomEvent('marketed_customization_updated', { detail: { productId, customization } })
    );
  } catch (e) {
    console.warn('Notice saving product default customization:', e);
  }
}

export function getProductDefaultCustomization(productId: string): MarketerCustomization | undefined {
  if (customizationMemoryCache.has(productId)) {
    return customizationMemoryCache.get(productId);
  }
  try {
    const raw = localStorage.getItem(`nouvamarket_customization_${productId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      customizationMemoryCache.set(productId, parsed);
      return parsed;
    }
  } catch (e) {
    console.warn('Notice getting product default customization:', e);
  }
  return undefined;
}

export function removeProductShareData(productId: string) {
  customizationMemoryCache.delete(productId);
  linksMemoryCache.delete(productId);
  try {
    localStorage.removeItem(`nouvamarket_share_links_${productId}`);
    localStorage.removeItem(`nouvamarket_share_config_${productId}`);
    localStorage.removeItem(`nouvamarket_customization_${productId}`);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('marketed_products_updated', { detail: { productId } }));
  } catch (e) {
    console.warn('Notice removing product share data:', e);
  }
}

export function deleteShareLink(productId: string, linkId: string, defaultPrice: number): ProductShareLink[] {
  const currentLinks = getProductShareLinks(productId, defaultPrice);
  const updated = currentLinks.filter((l) => l.id !== linkId);
  if (updated.length === 0) {
    removeProductShareData(productId);
  } else {
    saveProductShareLinks(productId, updated);
  }
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

export interface CrossSellProductItem {
  product: Product;
  activeLink: ProductShareLink;
  profit: number;
  isSameCategory: boolean;
  hasMarketerActiveLink: boolean;
}

/**
 * Retrieves up to 2 related products as suggestions on the 'Thank You' page.
 * - Ensures suggested products are active (approved status, stock > 0, active links).
 * - Prioritizes products with working active links created by the marketer, then related products in the same category, bestsellers, and high-margin products.
 * - Guarantees strict attribution to the same reseller (using their configured links or catalog rates with reseller attribution).
 */
export function getMarketerRelatedCrossSellProducts(
  currentProductId: string,
  currentCategoryAr?: string,
  currentCategoryFr?: string,
  sellerId?: string
): CrossSellProductItem[] {
  if (typeof window === 'undefined') return [];

  const allProducts = getStoredProducts();
  const eligibleItems: CrossSellProductItem[] = [];

  for (const prod of allProducts) {
    if (prod.id === currentProductId) continue;

    // 1. Must be active & approved
    if (prod.approvalStatus === 'REJECTED' || prod.approvalStatus === 'PENDING') continue;

    // 2. Must have available stock
    const totalStock = prod.variants?.reduce((acc, v) => acc + (v.stockCount || 0), 0) ?? 0;
    if (totalStock <= 0) continue;

    // Check if the marketer has configured links for this product in their local session
    const linkKey = `nouvamarket_share_links_${prod.id}`;
    const configKey = `nouvamarket_share_config_${prod.id}`;
    const rawLinks = localStorage.getItem(linkKey);
    const rawConfig = localStorage.getItem(configKey);

    let activeLink: ProductShareLink | null = null;
    let sellingPrice = prod.suggestedSellingPrice || (prod.wholesalePrice + 1000);
    let hasMarketerActiveLink = false;

    if (rawLinks) {
      try {
        const parsed = JSON.parse(rawLinks);
        if (Array.isArray(parsed)) {
          // If sellerId is specified on the link, verify it matches
          const matching = parsed.filter(
            (l: ProductShareLink) => l.active !== false && (!sellerId || !l.sellerId || l.sellerId === sellerId)
          );
          if (matching.length > 0) {
            activeLink = matching[0];
            sellingPrice = activeLink.sellingPrice || sellingPrice;
            hasMarketerActiveLink = true;
          }
        }
      } catch (e) {
        console.error('Error reading related product links for', prod.id, e);
      }
    } else if (rawConfig) {
      try {
        const parsed = JSON.parse(rawConfig);
        sellingPrice = parsed.sellingPrice ?? sellingPrice;
        hasMarketerActiveLink = true;
      } catch (e) {
        console.error('Error reading related product config for', prod.id, e);
      }
    }

    // If no custom link exists (e.g. customer buying on their own device or reseller hasn't saved custom link yet),
    // automatically generate an active link attributed to the same reseller
    if (!activeLink) {
      const defaultVariant = prod.variants?.[0];
      activeLink = {
        id: `link-related-${prod.id}`,
        productId: prod.id,
        title: 'عرض خاص مقترح',
        sellingPrice,
        size: defaultVariant?.size || 'Standard',
        color: defaultVariant?.color || 'Standard',
        quantity: 1,
        active: true,
        sellerId: sellerId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Calculate reseller commission / profit
    const profit = Math.max(0, sellingPrice - prod.wholesalePrice);

    // Check if related: same category in Arabic or French
    const isSameCategory = Boolean(
      (currentCategoryAr && prod.categoryAr && prod.categoryAr.trim() === currentCategoryAr.trim()) ||
      (currentCategoryFr && prod.categoryFr && prod.categoryFr.trim().toLowerCase() === currentCategoryFr.trim().toLowerCase())
    );

    eligibleItems.push({
      product: prod,
      activeLink: {
        ...activeLink,
        sellingPrice,
        sellerId: sellerId || activeLink.sellerId,
      },
      profit,
      isSameCategory,
      hasMarketerActiveLink,
    });
  }

  // Prioritize:
  // 1. Products with working active links created by the marketer
  // 2. Related products in the same category
  // 3. Bestsellers
  // 4. New arrivals
  // 5. Highest profit margin
  eligibleItems.sort((a, b) => {
    // 0. Marketer's own active/marketed links FIRST
    if (a.hasMarketerActiveLink && !b.hasMarketerActiveLink) return -1;
    if (!a.hasMarketerActiveLink && b.hasMarketerActiveLink) return 1;

    // 1. Same category first
    if (a.isSameCategory && !b.isSameCategory) return -1;
    if (!a.isSameCategory && b.isSameCategory) return 1;

    // 2. Best sellers
    if (a.product.isBestSeller && !b.product.isBestSeller) return -1;
    if (!a.product.isBestSeller && b.product.isBestSeller) return 1;

    // 3. New arrivals
    if (a.product.isNewArrival && !b.product.isNewArrival) return -1;
    if (!a.product.isNewArrival && b.product.isNewArrival) return 1;

    // 4. Highest profit margin
    return b.profit - a.profit;
  });

  // Limit to up to 2 products as requested
  return eligibleItems.slice(0, 2);
}

