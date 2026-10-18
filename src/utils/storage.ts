import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { CookieRecipe, PantryItem } from '../types/bakery';
import {
  INITIAL_COOKIE_RECIPES,
  INITIAL_PANTRY_ITEMS,
} from '../data/mockBakeryData';

export const STORAGE_KEYS = {
  RECIPES: 'cookiecalc_standalone_recipes_v1',
  PANTRY: 'cookiecalc_standalone_pantry_v1',
  ACTIVE_RECIPE_ID: 'cookiecalc_standalone_active_recipe_id_v1',
  BATCH_MULTIPLIER: 'cookiecalc_standalone_batch_mult_v1',
  PROFIT_GOAL: 'cookiecalc_standalone_profit_goal_v1',
  LAST_SAVED: 'cookiecalc_standalone_last_saved_v1',
} as const;

/**
 * Generic React hook that initializes state from localStorage and
 * synchronizes all state updates back to localStorage via useEffect.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  onSave?: () => void
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        return JSON.parse(raw) as T;
      }
    } catch (err) {
      console.warn(`Failed to read localStorage key "${key}":`, err);
    }
    return initialValue;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
      window.localStorage.setItem(
        STORAGE_KEYS.LAST_SAVED,
        new Date().toISOString()
      );
      onSave?.();
    } catch (err) {
      console.warn(`Failed to write localStorage key "${key}":`, err);
    }
  }, [key, state]);

  return [state, setState];
}

/**
 * Wipes all CookieCalc keys from browser localStorage.
 */
export function clearAllCookieCalcStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      window.localStorage.removeItem(key);
    });
    // Also remove any legacy keys from earlier stages
    window.localStorage.removeItem('cookiecalc_custom_recipes_v2');
    window.localStorage.removeItem('cookiecalc_custom_pantry_v2');
  } catch (err) {
    console.warn('Failed to clear localStorage:', err);
  }
}

/**
 * Creates a single blank recipe for users who want to wipe even the demo sets.
 */
export function createBlankStarterRecipe(): CookieRecipe {
  return {
    id: `rec-blank-${Date.now()}`,
    name: 'My First Custom Cookie Recipe',
    subtitle: 'Add your cutout dough, royal icing, and packaging items below',
    badge: 'Custom Recipe',
    rollThickness: '3/8" (10mm)',
    cutterSizeProfile: 'Standard 3.5"–4" Cutouts',
    colorCount: 4,
    baseYieldCookies: 24,
    doughLossPercent: 5,
    targetRetailPrice: 5.5,
    halfDozenDiscountPercent: 0,
    dozenDiscountPercent: 0,
    prepMinutesPerBatch: 120,
    hourlyLaborRate: 25,
    includeLaborInCost: false,
    cottageOverheadPerBatch: 2.0,
    ingredients: [],
    packaging: [
      {
        id: 'pk-default-1',
        name: '4x6 Heat-Seal Cello Bag',
        supplier: 'ClearBags',
        bulkCost: 17.5,
        bulkCount: 250,
        qtyPerCookie: 1,
        enabled: true,
      },
    ],
  };
}

export function getStorageByteSize(): string {
  if (typeof window === 'undefined') return '0 KB';
  try {
    let totalChars = 0;
    Object.values(STORAGE_KEYS).forEach((k) => {
      const val = window.localStorage.getItem(k);
      if (val) totalChars += val.length + k.length;
    });
    const kb = (totalChars * 2) / 1024;
    return `${kb.toFixed(1)} KB`;
  } catch {
    return '0 KB';
  }
}

export interface StandaloneBackupPayload {
  version: number;
  exportedAt: string;
  pantry: PantryItem[];
  recipes: CookieRecipe[];
}

export function createBackupPayload(
  pantry: PantryItem[],
  recipes: CookieRecipe[]
): StandaloneBackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    pantry: pantry.length > 0 ? pantry : INITIAL_PANTRY_ITEMS,
    recipes: recipes.length > 0 ? recipes : INITIAL_COOKIE_RECIPES,
  };
}
