import React, { useState, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Package,
  Scale,
  AlertCircle,
  Sparkles,
  Clock,
  Flame,
  PlusCircle,
  BookOpen,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import {
  CookieRecipe,
  IngredientCategory,
  PackagingLine,
  PantryItem,
  RecipeFinancialSummary,
  RecipeIngredientLine,
  RecipeSectionType,
  UnitType,
} from '../types/bakery';
import { formatCurrency } from '../utils/calculations';
import {
  validatePackagingInput,
  validatePantryItemInput,
  validateRecipeIngredientInput,
} from '../utils/validation';
import { NumericInput } from './NumericInput';

interface RecipeCostBuilderProps {
  recipe: CookieRecipe;
  pantry: PantryItem[];
  financials: RecipeFinancialSummary;
  onUpdateIngredient: (lineId: string, patch: Partial<RecipeIngredientLine>) => void;
  onRemoveIngredient: (lineId: string) => void;
  onAddIngredient: (line: RecipeIngredientLine) => void;
  onCreatePantryAndAddIngredient: (
    newPantryItem: PantryItem,
    line: RecipeIngredientLine
  ) => void;
  onUpdateRecipeMeta: (patch: Partial<CookieRecipe>) => void;
  onTogglePackaging: (packId: string) => void;
  onUpdatePackagingLine: (packId: string, patch: Partial<PackagingLine>) => void;
  onAddPackagingLine: (pack: PackagingLine) => void;
  onRemovePackagingLine: (packId: string) => void;
  onOpenPantry: () => void;
}

const UNITS: UnitType[] = ['g', 'oz', 'cup', 'tbsp', 'tsp', 'each', 'lb', 'kg', 'ml'];

const SECTION_LABELS: Record<
  RecipeSectionType,
  { title: string; badge: string; accent: string; defaultCategory: IngredientCategory }
> = {
  dough: {
    title: '1. No-Spread Cutout Cookie Dough',
    badge: 'Rolled Dough Batch',
    accent: 'text-amber-300/90',
    defaultCategory: 'Cutout Dough Base',
  },
  icing: {
    title: '2. Royal Icing Base (Flood, Medium & Stiff Detail)',
    badge: '10X Sugar & Meringue',
    accent: 'text-sky-300/90',
    defaultCategory: 'Royal Icing & Glaze',
  },
  decorating: {
    title: '3. Gel Colors, Tipless Piping Bags, Luster Dust & Transfers',
    badge: 'Decorating Consumables',
    accent: 'text-pink-300/90',
    defaultCategory: 'Gel Colors, Dusts & Transfers',
  },
};

type IngredientSortMode = 'default' | 'cost-desc' | 'cost-asc' | 'name-asc';

export const RecipeCostBuilder: React.FC<RecipeCostBuilderProps> = ({
  recipe,
  pantry,
  financials,
  onUpdateIngredient,
  onRemoveIngredient,
  onAddIngredient,
  onCreatePantryAndAddIngredient,
  onUpdateRecipeMeta,
  onTogglePackaging,
  onUpdatePackagingLine,
  onAddPackagingLine,
  onRemovePackagingLine,
  onOpenPantry,
}) => {
  // Mode for adding ingredients: 'pantry' vs 'custom'
  const [addMode, setAddMode] = useState<'pantry' | 'custom'>('pantry');

  // Filter & Sort inside recipe
  const [recipeSearch, setRecipeSearch] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<'all' | RecipeSectionType>('all');
  const [sortMode, setSortMode] = useState<IngredientSortMode>('default');

  // State for 'pantry' mode
  const [selectedNewPantryId, setSelectedNewPantryId] = useState<string>(
    pantry[0]?.id ?? ''
  );
  const [newQty, setNewQty] = useState<string>('100');
  const [newUnit, setNewUnit] = useState<UnitType>('g');
  const [newSection, setNewSection] = useState<RecipeSectionType>('dough');
  const [newNotes, setNewNotes] = useState<string>('');
  const [pantryAddErrors, setPantryAddErrors] = useState<Record<string, string>>({});

  // State for 'custom' on-the-fly ingredient creation mode
  const [customName, setCustomName] = useState<string>('');
  const [customBrand, setCustomBrand] = useState<string>('');
  const [customBulkCost, setCustomBulkCost] = useState<string>('12.99');
  const [customBulkSize, setCustomBulkSize] = useState<string>('454');
  const [customBulkUnit, setCustomBulkUnit] = useState<UnitType>('g');
  const [customRecipeQty, setCustomRecipeQty] = useState<string>('50');
  const [customRecipeUnit, setCustomRecipeUnit] = useState<UnitType>('g');
  const [customSection, setCustomSection] = useState<RecipeSectionType>('dough');
  const [customErrors, setCustomErrors] = useState<Record<string, string>>({});

  // State for adding custom packaging item
  const [showAddPack, setShowAddPack] = useState<boolean>(false);
  const [packName, setPackName] = useState<string>('');
  const [packSupplier, setPackSupplier] = useState<string>('');
  const [packBulkCost, setPackBulkCost] = useState<string>('20.00');
  const [packBulkCount, setPackBulkCount] = useState<string>('100');
  const [packQtyPerCookie, setPackQtyPerCookie] = useState<string>('1');
  const [packErrors, setPackErrors] = useState<Record<string, string>>({});

  const handleAddFromPantry = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateRecipeIngredientInput({
      pantryItemId: selectedNewPantryId,
      quantity: newQty,
    });

    if (!validation.valid) {
      setPantryAddErrors(validation.errors);
      return;
    }

    setPantryAddErrors({});
    const parsedQty = Number(newQty);

    // Check if this exact pantry item & unit already exists in the target section -> merge quantity
    const existingLine = recipe.ingredients.find(
      (l) =>
        l.pantryItemId === selectedNewPantryId &&
        l.section === newSection &&
        l.unit === newUnit
    );

    if (existingLine) {
      onUpdateIngredient(existingLine.id, {
        quantity: Number((existingLine.quantity + parsedQty).toFixed(2)),
      });
    } else {
      onAddIngredient({
        id: `line-${Date.now()}`,
        pantryItemId: selectedNewPantryId,
        quantity: parsedQty,
        unit: newUnit,
        section: newSection,
        notes: newNotes.trim() || undefined,
      });
    }
    setNewNotes('');
  };

  const handleCreateCustomAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const pantryVal = validatePantryItemInput({
      name: customName,
      packageCost: customBulkCost,
      packageSize: customBulkSize,
      existingNames: pantry.map((p) => p.name),
    });
    const lineVal = validateRecipeIngredientInput({
      pantryItemId: 'temp-id',
      quantity: customRecipeQty,
    });

    const combinedErrors = { ...pantryVal.errors, ...lineVal.errors };
    if (Object.keys(combinedErrors).length > 0) {
      setCustomErrors(combinedErrors);
      return;
    }

    setCustomErrors({});
    const pantryId = `p-custom-${Date.now()}`;
    const newPantryItem: PantryItem = {
      id: pantryId,
      name: customName.trim(),
      brand: customBrand.trim() || 'Custom Recipe Ingredient',
      category: SECTION_LABELS[customSection].defaultCategory,
      packageCost: Number(customBulkCost),
      packageSize: Number(customBulkSize),
      packageUnit: customBulkUnit,
      gramsPerCup: 160,
      gramsPerEach: 50,
    };

    const newLine: RecipeIngredientLine = {
      id: `line-${Date.now()}`,
      pantryItemId: pantryId,
      quantity: Number(customRecipeQty),
      unit: customRecipeUnit,
      section: customSection,
    };

    onCreatePantryAndAddIngredient(newPantryItem, newLine);
    setCustomName('');
    setCustomBrand('');
    setSelectedNewPantryId(pantryId);
  };

  const handleCreatePackaging = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePackagingInput({
      name: packName,
      bulkCost: packBulkCost,
      bulkCount: packBulkCount,
      qtyPerCookie: packQtyPerCookie,
    });

    if (!validation.valid) {
      setPackErrors(validation.errors);
      return;
    }

    setPackErrors({});
    onAddPackagingLine({
      id: `pk-custom-${Date.now()}`,
      name: packName.trim(),
      supplier: packSupplier.trim() || 'Custom Packaging',
      bulkCost: Number(packBulkCost),
      bulkCount: Math.round(Number(packBulkCount)),
      qtyPerCookie: Number(packQtyPerCookie),
      enabled: true,
    });
    setPackName('');
    setPackSupplier('');
    setShowAddPack(false);
  };

  const visibleSections: RecipeSectionType[] = useMemo(() => {
    if (sectionFilter === 'all') return ['dough', 'icing', 'decorating'];
    return [sectionFilter];
  }, [sectionFilter]);

  return (
    <div className="space-y-6">
      {/* Main Recipe Builder Card */}
      <div className="overflow-hidden rounded-2xl border border-[#2E2924] bg-[#181614] shadow-sm">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2A2520] bg-[#141210] px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-amber-400" />
              <h2 className="text-base font-bold text-[#F5F2EB]">
                Interactive Recipe & Set Builder
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-[#9E9589]">
              Add, remove, filter, or adjust any ingredient in grams, ounces, cups, tbsp, tsp, or each.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-[#9E9589]">
              Total Dough + Icing + Supplies ({financials.batchMultiplier}x)
            </div>
            <div className="font-mono text-lg font-bold text-amber-400">
              {formatCurrency(financials.totalIngredientsCost)}
            </div>
          </div>
        </div>

        {/* Add Ingredient Builder Toolbar */}
        <div className="border-b border-[#2A2520] bg-[#141210]/70 p-4 sm:px-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAddMode('pantry');
                  setPantryAddErrors({});
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  addMode === 'pantry'
                    ? 'bg-amber-500 text-[#0F0E0C]'
                    : 'border border-[#2E2924] bg-[#181614] text-[#A69C8E] hover:text-[#F5F2EB]'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Add From Supply Book ({pantry.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddMode('custom');
                  setCustomErrors({});
                }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                  addMode === 'custom'
                    ? 'bg-amber-500 text-[#0F0E0C]'
                    : 'border border-[#2E2924] bg-[#181614] text-[#A69C8E] hover:text-[#F5F2EB]'
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>+ Create New Ingredient On-The-Fly</span>
              </button>
            </div>
            <span className="text-xs text-[#8C8275]">
              {recipe.ingredients.length} items in recipe
            </span>
          </div>

          {addMode === 'pantry' ? (
            <form onSubmit={handleAddFromPantry} noValidate className="space-y-2.5">
              {Object.keys(pantryAddErrors).length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{Object.values(pantryAddErrors).join(' • ')}</span>
                </div>
              )}

              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <select
                  value={selectedNewPantryId}
                  onChange={(e) => setSelectedNewPantryId(e.target.value)}
                  className="flex-1 rounded-xl border border-[#332D27] bg-[#181614] px-3 py-2 text-xs font-medium text-[#F5F2EB] focus:border-amber-500 focus:outline-none"
                >
                  {pantry.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {formatCurrency(item.packageCost)} / {item.packageSize}
                      {item.packageUnit}
                    </option>
                  ))}
                </select>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={newQty}
                    onChange={(e) => {
                      setNewQty(e.target.value);
                      if (pantryAddErrors.quantity)
                        setPantryAddErrors((prev) => ({ ...prev, quantity: '' }));
                    }}
                    className={`w-20 rounded-xl border bg-[#181614] px-2.5 py-2 text-right font-mono text-xs font-bold text-[#F5F2EB] ${
                      pantryAddErrors.quantity ? 'border-rose-500' : 'border-[#332D27]'
                    }`}
                    placeholder="Qty"
                  />
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as UnitType)}
                    className="rounded-xl border border-[#332D27] bg-[#181614] px-2.5 py-2 font-mono text-xs font-semibold text-amber-400"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <select
                    value={newSection}
                    onChange={(e) => setNewSection(e.target.value as RecipeSectionType)}
                    className="rounded-xl border border-[#332D27] bg-[#181614] px-2.5 py-2 text-xs text-[#D5CFC2]"
                  >
                    <option value="dough">1. Cutout Dough</option>
                    <option value="icing">2. Royal Icing</option>
                    <option value="decorating">3. Colors & Bags</option>
                  </select>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-[#0F0E0C] transition hover:bg-amber-400"
                  >
                    <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Add to Recipe</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form
              onSubmit={handleCreateCustomAndAdd}
              noValidate
              className="space-y-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5"
            >
              <div className="text-xs font-semibold text-amber-300">
                Create a Brand-New Ingredient & Add Directly to This Recipe
              </div>

              {Object.keys(customErrors).length > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{Object.values(customErrors).join(' • ')}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                {/* Row 1: Ingredient Name (7 cols) + Recipe Section (5 cols) */}
                <div className="sm:col-span-7">
                  <label className="block text-xs font-medium text-[#D5CFC2]">
                    Ingredient Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Cream Cheese, Sour Cream, Cocoa Powder"
                    value={customName}
                    onChange={(e) => {
                      setCustomName(e.target.value);
                      if (customErrors.name)
                        setCustomErrors((prev) => ({ ...prev, name: '' }));
                    }}
                    className={`mt-1 w-full rounded-xl border bg-[#12100E] px-3 py-2 text-sm text-[#F5F2EB] placeholder-[#6E655B] focus:outline-none ${
                      customErrors.name
                        ? 'border-rose-500'
                        : 'border-[#332D27] focus:border-amber-500'
                    }`}
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-xs font-medium text-[#D5CFC2]">
                    Recipe Section
                  </label>
                  <select
                    value={customSection}
                    onChange={(e) => setCustomSection(e.target.value as RecipeSectionType)}
                    className="mt-1 w-full rounded-xl border border-[#332D27] bg-[#12100E] px-3 py-2 text-sm text-[#F5F2EB] focus:border-amber-500 focus:outline-none"
                  >
                    <option value="dough">1. Cutout Dough</option>
                    <option value="icing">2. Royal Icing</option>
                    <option value="decorating">3. Colors & Bags</option>
                  </select>
                </div>

                {/* Row 2: Package Cost (4 cols) + Package Size & Unit (4 cols) + Amount in Recipe & Unit (4 cols) */}
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-[#D5CFC2]">
                    Package Cost ($) *
                  </label>
                  <div
                    className={`mt-1 flex items-center rounded-xl border bg-[#12100E] px-3 py-2 ${
                      customErrors.packageCost
                        ? 'border-rose-500'
                        : 'border-[#332D27] focus-within:border-amber-500'
                    }`}
                  >
                    <span className="mr-1.5 font-mono text-sm font-bold text-amber-400">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="12.99"
                      value={customBulkCost}
                      onChange={(e) => {
                        setCustomBulkCost(e.target.value);
                        if (customErrors.packageCost)
                          setCustomErrors((prev) => ({ ...prev, packageCost: '' }));
                      }}
                      className="w-full min-w-[70px] bg-transparent font-mono text-sm font-bold text-[#F5F2EB] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-[#D5CFC2]">
                    Package Size *
                  </label>
                  <div
                    className={`mt-1 flex items-center rounded-xl border bg-[#12100E] p-1 ${
                      customErrors.packageSize
                        ? 'border-rose-500'
                        : 'border-[#332D27] focus-within:border-amber-500'
                    }`}
                  >
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      placeholder="454"
                      value={customBulkSize}
                      onChange={(e) => {
                        setCustomBulkSize(e.target.value);
                        if (customErrors.packageSize)
                          setCustomErrors((prev) => ({ ...prev, packageSize: '' }));
                      }}
                      className="w-full min-w-[70px] flex-1 bg-transparent px-2.5 py-1 font-mono text-sm font-bold text-[#F5F2EB] focus:outline-none"
                    />
                    <select
                      value={customBulkUnit}
                      onChange={(e) => setCustomBulkUnit(e.target.value as UnitType)}
                      className="rounded-lg bg-[#221F1B] px-2.5 py-1 font-mono text-xs font-semibold text-amber-400 focus:outline-none"
                    >
                      <option value="g">g</option>
                      <option value="oz">oz</option>
                      <option value="lb">lb</option>
                      <option value="kg">kg</option>
                      <option value="each">each</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-[#D5CFC2]">
                    Amount in Recipe *
                  </label>
                  <div
                    className={`mt-1 flex items-center rounded-xl border bg-[#12100E] p-1 ${
                      customErrors.quantity
                        ? 'border-rose-500'
                        : 'border-[#332D27] focus-within:border-amber-500'
                    }`}
                  >
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="50"
                      value={customRecipeQty}
                      onChange={(e) => {
                        setCustomRecipeQty(e.target.value);
                        if (customErrors.quantity)
                          setCustomErrors((prev) => ({ ...prev, quantity: '' }));
                      }}
                      className="w-full min-w-[70px] flex-1 bg-transparent px-2.5 py-1 font-mono text-sm font-bold text-amber-300 focus:outline-none"
                    />
                    <select
                      value={customRecipeUnit}
                      onChange={(e) => setCustomRecipeUnit(e.target.value as UnitType)}
                      className="rounded-lg bg-[#221F1B] px-2.5 py-1 font-mono text-xs font-semibold text-amber-400 focus:outline-none"
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-[#0F0E0C] shadow-sm transition hover:bg-amber-400"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Save & Add to Recipe</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Dynamic Recipe Search, Section Filter & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#26221E] bg-[#12100E] px-4 py-2.5 sm:px-5">
          {/* Search within recipe */}
          <div className="relative flex-1 sm:max-w-[220px]">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#786F64]" />
            <input
              type="text"
              placeholder="Filter recipe items..."
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
              className="w-full rounded-lg border border-[#2A2520] bg-[#181614] py-1 pl-8 pr-2.5 text-xs text-[#F5F2EB] placeholder-[#6E655B] focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Section Filter Pills */}
          <div className="flex flex-wrap items-center gap-1">
            {(
              [
                { id: 'all', label: 'All Sections' },
                { id: 'dough', label: 'Dough' },
                { id: 'icing', label: 'Royal Icing' },
                { id: 'decorating', label: 'Colors & Bags' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSectionFilter(tab.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                  sectionFilter === tab.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-[#8C8275] hover:text-[#F5F2EB]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 text-xs text-[#8C8275]">
            <ArrowUpDown className="h-3.5 w-3.5 text-amber-400" />
            <select
              aria-label="Sort recipe ingredients"
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as IngredientSortMode)}
              className="rounded-lg border border-[#2A2520] bg-[#181614] px-2 py-1 text-xs text-[#D5CFC2] focus:outline-none"
            >
              <option value="default">Order: Recipe Default</option>
              <option value="cost-desc">Order: Highest Cost First</option>
              <option value="cost-asc">Order: Lowest Cost First</option>
              <option value="name-asc">Order: Name A–Z</option>
            </select>
          </div>
        </div>

        {/* Grouped Sections: Cutout Dough, Royal Icing, Decorating Consumables */}
        <div className="divide-y divide-[#26221E] p-4 sm:p-5">
          {visibleSections.map((sectionKey) => {
            const rawSectionLines = financials.ingredientLines.filter((l) => {
              const inSec = l.section === sectionKey;
              const matchesSearch =
                !recipeSearch.trim() ||
                l.pantryItem.name
                  .toLowerCase()
                  .includes(recipeSearch.toLowerCase()) ||
                l.pantryItem.brand
                  .toLowerCase()
                  .includes(recipeSearch.toLowerCase());
              return inSec && matchesSearch;
            });

            const linesInSection = [...rawSectionLines].sort((a, b) => {
              if (sortMode === 'cost-desc') return b.scaledCost - a.scaledCost;
              if (sortMode === 'cost-asc') return a.scaledCost - b.scaledCost;
              if (sortMode === 'name-asc')
                return a.pantryItem.name.localeCompare(b.pantryItem.name);
              return 0;
            });

            const sectionTotal = linesInSection.reduce((sum, l) => sum + l.scaledCost, 0);
            const sectionPerCookie = sectionTotal / financials.effectiveYield;

            return (
              <div key={sectionKey} className="py-4 first:pt-0 last:pb-0">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#D5CFC2]">
                      {SECTION_LABELS[sectionKey].title}
                    </span>
                    <span
                      className={`rounded-md bg-[#24201C] px-2 py-0.5 text-xs font-medium ${SECTION_LABELS[sectionKey].accent}`}
                    >
                      {SECTION_LABELS[sectionKey].badge}
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[#A69C8E]">
                    Subtotal: {formatCurrency(sectionTotal)} ({formatCurrency(sectionPerCookie)}/cookie)
                  </span>
                </div>

                {linesInSection.length === 0 ? (
                  <div className="flex items-center justify-between rounded-xl border border-dashed border-[#2E2924] bg-[#141210]/50 px-4 py-3 text-xs text-[#8C8275]">
                    <span>
                      {recipeSearch.trim()
                        ? `No items matching "${recipeSearch}" in this section.`
                        : 'No ingredients in this section yet.'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewSection(sectionKey);
                        setCustomSection(sectionKey);
                      }}
                      className="font-semibold text-amber-400 hover:underline"
                    >
                      Select section above to add +
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {linesInSection.map((line) => {
                      const isHighCostDriver = line.percentOfIngredientTotal >= 18;
                      const perCookieLineCost = line.scaledCost / financials.effectiveYield;
                      const origLine = recipe.ingredients.find((i) => i.id === line.lineId);

                      return (
                        <div
                          key={line.lineId}
                          className={`group rounded-xl border p-3 transition ${
                            isHighCostDriver
                              ? 'border-amber-500/30 bg-[#1E1A16]'
                              : 'border-[#26221E] bg-[#141210] hover:border-[#36302A]'
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            {/* Left: Ingredient Name & Bulk Price */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-medium text-[#F5F2EB]">
                                  {line.pantryItem.name}
                                </span>
                                {isHighCostDriver && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                                    <Sparkles className="h-3 w-3" />
                                    {line.percentOfIngredientTotal.toFixed(0)}% of batch
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-xs text-[#8C8275]">
                                <button
                                  type="button"
                                  onClick={onOpenPantry}
                                  className="font-mono text-[#A69C8E] underline decoration-dotted underline-offset-2 hover:text-amber-400"
                                >
                                  Bulk: {formatCurrency(line.pantryItem.packageCost)} /{' '}
                                  {line.pantryItem.packageSize}
                                  {line.pantryItem.packageUnit}
                                </button>
                                <span>•</span>
                                <select
                                  aria-label={`Move ${line.pantryItem.name} to section`}
                                  value={line.section}
                                  onChange={(e) =>
                                    onUpdateIngredient(line.lineId, {
                                      section: e.target.value as RecipeSectionType,
                                    })
                                  }
                                  className="rounded bg-[#1C1916] px-1.5 py-0.5 text-xs text-[#A69C8E] hover:text-[#F5F2EB] focus:outline-none"
                                >
                                  <option value="dough">Dough</option>
                                  <option value="icing">Icing</option>
                                  <option value="decorating">Supplies</option>
                                </select>
                              </div>
                            </div>

                            {/* Right: Editable Quantity, Unit & Cost */}
                            <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
                              <div className="flex items-center rounded-xl border border-[#332D27] bg-[#181614] p-1">
                                <NumericInput
                                  min={0.01}
                                  aria-label={`Quantity for ${line.pantryItem.name}`}
                                  value={line.quantity}
                                  onValueChange={(val) =>
                                    onUpdateIngredient(line.lineId, {
                                      quantity: val,
                                    })
                                  }
                                  className="w-16 bg-transparent px-2 py-1 text-right font-mono text-xs font-bold text-[#F5F2EB] focus:outline-none"
                                />
                                <select
                                  aria-label={`Unit for ${line.pantryItem.name}`}
                                  value={line.unit}
                                  onChange={(e) =>
                                    onUpdateIngredient(line.lineId, {
                                      unit: e.target.value as UnitType,
                                    })
                                  }
                                  className="rounded-lg bg-[#221F1B] px-2 py-1 font-mono text-xs font-medium text-amber-400 focus:outline-none"
                                >
                                  {UNITS.map((u) => (
                                    <option key={u} value={u}>
                                      {u}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="min-w-[88px] text-right">
                                <div className="font-mono text-sm font-bold text-[#F5F2EB]">
                                  {formatCurrency(line.scaledCost)}
                                </div>
                                <div className="font-mono text-xs text-[#8C8275]">
                                  {formatCurrency(perCookieLineCost, 3)} / ea
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => onRemoveIngredient(line.lineId)}
                                title="Remove item from recipe"
                                className="rounded-lg p-1.5 text-[#786F64] transition hover:bg-rose-500/15 hover:text-rose-400"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Full-Width Prep Note Input so long notes never cut off */}
                          <div className="mt-2 flex items-center gap-1.5 border-t border-[#221F1B]/80 pt-1.5">
                            <span className="shrink-0 text-[11px] font-medium text-[#786F64]">
                              Note:
                            </span>
                            <input
                              type="text"
                              aria-label={`Prep note for ${line.pantryItem.name}`}
                              placeholder="Add prep note (e.g., room temperature, sifted together with flour)..."
                              value={origLine?.notes ?? ''}
                              onChange={(e) =>
                                onUpdateIngredient(line.lineId, {
                                  notes: e.target.value,
                                })
                              }
                              className="w-full min-w-0 flex-1 bg-transparent text-xs italic text-[#C8BFA8] placeholder-[#655D53] focus:border-b focus:border-amber-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Leftover Piping Bag Icing & Dough Reroll Scrap Buffer Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#2A2520] bg-[#12100E] px-5 py-3 text-xs">
          <div className="flex items-center gap-2 text-[#A69C8E]">
            <AlertCircle className="h-4 w-4 text-amber-400" />
            <span>
              Leftover Colored Icing in Bags & Dough Scrap Waste:{' '}
              <strong className="font-mono text-[#F5F2EB]">{recipe.doughLossPercent}%</strong>{' '}
              (+{formatCurrency(financials.lossBufferCost)} per batch)
            </span>
          </div>
          <div className="flex items-center gap-2">
            {[0, 4, 6, 10].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => onUpdateRecipeMeta({ doughLossPercent: pct })}
                className={`rounded-lg px-2 py-1 font-mono text-xs transition ${
                  recipe.doughLossPercent === pct
                    ? 'border border-amber-500/40 bg-amber-500/20 font-bold text-amber-300'
                    : 'bg-[#181614] text-[#8C8275] hover:text-[#F5F2EB]'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Packaging & Cottage Overhead Card */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Per-Cookie Heat-Seal Packaging & Box Presentation */}
        <div className="rounded-2xl border border-[#2E2924] bg-[#181614] p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 shrink-0 text-sky-400" />
              <h3 className="text-sm font-bold text-[#F5F2EB]">
                Heat-Seal Bags, Boxes & Presentation
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="whitespace-nowrap font-mono text-xs font-semibold text-sky-400">
                {formatCurrency(financials.packagingCostPerCookie)} / cookie
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowAddPack((prev) => !prev);
                  setPackErrors({});
                }}
                className="whitespace-nowrap rounded-lg bg-[#24201C] px-2.5 py-1 text-xs font-semibold text-amber-400 hover:bg-[#2E2924]"
              >
                + Add Box/Bag
              </button>
            </div>
          </div>

          {showAddPack && (
            <form
              onSubmit={handleCreatePackaging}
              noValidate
              className="mt-3 space-y-2 rounded-xl border border-sky-500/30 bg-sky-500/5 p-3"
            >
              <div className="text-xs font-semibold text-sky-300">
                Add Custom Packaging Item
              </div>

              {Object.keys(packErrors).length > 0 && (
                <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2.5 py-1.5 text-xs text-rose-300">
                  {Object.values(packErrors).join(' • ')}
                </div>
              )}

              <input
                type="text"
                placeholder="e.g., Clear Cookie Box / Satin Ribbon *"
                value={packName}
                onChange={(e) => {
                  setPackName(e.target.value);
                  if (packErrors.name) setPackErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={`w-full rounded-lg border bg-[#12100E] px-2.5 py-1.5 text-xs text-[#F5F2EB] ${
                  packErrors.name ? 'border-rose-500' : 'border-[#332D27]'
                }`}
              />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs text-[#8C8275]">Bulk Cost ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={packBulkCost}
                    onChange={(e) => setPackBulkCost(e.target.value)}
                    className={`mt-0.5 w-full rounded-lg border bg-[#12100E] px-2 py-1 font-mono text-xs text-[#F5F2EB] ${
                      packErrors.bulkCost ? 'border-rose-500' : 'border-[#332D27]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8C8275]">Pack Count *</label>
                  <input
                    type="number"
                    min="1"
                    value={packBulkCount}
                    onChange={(e) => setPackBulkCount(e.target.value)}
                    className={`mt-0.5 w-full rounded-lg border bg-[#12100E] px-2 py-1 font-mono text-xs text-[#F5F2EB] ${
                      packErrors.bulkCount ? 'border-rose-500' : 'border-[#332D27]'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8C8275]">Usage Ratio</label>
                  <select
                    value={packQtyPerCookie}
                    onChange={(e) => setPackQtyPerCookie(e.target.value)}
                    className="mt-0.5 w-full rounded-lg border border-[#332D27] bg-[#12100E] px-1.5 py-1 text-xs text-[#F5F2EB]"
                  >
                    <option value="1">1 / cookie</option>
                    <option value="0.1667">1 / half-doz</option>
                    <option value="0.0833">1 / dozen</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddPack(false)}
                  className="text-xs text-[#8C8275]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-sky-500 px-3 py-1 text-xs font-bold text-[#0F0E0C]"
                >
                  Add Packaging
                </button>
              </div>
            </form>
          )}

          <div className="mt-3.5 space-y-2.5">
            {recipe.packaging.map((pack) => {
              const singleItemCost = pack.bulkCost / Math.max(pack.bulkCount, 1);
              const costPerCookie = singleItemCost * pack.qtyPerCookie;

              return (
                <div
                  key={pack.id}
                  className={`space-y-2 rounded-xl border p-3 transition ${
                    pack.enabled
                      ? 'border-[#332D27] bg-[#141210]'
                      : 'border-[#221F1B] bg-[#12100E] opacity-55'
                  }`}
                >
                  {/* Top Row: Checkbox + Name/Supplier + Cost Per Cookie + Delete */}
                  <div className="flex items-start justify-between gap-2">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={pack.enabled}
                        onChange={() => onTogglePackaging(pack.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#3D3730] bg-[#181614] text-amber-500 focus:ring-amber-500"
                      />
                      <div className="min-w-0 text-xs">
                        <div className="font-medium leading-snug text-[#F5F2EB]">
                          {pack.name}
                        </div>
                        <div className="mt-0.5 text-[#8C8275]">{pack.supplier}</div>
                      </div>
                    </label>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded-md bg-[#1D1A16] px-2 py-0.5 font-mono text-xs font-bold text-sky-300">
                        {formatCurrency(costPerCookie, 2)}/ea
                      </span>
                      <button
                        type="button"
                        onClick={() => onRemovePackagingLine(pack.id)}
                        title={`Remove ${pack.name}`}
                        className="rounded p-1 text-[#786F64] transition hover:bg-rose-500/15 hover:text-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Bottom Row: Editable Bulk Cost & Usage Ratio Dropdown */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#221F1B] pl-6 pt-2 text-xs">
                    <div className="flex items-center gap-1 text-[#A69C8E]">
                      <span>Bulk:</span>
                      <div className="inline-flex items-center rounded-lg border border-[#2E2924] bg-[#181614] px-2 py-0.5">
                        <span className="mr-0.5 font-mono text-amber-400">$</span>
                        <NumericInput
                          min={0.01}
                          aria-label={`Bulk cost for ${pack.name}`}
                          value={pack.bulkCost}
                          onValueChange={(val) =>
                            onUpdatePackagingLine(pack.id, { bulkCost: val })
                          }
                          className="w-14 bg-transparent font-mono text-xs font-bold text-[#F5F2EB] focus:outline-none"
                        />
                      </div>
                      <span className="whitespace-nowrap font-mono text-[#8C8275]">
                        / {pack.bulkCount} ct
                      </span>
                    </div>

                    <select
                      aria-label={`Usage ratio for ${pack.name}`}
                      value={pack.qtyPerCookie}
                      onChange={(e) =>
                        onUpdatePackagingLine(pack.id, {
                          qtyPerCookie: parseFloat(e.target.value),
                        })
                      }
                      className="rounded-lg border border-[#2E2924] bg-[#181614] px-2 py-1 font-mono text-xs text-[#D5CFC2] focus:border-amber-500 focus:outline-none"
                    >
                      <option value={1}>1 / cookie</option>
                      <option value={0.1667}>1 / half-doz</option>
                      <option value={0.0833}>1 / dozen</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dehydrator, Projector & Decorating Labor Time */}
        <div className="flex flex-col justify-between rounded-2xl border border-[#2E2924] bg-[#181614] p-4 sm:p-5">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-purple-400" />
                <h3 className="text-sm font-bold text-[#F5F2EB]">
                  Dehydrator, Overhead & Decorating Time
                </h3>
              </div>
              <span className="font-mono text-xs font-semibold text-purple-400">
                {formatCurrency(financials.laborAndOverheadPerCookie)} / cookie
              </span>
            </div>
            <p className="mt-1 text-xs text-[#8C8275]">
              Account for dehydrator electricity, projector/stencils, and active piping hours.
            </p>

            <div className="mt-4 space-y-3">
              {/* Overhead per batch */}
              <div className="flex items-center justify-between rounded-xl border border-[#2A2520] bg-[#141210] p-3">
                <div className="text-xs">
                  <div className="font-medium text-[#F5F2EB]">
                    Dehydrator, Oven, Heat Sealer & Utilities
                  </div>
                  <div className="text-[#8C8275]">Flat utility estimate per 1x batch</div>
                </div>
                <div className="flex items-center gap-1 rounded-lg border border-[#332D27] bg-[#181614] px-2.5 py-1">
                  <span className="text-xs text-amber-400">$</span>
                  <NumericInput
                    min={0}
                    fallbackValue={0}
                    value={recipe.cottageOverheadPerBatch}
                    onValueChange={(val) =>
                      onUpdateRecipeMeta({
                        cottageOverheadPerBatch: val,
                      })
                    }
                    className="w-14 bg-transparent text-right font-mono text-xs font-bold text-[#F5F2EB] focus:outline-none"
                  />
                </div>
              </div>

              {/* Include Active Decorating Labor Toggle */}
              <div className="rounded-xl border border-[#2A2520] bg-[#141210] p-3">
                <div className="flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={recipe.includeLaborInCost}
                      onChange={(e) =>
                        onUpdateRecipeMeta({ includeLaborInCost: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-[#3D3730] bg-[#181614] text-amber-500"
                    />
                    <span className="text-xs font-medium text-[#F5F2EB]">
                      Bake & Piping Time in Hard Cost
                    </span>
                  </label>
                  <Clock className="h-4 w-4 text-[#8C8275]" />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2.5 border-t border-[#221F1B] pt-2">
                  <div>
                    <label className="block text-xs text-[#8C8275]">
                      Active Mins ({recipe.baseYieldCookies} cookies)
                    </label>
                    <NumericInput
                      integer
                      min={1}
                      max={1200}
                      value={recipe.prepMinutesPerBatch}
                      onValueChange={(val) =>
                        onUpdateRecipeMeta({
                          prepMinutesPerBatch: val,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-[#2E2924] bg-[#181614] px-2.5 py-1 font-mono text-xs text-[#F5F2EB]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8C8275]">Artist Rate ($/hr)</label>
                    <NumericInput
                      min={1}
                      max={250}
                      value={recipe.hourlyLaborRate}
                      onValueChange={(val) =>
                        onUpdateRecipeMeta({
                          hourlyLaborRate: val,
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-[#2E2924] bg-[#181614] px-2.5 py-1 font-mono text-xs text-[#F5F2EB]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-xl bg-amber-500/10 px-3.5 py-2.5 text-xs text-amber-200">
            <span>Effective Hourly Earnings (from Set Profit):</span>
            <strong className="font-mono text-sm text-amber-400">
              {formatCurrency(
                financials.totalBatchNetProfit /
                  Math.max(
                    (recipe.prepMinutesPerBatch * financials.batchMultiplier) / 60,
                    0.1
                  )
              )}
              /hr
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
