import React from 'react';
import {
  Cookie,
  Scale,
  Sparkles,
  ChevronDown,
  PlusCircle,
  Copy,
  Trash2,
  Settings,
  HardDrive,
} from 'lucide-react';
import { CookieRecipe, RecipeFinancialSummary } from '../types/bakery';
import { formatCurrency } from '../utils/calculations';

interface HeaderBarProps {
  recipes: CookieRecipe[];
  activeRecipe: CookieRecipe;
  onSelectRecipe: (recipeId: string) => void;
  onOpenNewRecipeModal: () => void;
  onDuplicateActiveRecipe: () => void;
  onDeleteActiveRecipe: () => void;
  batchMultiplier: number;
  onChangeBatchMultiplier: (mult: number) => void;
  financials: RecipeFinancialSummary;
  pantryCount: number;
  onOpenPantry: () => void;
  onOpenSettings: () => void;
}

const MULTIPLIERS = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 3, label: '3x' },
  { value: 5, label: '5x' },
];

export const HeaderBar: React.FC<HeaderBarProps> = ({
  recipes,
  activeRecipe,
  onSelectRecipe,
  onOpenNewRecipeModal,
  onDuplicateActiveRecipe,
  onDeleteActiveRecipe,
  batchMultiplier,
  onChangeBatchMultiplier,
  financials,
  pantryCount,
  onOpenPantry,
  onOpenSettings,
}) => {
  const isHealthyMargin = financials.grossMarginPercent >= 65;
  const isModerateMargin =
    financials.grossMarginPercent >= 45 && financials.grossMarginPercent < 65;

  return (
    <header className="sticky top-0 z-30 border-b border-[#2A2520] bg-[#0F0E0C]/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Brand + Saved Locally Pill + Mobile KPI Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-[#0F0E0C] shadow-lg shadow-amber-500/20">
                <Cookie className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-[#F5F2EB]">
                    CookieCalc
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                    <Sparkles className="h-3 w-3" />
                    Custom Cookier Studio
                  </span>
                  <button
                    type="button"
                    onClick={onOpenSettings}
                    title="All changes auto-saved to browser localStorage. Click to manage or clear data."
                    className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-300 transition hover:bg-emerald-500/20"
                  >
                    <HardDrive className="h-3 w-3 text-emerald-400" />
                    <span>Saved Locally</span>
                  </button>
                </div>
                <p className="text-xs text-[#9E9589]">
                  Build Cutout Dough & Royal Icing Recipes • Exact Profit Per Cookie
                </p>
              </div>
            </div>

            {/* Mobile Quick Sticky KPI Pill */}
            <div className="flex items-center gap-2 rounded-xl border border-[#2E2924] bg-[#181614] px-3 py-1.5 lg:hidden">
              <div className="text-right">
                <div className="text-xs text-[#9E9589]">Cost / Cookie</div>
                <div className="font-mono text-sm font-semibold text-[#F5F2EB]">
                  {formatCurrency(financials.exactCostPerCookie)}
                </div>
              </div>
              <div className="h-6 w-px bg-[#2E2924]" />
              <div className="text-right">
                <div className="text-xs text-[#9E9589]">Profit / Cookie</div>
                <div
                  className={`font-mono text-sm font-bold ${
                    isHealthyMargin
                      ? 'text-emerald-400'
                      : isModerateMargin
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  +{formatCurrency(financials.netProfitPerCookie)}
                </div>
              </div>
            </div>
          </div>

          {/* Controls Row: Recipe Selector, + Build New Recipe, Clone, Batch Multiplier, Supply Book, Settings */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            {/* Active Recipe Dropdown */}
            <div className="relative flex-1 sm:flex-initial">
              <label htmlFor="recipe-select" className="sr-only">
                Select Cookie Recipe
              </label>
              <select
                id="recipe-select"
                value={activeRecipe.id}
                onChange={(e) => onSelectRecipe(e.target.value)}
                className="w-full appearance-none rounded-xl border border-[#332D27] bg-[#181614] py-2 pl-3 pr-8 text-xs font-semibold text-[#F5F2EB] transition hover:border-amber-500/50 focus:border-amber-500 focus:outline-none sm:min-w-[240px]"
              >
                {recipes.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#181614] text-[#F5F2EB]">
                    {r.name} ({r.baseYieldCookies} cutouts)
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" />
            </div>

            {/* + Build New Recipe CTA Button */}
            <button
              type="button"
              onClick={onOpenNewRecipeModal}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-[#0F0E0C] shadow-sm shadow-amber-500/20 transition hover:bg-amber-400"
            >
              <PlusCircle className="h-3.5 w-3.5 stroke-[2.4]" />
              <span>+ Build Recipe</span>
            </button>

            {/* Quick Duplicate Recipe Button */}
            <button
              type="button"
              onClick={onDuplicateActiveRecipe}
              title="Duplicate current recipe to tweak ingredients"
              className="inline-flex items-center gap-1 rounded-xl border border-[#332D27] bg-[#181614] px-2.5 py-2 text-xs font-medium text-[#D5CFC2] transition hover:border-amber-500/50 hover:text-[#F5F2EB]"
            >
              <Copy className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Clone</span>
            </button>

            {/* Delete Recipe Button (if > 1 recipe) */}
            {recipes.length > 1 && (
              <button
                type="button"
                onClick={onDeleteActiveRecipe}
                title="Delete current recipe"
                className="inline-flex items-center rounded-xl border border-[#2A2520] bg-[#141210] p-2 text-xs text-[#8C8275] transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Batch Multiplier Pills */}
            <div
              className="flex items-center rounded-xl border border-[#2E2924] bg-[#141210] p-1"
              role="group"
              aria-label="Batch scaling multiplier"
            >
              {MULTIPLIERS.map((m) => {
                const active = batchMultiplier === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => onChangeBatchMultiplier(m.value)}
                    className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                      active
                        ? 'bg-amber-500 text-[#0F0E0C] shadow-sm'
                        : 'text-[#A69C8E] hover:text-[#F5F2EB]'
                    }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>

            {/* Bulk Supply Book Button */}
            <button
              type="button"
              onClick={onOpenPantry}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#332D27] bg-[#181614] px-3 py-2 text-xs font-medium text-[#E5DEC9] transition hover:border-amber-500/50 hover:bg-[#221F1B]"
            >
              <Scale className="h-3.5 w-3.5 text-amber-400" />
              <span>Supply Book ({pantryCount})</span>
            </button>

            {/* Application Settings & Clear All Data Button */}
            <button
              type="button"
              onClick={onOpenSettings}
              title="Application Settings & Clear All Local Data"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#332D27] bg-[#181614] px-2.5 py-2 text-xs font-medium text-[#D5CFC2] transition hover:border-amber-500/50 hover:text-[#F5F2EB]"
            >
              <Settings className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden xl:inline">Settings</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
