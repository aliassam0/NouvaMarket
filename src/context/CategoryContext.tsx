import React, { createContext, useContext, useState, useEffect } from 'react';
import { CategoryItem } from '../types';

export const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    "id": "cat-1",
    "nameAr": "منتجات البشرة والجسم",
    "nameFr": "Soins Peau & Corps",
    "icon": "✨",
    "image": "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6929.png?v=1785197156",
    "displayOrder": 1,
    "visible": true
  },
  {
    "id": "cat-2",
    "nameAr": "منتجات الشعر",
    "nameFr": "Soins Cheveux",
    "icon": "💇‍♀️",
    "image": "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/IMG-6917.jpg?v=1785196392",
    "displayOrder": 2,
    "visible": true
  },
  {
    "id": "cat-3",
    "nameAr": "منتجات الأسنان",
    "nameFr": "Soins Dentaires",
    "icon": "🦷",
    "image": "https://cdn.shopify.com/s/files/1/0613/8406/5118/files/S336e03adcba24c70a9f8fd00e6d8ac86n.webp?v=1765051906",
    "displayOrder": 3,
    "visible": true
  },
  {
    "id": "cat-4",
    "nameAr": "أدوات الحلاقة والتجميل",
    "nameFr": "Outils de Rasage & Beauté",
    "icon": "💈",
    "image": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600",
    "displayOrder": 4,
    "visible": true
  }
];

const STORAGE_KEY = 'nouvamarket_categories_v9';

interface CategoryContextType {
  categories: CategoryItem[];
  addCategory: (categoryData: Omit<CategoryItem, 'id'>) => CategoryItem;
  updateCategory: (id: string, updatedData: Partial<CategoryItem>) => void;
  deleteCategory: (id: string) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    try {
      // Clean up legacy keys
      ['nouvamarket_categories_v1', 'nouvamarket_categories_v2', 'nouvamarket_categories_v3', 'nouvamarket_categories_v4', 'nouvamarket_categories_v5', 'nouvamarket_categories_v6', 'nouvamarket_categories_v7', 'nouvamarket_categories_v8'].forEach((key) => {
        localStorage.removeItem(key);
      });

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading categories from localStorage:', e);
    }
    return INITIAL_CATEGORIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    } catch (e) {
      console.error('Error saving categories to localStorage:', e);
    }
  }, [categories]);

  const addCategory = (categoryData: Omit<CategoryItem, 'id'>) => {
    const newCategory: CategoryItem = {
      ...categoryData,
      id: `cat-${Date.now()}`,
    };
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, updatedData: Partial<CategoryItem>) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updatedData } : cat))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
