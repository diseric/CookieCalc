import React, { useState, useMemo } from 'react';
import {
  X,
  Scale,
  Plus,
  Check,
  DollarSign,
  Search,
  Trash2,
  AlertCircle,
  ArrowUpDown,
} from 'lucide-react';
import {
  CookieRecipe,
  IngredientCategory,
  PantryItem,
  UnitType,
} from '../types/bakery';
import { formatCurrency, getCostPerBaseUnit } from '../utils/calculations';
import { validatePantryItemInput } from '../utils/validation';
import { NumericInput } from './NumericInput';

interface PantryCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  pantry: PantryItem[];
  recipes: CookieRecipe[];
  onUpdatePantryItem: (updated: PantryItem) => void;
  onAddPantryItem: (newItem: PantryItem) => void;
  onDeletePantryItem: (pantryId: string) => void;
}

const CATEGORIES: IngredientCategory[] = [
  'Cutout Dough Base',
  'Royal Icing & Glaze',
  'Flavorings & Emulsions',
  'Gel Colors, Dusts & Transfers',
  'Piping Bags & Disposables',
];

type SortOption = 'category' | 'name' | 'bulk-desc' | 'rate-desc';

export const PantryCatalogModal: React.FC<PantryCatalogModalProps> = ({
  isOpen,
  onClose,
  pantry,
  recipes,
  onUpdatePantryItem,
  onAddPantryItem,
  onDeletePantryItem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('category');
  const [showNewForm, setShowNewForm] = useState(false);

  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState<IngredientCategory>(
    'Gel Colors, Dusts & Transfers'
  );
  const [newCost, setNewCost] = useState('14.99');
  const [newSize, setNewSize] = useState('500');
  const [newUnit, setNewUnit] = useState<UnitType>('g');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Map how many recipes use each pantry item
  const usageMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of recipes) {
      const uniqueIds = new Set(r.ingredients.map((i) => i.pantryItemId));
      uniqueIds.forEach((id) => {
        map.set(id, (map.get(id) ?? 0) + 1);
      });
    }
    return map;
  }, [recipes]);

  const filteredAndSorted = useMemo(() => {
    const filtered = pantry.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'bulk-desc') return b.packageCost - a.packageCost;
      if (sortBy === 'rate-desc') {
        return (
          getCostPerBaseUnit(b).costPerUnit - getCostPerBaseUnit(a).costPerUnit
        );
      }
      return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    });
  }, [pantry, searchQuery, selectedCategory, sortBy]);

  if (!isOpen) return null;

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validatePantryItemInput({
      name: newName,
      packageCost: newCost,
      packageSize: newSize,
      existingNames: pantry.map((p) => p.name),
    });

    if (!validation.valid) {
      setFormErrors(validation.errors);
      return;
    }

    setFormErrors({});
    const created: PantryItem = {
      id: `p-custom-${Date.now()}`,
      name: newName.trim(),
      brand: newBrand.trim() || 'Custom Cookier Supply',
      category: newCategory,
      packageCost: Number(newCost),
      packageSize: Number(newSize),
      packageUnit: newUnit,
      gramsPerCup: 160,
    };
    onAddPantryItem(created);
    setNewName('');
    setNewBrand('');
    setShowNewForm(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pantry-modal-title"
    >
      <div className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-[#332D27] bg-[#181614] pb-safe shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
        {/* Mobile Bottom Sheet Pill Indicator */}
        <div className="flex justify-center pt-2.5 sm:hidden">
          <div className="h-1.5 w-12 rounded-full bg-[#36302A]" />
        </div>
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#2A2520] px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 id="pantry-modal-title" className="text-base font-bold text-[#F5F2EB]">
                Cookier Bulk Supply & Ingredient Price Book ({pantry.length})
              </h2>
              <p className="text-xs text-[#9E9589]">
                Update bulk butter, 10X sugar, meringue powder, tipless bags, or gel color prices to recalculate all sets.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#9E9589] transition hover:bg-[#24201C] hover:text-[#F5F2EB]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Dynamic Search, Category Filter, Sort & Add Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#2A2520] bg-[#141210] px-5 py-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8C8275]" />
            <input
              type="text"
              placeholder="Search meringue, tipless bags, butter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-[#2E2924] bg-[#181614] py-1.5 pl-9 pr-3 text-xs text-[#F5F2EB] placeholder-[#786F64] focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by supply category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-[#2E2924] bg-[#181614] px-2.5 py-1.5 text-xs text-[#E5DEC9] focus:border-amber-500 focus:outline-none"
            >
              <option value="All">All Categories ({pantry.length})</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 rounded-xl border border-[#2E2924] bg-[#181614] px-2.5 py-1.5 text-xs text-[#A69C8E]">
              <ArrowUpDown className="h-3.5 w-3.5 text-amber-400" />
              <select
                aria-label="Sort supply book"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs text-[#E5DEC9] focus:outline-none"
              >
                <option value="category">Sort: Category</option>
                <option value="name">Sort: Name A–Z</option>
                <option value="bulk-desc">Sort: Bulk Price</option>
                <option value="rate-desc">Sort: Unit Cost</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowNewForm((prev) => !prev);
                setFormErrors({});
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-semibold text-[#0F0E0C] transition hover:bg-amber-400"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Supply / Ingredient</span>
            </button>
          </div>
        </div>

        {/* New Pantry Item Inline Drawer */}
        {showNewForm && (
          <form
            onSubmit={handleCreateItem}
            noValidate
            className="border-b border-amber-500/30 bg-amber-500/5 px-5 py-4"
          >
            <div className="mb-2 text-xs font-semibold text-amber-300">
              Add Custom Cookier Supply or Ingredient
            </div>

            {Object.keys(formErrors).length > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{Object.values(formErrors).join(' • ')}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
              <div className="sm:col-span-5">
                <label className="block text-xs font-medium text-[#D5CFC2]">Item Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Edible Gold Leaf / Lemon Emulsion"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`mt-1 w-full rounded-xl border bg-[#141210] px-3 py-2 text-xs text-[#F5F2EB] ${
                    formErrors.name ? 'border-rose-500' : 'border-[#332D27]'
                  }`}
                />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-[#D5CFC2]">Brand / Supplier</label>
                <input
                  type="text"
                  placeholder="e.g., The Sugar Art"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#332D27] bg-[#141210] px-3 py-2 text-xs text-[#F5F2EB]"
                />
              </div>
              <div className="sm:col-span-4">
                <label className="block text-xs font-medium text-[#D5CFC2]">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as IngredientCategory)}
                  className="mt-1 w-full rounded-xl border border-[#332D27] bg-[#141210] px-3 py-2 text-xs text-[#F5F2EB]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-6">
                <label className="block text-xs font-medium text-[#D5CFC2]">Bulk Cost ($) *</label>
                <div
                  className={`mt-1 flex items-center rounded-xl border bg-[#141210] px-3 py-1.5 ${
                    formErrors.packageCost ? 'border-rose-500' : 'border-[#332D27]'
                  }`}
                >
                  <span className="mr-1.5 font-mono text-sm font-bold text-amber-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={newCost}
                    onChange={(e) => setNewCost(e.target.value)}
                    className="w-full min-w-[80px] bg-transparent font-mono text-sm font-bold text-[#F5F2EB] focus:outline-none"
                  />
                </div>
              </div>
              <div className="sm:col-span-6">
                <label className="block text-xs font-medium text-[#D5CFC2]">Size / Count *</label>
                <div
                  className={`mt-1 flex items-center rounded-xl border bg-[#141210] p-1 ${
                    formErrors.packageSize ? 'border-rose-500' : 'border-[#332D27]'
                  }`}
                >
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="w-full min-w-[80px] flex-1 bg-transparent px-2.5 py-1 font-mono text-sm font-bold text-[#F5F2EB] focus:outline-none"
                  />
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value as UnitType)}
                    className="rounded-lg bg-[#221F1B] px-2.5 py-1 font-mono text-xs font-semibold text-amber-400 focus:outline-none"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                    <option value="each">each</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNewForm(false)}
                className="rounded-lg px-3 py-1 text-xs text-[#9E9589] hover:text-[#F5F2EB]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-[#0F0E0C]"
              >
                <Check className="h-3.5 w-3.5" /> Save to Supply Book
              </button>
            </div>
          </form>
        )}

        {/* Pantry Table List */}
        <div className="flex-1 space-y-2 overflow-y-auto p-5">
          {filteredAndSorted.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#2E2924] py-10 text-center text-xs text-[#8C8275]">
              No supplies match "{searchQuery}" in {selectedCategory}.
            </div>
          ) : (
            filteredAndSorted.map((item) => {
              const { costPerUnit, baseUnitLabel } = getCostPerBaseUnit(item);
              const displayRate =
                baseUnitLabel === 'g'
                  ? `${formatCurrency(costPerUnit * 100, 2)} / 100g`
                  : `${formatCurrency(costPerUnit, 2)} / each`;
              const usedInCount = usageMap.get(item.id) ?? 0;

              return (
                <div
                  key={item.id}
                  className="flex flex-col justify-between gap-3 rounded-xl border border-[#2A2520] bg-[#141210] p-3.5 transition hover:border-[#3A332C] sm:flex-row sm:items-center"
                >
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[#F5F2EB]">
                        {item.name}
                      </span>
                      <span className="rounded-md bg-[#221F1B] px-2 py-0.5 text-xs text-[#A69C8E]">
                        {item.category}
                      </span>
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-xs text-amber-300">
                        Used in {usedInCount} {usedInCount === 1 ? 'recipe' : 'recipes'}
                      </span>
                    </div>
                    <p className="text-xs text-[#8C8275]">
                      {item.brand} • Exact Rate:{' '}
                      <span className="font-mono text-amber-400">{displayRate}</span>
                    </p>
                  </div>

                  {/* Editable Package Cost, Size & Delete */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div>
                      <label className="block text-xs text-[#8C8275]">Bulk Cost ($)</label>
                      <div className="mt-0.5 flex items-center rounded-lg border border-[#2E2924] bg-[#181614] px-2.5 py-1">
                        <DollarSign className="h-3.5 w-3.5 text-amber-400" />
                        <NumericInput
                          min={0.01}
                          value={item.packageCost}
                          onValueChange={(val) =>
                            onUpdatePantryItem({
                              ...item,
                              packageCost: val,
                            })
                          }
                          className="w-20 bg-transparent font-mono text-xs font-semibold text-[#F5F2EB] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#8C8275]">
                        Package Size ({item.packageUnit})
                      </label>
                      <div className="mt-0.5 flex items-center rounded-lg border border-[#2E2924] bg-[#181614] px-2.5 py-1">
                        <NumericInput
                          min={0.1}
                          value={item.packageSize}
                          onValueChange={(val) =>
                            onUpdatePantryItem({
                              ...item,
                              packageSize: val,
                            })
                          }
                          className="w-20 bg-transparent font-mono text-xs font-semibold text-[#F5F2EB] focus:outline-none"
                        />
                        <span className="ml-1 text-xs text-[#8C8275]">
                          {item.packageUnit}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={usedInCount > 0}
                      onClick={() => onDeletePantryItem(item.id)}
                      title={
                        usedInCount > 0
                          ? `Cannot delete while used in ${usedInCount} recipe(s)`
                          : 'Delete item from Supply Book'
                      }
                      className={`mt-4 rounded-lg p-1.5 transition ${
                        usedInCount > 0
                          ? 'cursor-not-allowed text-[#4A433B]'
                          : 'text-[#8C8275] hover:bg-rose-500/15 hover:text-rose-400'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#2A2520] bg-[#141210] px-5 py-3">
          <span className="text-xs text-[#8C8275]">
            Showing {filteredAndSorted.length} of {pantry.length} supplies.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-amber-500 px-4 py-1.5 text-xs font-semibold text-[#0F0E0C] transition hover:bg-amber-400"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
