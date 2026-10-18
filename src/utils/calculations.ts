import {
  CookieRecipe,
  PantryItem,
  RecipeFinancialSummary,
  CalculatedIngredientCost,
  UnitType,
} from '../types/bakery';

const GRAMS_PER_UNIT: Record<UnitType, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
  cup: 240,
  tbsp: 15,
  tsp: 5,
  each: 50,
  ml: 1,
};

export function convertToBaseGrams(
  quantity: number,
  unit: UnitType,
  pantryItem: PantryItem
): number {
  if (unit === 'g') return quantity;
  if (unit === 'kg') return quantity * 1000;
  if (unit === 'oz') return quantity * 28.3495;
  if (unit === 'lb') return quantity * 453.592;
  if (unit === 'ml') return quantity;

  const cupGrams = pantryItem.gramsPerCup ?? 240;
  if (unit === 'cup') return quantity * cupGrams;
  if (unit === 'tbsp') return quantity * (cupGrams / 16);
  if (unit === 'tsp') return quantity * (cupGrams / 48);

  if (unit === 'each') {
    if (pantryItem.packageUnit === 'each') {
      return quantity;
    }
    return quantity * (pantryItem.gramsPerEach ?? 50);
  }

  return quantity * (GRAMS_PER_UNIT[unit] ?? 1);
}

export function getCostPerBaseUnit(pantryItem: PantryItem): {
  costPerUnit: number;
  baseUnitLabel: string;
} {
  if (pantryItem.packageUnit === 'each') {
    return {
      costPerUnit: pantryItem.packageCost / Math.max(pantryItem.packageSize, 0.0001),
      baseUnitLabel: 'each',
    };
  }
  const totalPackageGrams = convertToBaseGrams(
    pantryItem.packageSize,
    pantryItem.packageUnit,
    pantryItem
  );
  return {
    costPerUnit: pantryItem.packageCost / Math.max(totalPackageGrams, 0.0001),
    baseUnitLabel: 'g',
  };
}

export function calculateIngredientLineCost(
  quantity: number,
  unit: UnitType,
  pantryItem: PantryItem
): { cost: number; weightInGrams: number } {
  if (pantryItem.packageUnit === 'each' && unit === 'each') {
    const costPerEach = pantryItem.packageCost / Math.max(pantryItem.packageSize, 1);
    return {
      cost: quantity * costPerEach,
      weightInGrams: quantity * (pantryItem.gramsPerEach ?? 2),
    };
  }

  const lineGrams = convertToBaseGrams(quantity, unit, pantryItem);
  const packageGrams = convertToBaseGrams(
    pantryItem.packageSize,
    pantryItem.packageUnit,
    pantryItem
  );

  const costPerGram = pantryItem.packageCost / Math.max(packageGrams, 0.0001);
  return {
    cost: lineGrams * costPerGram,
    weightInGrams: lineGrams,
  };
}

export function calculateRecipeFinancials(
  recipe: CookieRecipe,
  pantry: PantryItem[],
  batchMultiplier: number = 1
): RecipeFinancialSummary {
  const pantryMap = new Map(pantry.map((item) => [item.id, item]));
  const effectiveYield = Math.max(1, Math.round(recipe.baseYieldCookies * batchMultiplier));
  const effectiveDozens = Number((effectiveYield / 12).toFixed(2));

  const rawLines: Omit<CalculatedIngredientCost, 'percentOfIngredientTotal'>[] = [];
  let rawIngredientsCostSingleBatch = 0;
  let doughSingle = 0;
  let icingSingle = 0;
  let decoratingSingle = 0;

  for (const line of recipe.ingredients) {
    const pantryItem = pantryMap.get(line.pantryItemId);
    if (!pantryItem) continue;

    const { cost, weightInGrams } = calculateIngredientLineCost(
      line.quantity,
      line.unit,
      pantryItem
    );

    rawIngredientsCostSingleBatch += cost;
    if (line.section === 'dough') doughSingle += cost;
    else if (line.section === 'icing') icingSingle += cost;
    else decoratingSingle += cost;

    rawLines.push({
      lineId: line.id,
      pantryItem,
      quantity: line.quantity,
      unit: line.unit,
      section: line.section,
      scaledQuantity: Number((line.quantity * batchMultiplier).toFixed(2)),
      weightInGrams: weightInGrams * batchMultiplier,
      unitCost: cost,
      scaledCost: cost * batchMultiplier,
    });
  }

  const rawIngredientsCost = rawIngredientsCostSingleBatch * batchMultiplier;
  const lossBufferCost = rawIngredientsCost * (recipe.doughLossPercent / 100);
  const totalIngredientsCost = rawIngredientsCost + lossBufferCost;

  const lossFactor = 1 + recipe.doughLossPercent / 100;
  const doughSectionCost = doughSingle * batchMultiplier * lossFactor;
  const icingSectionCost = icingSingle * batchMultiplier * lossFactor;
  const decoratingSectionCost = decoratingSingle * batchMultiplier * lossFactor;

  const ingredientLines: CalculatedIngredientCost[] = rawLines.map((line) => ({
    ...line,
    percentOfIngredientTotal:
      rawIngredientsCostSingleBatch > 0
        ? (line.unitCost / rawIngredientsCostSingleBatch) * 100
        : 0,
  }));

  // Packaging cost
  const packagingPerCookie = recipe.packaging
    .filter((p) => p.enabled)
    .reduce((sum, p) => {
      const unitPackCost = p.bulkCost / Math.max(p.bulkCount, 1);
      return sum + unitPackCost * p.qtyPerCookie;
    }, 0);

  const totalPackagingCost = packagingPerCookie * effectiveYield;

  // Labor & Cottage Overhead
  const laborSingleBatch = (recipe.prepMinutesPerBatch / 60) * recipe.hourlyLaborRate;
  const totalLaborCost = recipe.includeLaborInCost ? laborSingleBatch * batchMultiplier : 0;
  const totalOverheadCost = recipe.cottageOverheadPerBatch * batchMultiplier;

  const totalBatchCost =
    totalIngredientsCost + totalPackagingCost + totalLaborCost + totalOverheadCost;

  const doughAndIcingCostPerCookie =
    (doughSectionCost + icingSectionCost) / effectiveYield;
  const decoratingSuppliesPerCookie = decoratingSectionCost / effectiveYield;
  const packagingCostPerCookie = packagingPerCookie;
  const laborAndOverheadPerCookie = (totalLaborCost + totalOverheadCost) / effectiveYield;

  const exactCostPerCookie = totalBatchCost / effectiveYield;
  const exactCostPerDozen = exactCostPerCookie * 12;

  const retailPricePerCookie = recipe.targetRetailPrice;
  const retailPricePerDozen =
    retailPricePerCookie * 12 * (1 - recipe.dozenDiscountPercent / 100);

  const netProfitPerCookie = retailPricePerCookie - exactCostPerCookie;
  const netProfitPerDozen = retailPricePerDozen - exactCostPerDozen;

  const grossMarginPercent =
    retailPricePerCookie > 0 ? (netProfitPerCookie / retailPricePerCookie) * 100 : 0;
  const markupMultiplier =
    exactCostPerCookie > 0 ? retailPricePerCookie / exactCostPerCookie : 0;

  const totalBatchRevenue = retailPricePerCookie * effectiveYield;
  const totalBatchNetProfit = totalBatchRevenue - totalBatchCost;

  const breakEvenCookies =
    retailPricePerCookie > 0 ? Math.ceil(totalBatchCost / retailPricePerCookie) : 0;

  return {
    batchMultiplier,
    effectiveYield,
    effectiveDozens,
    rawIngredientsCost,
    lossBufferCost,
    totalIngredientsCost,
    doughSectionCost,
    icingSectionCost,
    decoratingSectionCost,
    totalPackagingCost,
    totalLaborCost,
    totalOverheadCost,
    totalBatchCost,
    doughAndIcingCostPerCookie,
    decoratingSuppliesPerCookie,
    packagingCostPerCookie,
    laborAndOverheadPerCookie,
    exactCostPerCookie,
    exactCostPerDozen,
    retailPricePerCookie,
    retailPricePerDozen,
    netProfitPerCookie,
    netProfitPerDozen,
    grossMarginPercent,
    markupMultiplier,
    totalBatchRevenue,
    totalBatchNetProfit,
    breakEvenCookies,
    ingredientLines,
  };
}

export function formatCurrency(amount: number, decimals = 2): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  return `${sign}$${abs.toFixed(decimals)}`;
}
