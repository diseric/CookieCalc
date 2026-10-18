export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateNewRecipeInput(input: {
  name: string;
  baseYield: string;
  colorCount: string;
  targetPrice: string;
  existingNames: string[];
}): ValidationResult {
  const errors: Record<string, string> = {};
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    errors.name = 'Recipe name is required.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Recipe name must be at least 2 characters.';
  } else if (trimmedName.length > 80) {
    errors.name = 'Recipe name must be under 80 characters.';
  } else if (
    input.existingNames.some((n) => n.toLowerCase() === trimmedName.toLowerCase())
  ) {
    errors.name = 'A recipe with this exact name already exists.';
  }

  const yieldVal = Number(input.baseYield);
  if (!Number.isFinite(yieldVal) || yieldVal < 1 || !Number.isInteger(yieldVal)) {
    errors.baseYield = 'Yield must be a whole number of at least 1 cutout.';
  } else if (yieldVal > 1000) {
    errors.baseYield = '1x batch yield cannot exceed 1,000 cutouts.';
  }

  const colorsVal = Number(input.colorCount);
  if (!Number.isFinite(colorsVal) || colorsVal < 1 || colorsVal > 40) {
    errors.colorCount = 'Icing colors must be between 1 and 40.';
  }

  const priceVal = Number(input.targetPrice);
  if (!Number.isFinite(priceVal) || priceVal <= 0) {
    errors.targetPrice = 'Target price must be greater than $0.00.';
  } else if (priceVal > 100) {
    errors.targetPrice = 'Target price per cookie cannot exceed $100.00.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePantryItemInput(input: {
  name: string;
  packageCost: string;
  packageSize: string;
  existingNames?: string[];
}): ValidationResult {
  const errors: Record<string, string> = {};
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    errors.name = 'Ingredient or supply name is required.';
  } else if (trimmedName.length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (
    input.existingNames?.some((n) => n.toLowerCase() === trimmedName.toLowerCase())
  ) {
    errors.name = 'This item already exists in your Supply Book.';
  }

  const costVal = Number(input.packageCost);
  if (!Number.isFinite(costVal) || costVal <= 0) {
    errors.packageCost = 'Package cost must be greater than $0.00.';
  } else if (costVal > 10000) {
    errors.packageCost = 'Package cost must be under $10,000.';
  }

  const sizeVal = Number(input.packageSize);
  if (!Number.isFinite(sizeVal) || sizeVal <= 0) {
    errors.packageSize = 'Package size/count must be greater than 0.';
  } else if (sizeVal > 1000000) {
    errors.packageSize = 'Package size is too large.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRecipeIngredientInput(input: {
  pantryItemId: string;
  quantity: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.pantryItemId) {
    errors.pantryItemId = 'Please select an ingredient from the Supply Book.';
  }

  const qtyVal = Number(input.quantity);
  if (!Number.isFinite(qtyVal) || qtyVal <= 0) {
    errors.quantity = 'Recipe quantity must be greater than 0.';
  } else if (qtyVal > 100000) {
    errors.quantity = 'Quantity cannot exceed 100,000.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validatePackagingInput(input: {
  name: string;
  bulkCost: string;
  bulkCount: string;
  qtyPerCookie: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.name.trim()) {
    errors.name = 'Packaging item name is required.';
  } else if (input.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  const costVal = Number(input.bulkCost);
  if (!Number.isFinite(costVal) || costVal <= 0) {
    errors.bulkCost = 'Bulk cost must be greater than $0.00.';
  }

  const countVal = Number(input.bulkCount);
  if (!Number.isFinite(countVal) || countVal < 1) {
    errors.bulkCount = 'Pack count must be at least 1.';
  }

  const ratioVal = Number(input.qtyPerCookie);
  if (!Number.isFinite(ratioVal) || ratioVal <= 0 || ratioVal > 10) {
    errors.qtyPerCookie = 'Usage ratio must be between 0.01 and 10.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
