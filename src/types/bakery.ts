export type UnitType = 'g' | 'kg' | 'oz' | 'lb' | 'cup' | 'tbsp' | 'tsp' | 'each' | 'ml';

export type IngredientCategory =
  | 'Cutout Dough Base'
  | 'Royal Icing & Glaze'
  | 'Flavorings & Emulsions'
  | 'Gel Colors, Dusts & Transfers'
  | 'Piping Bags & Disposables';

export type RecipeSectionType = 'dough' | 'icing' | 'decorating';

export type RollThickness = '1/4" (6mm)' | '5/16" (8mm)' | '3/8" (10mm)';

export type CutterSizeProfile =
  | 'Standard 3.5"–4" Cutouts'
  | 'Large 4.25"–4.5" Statement'
  | 'Mini 2"–2.5" Cutouts'
  | 'Mixed Dozen (Standard + Minis)';

export interface PantryItem {
  id: string;
  name: string;
  brand: string;
  category: IngredientCategory;
  packageCost: number;
  packageSize: number;
  packageUnit: UnitType;
  gramsPerCup?: number;
  gramsPerEach?: number;
}

export interface RecipeIngredientLine {
  id: string;
  pantryItemId: string;
  quantity: number;
  unit: UnitType;
  section: RecipeSectionType;
  notes?: string;
}

export interface PackagingLine {
  id: string;
  name: string;
  supplier: string;
  bulkCost: number;
  bulkCount: number;
  qtyPerCookie: number; // e.g., 1 cello bag per cookie, or 0.0833 box per cookie (1 per dozen)
  enabled: boolean;
}

export interface CookieRecipe {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  rollThickness: RollThickness;
  cutterSizeProfile: CutterSizeProfile;
  colorCount: number; // e.g., 6 royal icing colors
  baseYieldCookies: number; // e.g., 24 standard 3.5"-4" cutouts per batch
  doughLossPercent: number; // e.g., reroll scraps & leftover icing in piping bags (4-8%)
  targetRetailPrice: number; // e.g., $5.50 per cookie ($66/dozen)
  halfDozenDiscountPercent: number;
  dozenDiscountPercent: number;
  prepMinutesPerBatch: number; // Baking + mixing colors + flooding + detailing
  hourlyLaborRate: number;
  includeLaborInCost: boolean;
  cottageOverheadPerBatch: number; // Parchment, dehydrator electricity, projector/sanitizer
  ingredients: RecipeIngredientLine[];
  packaging: PackagingLine[];
}

export interface CalculatedIngredientCost {
  lineId: string;
  pantryItem: PantryItem;
  quantity: number;
  unit: UnitType;
  section: RecipeSectionType;
  scaledQuantity: number;
  weightInGrams: number;
  unitCost: number;
  scaledCost: number;
  percentOfIngredientTotal: number;
}

export interface RecipeFinancialSummary {
  batchMultiplier: number;
  effectiveYield: number;
  effectiveDozens: number;
  rawIngredientsCost: number;
  lossBufferCost: number;
  totalIngredientsCost: number;
  doughSectionCost: number;
  icingSectionCost: number;
  decoratingSectionCost: number;
  totalPackagingCost: number;
  totalLaborCost: number;
  totalOverheadCost: number;
  totalBatchCost: number;
  // Per-Cookie breakdowns
  doughAndIcingCostPerCookie: number;
  decoratingSuppliesPerCookie: number;
  packagingCostPerCookie: number;
  laborAndOverheadPerCookie: number;
  exactCostPerCookie: number;
  exactCostPerDozen: number;
  retailPricePerCookie: number;
  retailPricePerDozen: number;
  netProfitPerCookie: number;
  netProfitPerDozen: number;
  grossMarginPercent: number;
  markupMultiplier: number;
  totalBatchRevenue: number;
  totalBatchNetProfit: number;
  breakEvenCookies: number;
  ingredientLines: CalculatedIngredientCost[];
}
