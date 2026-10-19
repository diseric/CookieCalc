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
  Sun,
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
  kitchenWakeLockActive: boolean;
  onToggleKitchenWakeLock: () => void;
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
  kitchenWakeLockActive,
  onToggleKitchenWakeLock,
}) => {
  const isHealthyMargin = financials.grossMarginPercent >= 65;
  const isModerateMargin =
    financials.grossMarginPercent >= 45 && financials.grossMarginPercent < 65;

  return (
    <header className="sticky top-0 z-30 border-b border-[#2A2520] bg-[#0F0E0C]/95 pt-safe backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-3 py-2.5 sm:px-6 sm:py-3 lg:px-8">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          {/* Top Row: Brand + Kitchen Awake Toggle + Mobile Live KPI Pill */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-[#0F0E0C] shadow-lg shadow-amber-500/20 sm:h-10 sm:w-10">
                <Cookie className="h-5 w-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="text-sm font-bold tracking-tight text-[#F5F2EB] sm:text-base">
                    CookieCalc
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                    <Sparkles className="h-3 w-3" />
                    Custom Cookier Studio
                  </span>
                  <button
                    type="button"
                    onClick={onToggleKitchenWakeLock}
                    title="Kitchen Mode: Keep screen awake while weighing ingredients or piping royal icing"
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold transition ${
                      kitchenWakeLockActive
                        ? 'border-amber-400/60 bg-amber-500/20 text-amber-300'
                        : 'border-[#2E2924] bg-[#181614] text-[#8C8275] hover:text-[#D5CFC2]'
                    }`}
                  >
                    <Sun className="h-3 w-3 text-amber-400" />
                    <span>{kitchenWakeLockActive ? 'Awake On' : 'Kitchen Mode'}</span>
                  </button>
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
                <p className="hidden text-xs text-[#9E9589] sm:block">
                  Build Cutout Dough & Royal Icing Recipes • Exact Profit Per Cookie
                </p>
              </div>
            </div>

            {/* Mobile Quick Sticky KPI Pill */}
            <div className="flex items-center gap-2 rounded-xl border border-[#2E2924] bg-[#181614] px-2.5 py-1 lg:hidden">
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-[#9E9589]">
                  Cost
                </div>
                <div className="font-mono text-xs font-semibold text-[#F5F2EB] sm:text-sm">
                  {formatCurrency(financials.exactCostPerCookie)}
                </div>
              </div>
              <div className="h-5 w-px bg-[#2E2924]" />
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wider text-[#9E9589]">
                  Profit
                </div>
                <div
                  className={`font-mono text-xs font-bold sm:text-sm ${
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
              <div className="hidden h-5 w-px bg-[#2E2924] xs:block sm:block" />
              <div className="hidden text-right sm:block">
                <div className="text-[10px] uppercase tracking-wider text-[#9E9589]">
                  Dozen
                </div>
                <div className="font-mono text-xs font-bold text-amber-400 sm:text-sm">
                  {formatCurrency(financials.retailPricePerCookie * 12)}
                </div>
              </div>
            </div>
          </div>

          {/* Controls Row: Compact on mobile, full toolbar on desktop */}
          <div className="flex items-center gap-1.5 sm:flex-wrap sm:gap-2.5">
            {/* Active Recipe Dropdown */}
            <div className="relative min-w-0 flex-1 sm:flex-initial">
              <label htmlFor="recipe-select" className="sr-only">
                Select Cookie Recipe
              </label>
              <select
                id="recipe-select"
                value={activeRecipe.id}
                onChange={(e) => onSelectRecipe(e.target.value)}
                className="min-h-[40px] w-full truncate appearance-none rounded-xl border border-[#332D27] bg-[#181614] py-2 pl-3 pr-7 text-xs font-semibold text-[#F5F2EB] transition hover:border-amber-500/50 focus:border-amber-500 focus:outline-none sm:min-w-[240px]"
              >
                {recipes.map((r) => (
                  <option key={r.id} value={r.id} className="bg-[#181614] text-[#F5F2EB]">
                    {r.name} ({r.baseYieldCookies} cutouts)
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-400" />
            </div>

            {/* Batch Multiplier Pills */}
            <div
              className="flex shrink-0 items-center rounded-xl border border-[#2E2924] bg-[#141210] p-1"
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
                    className={`min-h-[32px] min-w-[30px] rounded-lg px-2 py-1 text-xs font-semibold transition ${
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

            {/* + Build New Recipe CTA Button (Desktop; on mobile it lives in bottom thumb bar) */}
            <button
              type="button"
              onClick={onOpenNewRecipeModal}
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-[#0F0E0C] shadow-sm shadow-amber-500/20 transition hover:bg-amber-400"
            >
              <PlusCircle className="h-3.5 w-3.5 stroke-[2.4]" />
              <span>+ Build Recipe</span>
            </button>

            {/* Quick Duplicate Recipe Button */}
            <button
              type="button"
              onClick={onDuplicateActiveRecipe}
              title="Duplicate current recipe to tweak ingredients"
              className="inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center gap-1 rounded-xl border border-[#332D27] bg-[#181614] px-2.5 py-2 text-xs font-medium text-[#D5CFC2] transition hover:border-amber-500/50 hover:text-[#F5F2EB]"
            >
              <Copy className="h-4 w-4 text-amber-400" />
              <span className="hidden sm:inline">Clone</span>
            </button>

            {/* Delete Recipe Button (if > 1 recipe) */}
            {recipes.length > 1 && (
              <button
                type="button"
                onClick={onDeleteActiveRecipe}
                title="Delete current recipe"
                className="inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-xl border border-[#2A2520] bg-[#141210] p-2 text-xs text-[#8C8275] transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}

            {/* Bulk Supply Book Button (Desktop; on mobile it lives in bottom thumb bar) */}
            <button
              type="button"
              onClick={onOpenPantry}
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-[#332D27] bg-[#181614] px-3 py-2 text-xs font-medium text-[#E5DEC9] transition hover:border-amber-500/50 hover:bg-[#221F1B]"
            >
              <Scale className="h-3.5 w-3.5 text-amber-400" />
              <span>Supply Book ({pantryCount})</span>
            </button>

            {/* Application Settings Button (Desktop; on mobile it lives in bottom thumb bar) */}
            <button
              type="button"
              onClick={onOpenSettings}
              title="Application Settings & Clear All Local Data"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-[#332D27] bg-[#181614] px-2.5 py-2 text-xs font-medium text-[#D5CFC2] transition hover:border-amber-500/50 hover:text-[#F5F2EB]"
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
