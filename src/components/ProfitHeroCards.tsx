import React, { useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Layers,
  Award,
  AlertTriangle,
  CheckCircle2,
  Scale,
  Palette,
  Ruler,
  PenLine,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  CookieRecipe,
  CutterSizeProfile,
  RecipeFinancialSummary,
  RollThickness,
} from '../types/bakery';
import { formatCurrency } from '../utils/calculations';
import { NumericInput } from './NumericInput';

interface ProfitHeroCardsProps {
  recipe: CookieRecipe;
  financials: RecipeFinancialSummary;
  onUpdateRecipeMeta: (patch: Partial<CookieRecipe>) => void;
}

const ROLL_THICKNESS_OPTIONS: RollThickness[] = [
  '1/4" (6mm)',
  '5/16" (8mm)',
  '3/8" (10mm)',
];

const CUTTER_PROFILES: CutterSizeProfile[] = [
  'Standard 3.5"–4" Cutouts',
  'Large 4.25"–4.5" Statement',
  'Mini 2"–2.5" Cutouts',
  'Mixed Dozen (Standard + Minis)',
];

export const ProfitHeroCards: React.FC<ProfitHeroCardsProps> = ({
  recipe,
  financials,
  onUpdateRecipeMeta,
}) => {
  const [showMobileAnatomy, setShowMobileAnatomy] = useState<boolean>(false);

  const margin = financials.grossMarginPercent;
  const isHealthy = margin >= 65;
  const isWarning = margin >= 45 && margin < 65;

  // Breakdown percentages of Cost Per Cookie
  const totalUnitCost = Math.max(financials.exactCostPerCookie, 0.0001);
  const doughIcingPct = Math.min(
    100,
    Math.round((financials.doughAndIcingCostPerCookie / totalUnitCost) * 100)
  );
  const decSuppliesPct = Math.min(
    100,
    Math.round((financials.decoratingSuppliesPerCookie / totalUnitCost) * 100)
  );
  const packPct = Math.min(
    100,
    Math.round((financials.packagingCostPerCookie / totalUnitCost) * 100)
  );
  const overheadPct = Math.max(0, 100 - doughIcingPct - decSuppliesPct - packPct);

  return (
    <section aria-label="Unit Economics & Profit Summary" className="space-y-3 sm:space-y-4">
      {/* Editable Recipe Title Banner + Rolled Cutout Specs */}
      <div className="flex flex-col justify-between gap-3.5 rounded-2xl border border-[#2A2520] bg-gradient-to-r from-[#181614] via-[#1C1916] to-[#181614] p-3.5 sm:p-5 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              aria-label="Recipe category or tier badge"
              value={recipe.badge}
              onChange={(e) => onUpdateRecipeMeta({ badge: e.target.value })}
              className="w-44 rounded-md border border-amber-500/25 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300 focus:border-amber-400 focus:outline-none sm:w-48"
            />
            <span className="text-xs text-[#9E9589]">
              • {financials.batchMultiplier}x ={' '}
              <strong className="font-mono text-[#F5F2EB]">
                {financials.effectiveYield} cutouts
              </strong>{' '}
              ({financials.effectiveDozens} doz)
            </span>
          </div>

          {/* Inline Editable Recipe Name */}
          <div className="group relative flex items-center gap-2">
            <input
              type="text"
              aria-label="Recipe Name"
              value={recipe.name}
              onChange={(e) => onUpdateRecipeMeta({ name: e.target.value })}
              placeholder="Enter Recipe or Custom Set Name..."
              className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-lg font-bold tracking-tight text-[#F5F2EB] transition hover:border-[#332D27] focus:border-amber-500 focus:bg-[#12100E] focus:px-2.5 focus:outline-none sm:text-2xl"
            />
            <PenLine className="h-4 w-4 shrink-0 text-[#786F64] opacity-60 group-hover:opacity-100" />
          </div>

          {/* Inline Editable Subtitle / Baking Notes */}
          <input
            type="text"
            aria-label="Recipe Description and Notes"
            value={recipe.subtitle}
            onChange={(e) => onUpdateRecipeMeta({ subtitle: e.target.value })}
            placeholder="Add baking temp, chill time, or design notes..."
            className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-xs text-[#A69C8E] transition hover:border-[#332D27] focus:border-amber-500 focus:bg-[#12100E] focus:px-2.5 focus:outline-none sm:text-sm"
          />
        </div>

        {/* Rolled Cutout & Royal Icing Specs Controls (Responsive 2-Col Mobile Grid + Touch Steppers) */}
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2.5 lg:self-center">
          {/* 1x Batch Cutout Yield with Touch Steppers */}
          <div className="rounded-xl border border-[#2E2924] bg-[#12100E] px-2.5 py-2 sm:px-3">
            <label
              htmlFor="base-yield-input"
              className="block text-[11px] font-medium text-[#9E9589] sm:text-xs"
            >
              1x Cutout Yield ({(recipe.baseYieldCookies / 12).toFixed(1)} dz)
            </label>
            <div className="mt-1 flex items-center gap-1">
              <button
                type="button"
                aria-label="Decrease batch yield"
                onClick={() =>
                  onUpdateRecipeMeta({
                    baseYieldCookies: Math.max(1, recipe.baseYieldCookies - 1),
                  })
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2E2924] bg-[#181614] text-[#D5CFC2] active:bg-amber-500 active:text-[#0F0E0C]"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <NumericInput
                id="base-yield-input"
                integer
                min={1}
                max={300}
                value={recipe.baseYieldCookies}
                onValueChange={(val) =>
                  onUpdateRecipeMeta({
                    baseYieldCookies: val,
                  })
                }
                className="w-10 bg-transparent text-center font-mono text-sm font-bold text-amber-400 focus:outline-none sm:text-base"
              />
              <button
                type="button"
                aria-label="Increase batch yield"
                onClick={() =>
                  onUpdateRecipeMeta({
                    baseYieldCookies: Math.min(300, recipe.baseYieldCookies + 1),
                  })
                }
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#2E2924] bg-[#181614] text-[#D5CFC2] active:bg-amber-500 active:text-[#0F0E0C]"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Roll Thickness Guide */}
          <div className="rounded-xl border border-[#2E2924] bg-[#12100E] px-2.5 py-2 sm:px-3">
            <label
              htmlFor="roll-thickness-select"
              className="flex items-center gap-1 text-[11px] font-medium text-[#9E9589] sm:text-xs"
            >
              <Ruler className="h-3 w-3 text-amber-400" />
              Roll Thickness
            </label>
            <select
              id="roll-thickness-select"
              value={recipe.rollThickness}
              onChange={(e) =>
                onUpdateRecipeMeta({
                  rollThickness: e.target.value as RollThickness,
                })
              }
              className="mt-1.5 w-full bg-transparent font-mono text-xs font-bold text-[#F5F2EB] focus:outline-none"
            >
              {ROLL_THICKNESS_OPTIONS.map((t) => (
                <option key={t} value={t} className="bg-[#181614] text-[#F5F2EB]">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Cutter Size Profile & Color Count (Full width across the 2 mobile cols) */}
          <div className="col-span-2 rounded-xl border border-[#2E2924] bg-[#12100E] px-2.5 py-2 sm:col-span-1 sm:px-3">
            <label
              htmlFor="cutter-profile-select"
              className="flex items-center gap-1 text-[11px] font-medium text-[#9E9589] sm:text-xs"
            >
              <Palette className="h-3 w-3 text-amber-400" />
              Cutter Size & Royal Icing Colors
            </label>
            <div className="mt-1 flex items-center justify-between gap-2">
              <select
                id="cutter-profile-select"
                value={recipe.cutterSizeProfile}
                onChange={(e) =>
                  onUpdateRecipeMeta({
                    cutterSizeProfile: e.target.value as CutterSizeProfile,
                  })
                }
                className="min-w-0 flex-1 truncate bg-transparent text-xs font-bold text-[#F5F2EB] focus:outline-none"
              >
                {CUTTER_PROFILES.map((c) => (
                  <option key={c} value={c} className="bg-[#181614] text-[#F5F2EB]">
                    {c}
                  </option>
                ))}
              </select>
              <div className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/15 px-1.5 py-0.5">
                <button
                  type="button"
                  aria-label="Decrease icing colors"
                  onClick={() =>
                    onUpdateRecipeMeta({
                      colorCount: Math.max(1, recipe.colorCount - 1),
                    })
                  }
                  className="px-1 text-amber-300 active:scale-110"
                >
                  -
                </button>
                <NumericInput
                  integer
                  min={1}
                  max={30}
                  aria-label="Number of icing colors"
                  value={recipe.colorCount}
                  onValueChange={(val) =>
                    onUpdateRecipeMeta({
                      colorCount: val,
                    })
                  }
                  className="w-6 bg-transparent text-center font-mono text-xs font-bold text-amber-300 focus:outline-none"
                />
                <span className="text-[11px] text-amber-300">colors</span>
                <button
                  type="button"
                  aria-label="Increase icing colors"
                  onClick={() =>
                    onUpdateRecipeMeta({
                      colorCount: Math.min(30, recipe.colorCount + 1),
                    })
                  }
                  className="px-1 text-amber-300 active:scale-110"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Card KPI Spotlight Grid: 2x2 on Mobile, 4-col on Desktop */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 xl:grid-cols-4">
        {/* Card 1: Exact Cost Per Cookie & Per Dozen */}
        <div className="relative overflow-hidden rounded-2xl border border-[#2E2924] bg-[#181614] p-3 shadow-sm sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9E9589] sm:text-xs">
              Cost / Cutout
            </span>
            <div className="hidden h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 sm:flex sm:h-8 sm:w-8">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5 sm:mt-2 sm:gap-2">
            <span className="font-mono text-xl font-bold tracking-tight text-[#F5F2EB] sm:text-3xl">
              {formatCurrency(financials.exactCostPerCookie)}
            </span>
            <span className="font-mono text-[11px] text-amber-400 sm:text-xs">
              ({formatCurrency(financials.exactCostPerDozen)}/dz)
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-[#26221E] pt-2 text-[11px] text-[#A69C8E] sm:mt-3 sm:pt-2.5 sm:text-xs">
            <span>Dough+Icing: {formatCurrency(financials.doughAndIcingCostPerCookie)}</span>
            <span className="hidden sm:inline">
              Bags+Box: {formatCurrency(financials.packagingCostPerCookie + financials.decoratingSuppliesPerCookie)}
            </span>
          </div>
        </div>

        {/* Card 2: Net Profit Per Cookie & Per Dozen (Hero Highlight) */}
        <div
          className={`relative overflow-hidden rounded-2xl border p-3 shadow-md sm:p-4 ${
            isHealthy
              ? 'border-emerald-500/40 bg-gradient-to-br from-[#13221C] via-[#161A17] to-[#181614]'
              : isWarning
              ? 'border-amber-500/40 bg-gradient-to-br from-[#241D12] via-[#1B1814] to-[#181614]'
              : 'border-rose-500/40 bg-gradient-to-br from-[#271416] via-[#1C1515] to-[#181614]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90 sm:text-xs">
              Profit / Cookie
            </span>
            <div
              className={`hidden h-7 w-7 items-center justify-center rounded-lg sm:flex sm:h-8 sm:w-8 ${
                isHealthy
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : isWarning
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5 sm:mt-2 sm:gap-2">
            <span
              className={`font-mono text-xl font-bold tracking-tight sm:text-3xl ${
                isHealthy
                  ? 'text-emerald-400'
                  : isWarning
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {financials.netProfitPerCookie >= 0 ? '+' : ''}
              {formatCurrency(financials.netProfitPerCookie)}
            </span>
            <span className="text-[11px] text-[#A69C8E] sm:text-xs">
              @{formatCurrency(financials.retailPricePerCookie)}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-white/10 pt-2 text-[11px] sm:mt-3 sm:pt-2.5 sm:text-xs">
            <span className="font-mono font-semibold text-emerald-300">
              +{formatCurrency(financials.netProfitPerCookie * 12)}/doz
            </span>
            <span className="hidden text-[#D5CFC2] sm:inline">
              Quote: <strong className="font-mono">{formatCurrency(financials.retailPricePerCookie * 12)}/dz</strong>
            </span>
          </div>
        </div>

        {/* Card 3: Gross Profit Margin & Custom Cookier Benchmark */}
        <div className="relative overflow-hidden rounded-2xl border border-[#2E2924] bg-[#181614] p-3 shadow-sm sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9E9589] sm:text-xs">
              Set Margin %
            </span>
            <div className="hidden h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 sm:flex sm:h-8 sm:w-8">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5 sm:mt-2 sm:gap-2.5">
            <span className="font-mono text-xl font-bold tracking-tight text-[#F5F2EB] sm:text-3xl">
              {margin.toFixed(1)}%
            </span>
            <span
              className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium sm:px-2 sm:text-xs ${
                isHealthy
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : isWarning
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {isHealthy ? (
                <>
                  <CheckCircle2 className="h-3 w-3" /> Strong
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3" /> Low
                </>
              )}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-[#26221E] pt-2 text-[11px] text-[#A69C8E] sm:mt-3 sm:pt-2.5 sm:text-xs">
            <span>COGS: {(100 - margin).toFixed(0)}%</span>
            <span>Break-even: {financials.breakEvenCookies}</span>
          </div>
        </div>

        {/* Card 4: Total Batch Take-Home Profit */}
        <div className="relative overflow-hidden rounded-2xl border border-[#2E2924] bg-[#181614] p-3 shadow-sm sm:p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#9E9589] sm:text-xs">
              Batch Net ({financials.effectiveDozens} dz)
            </span>
            <div className="hidden h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 sm:flex sm:h-8 sm:w-8">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-1.5 sm:mt-2 sm:gap-2">
            <span className="font-mono text-xl font-bold tracking-tight text-amber-400 sm:text-3xl">
              {formatCurrency(financials.totalBatchNetProfit)}
            </span>
            <span className="text-[11px] text-[#9E9589] sm:text-xs">
              / {financials.effectiveYield} ea
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-1 border-t border-[#26221E] pt-2 text-[11px] text-[#A69C8E] sm:mt-3 sm:pt-2.5 sm:text-xs">
            <span>Cost: {formatCurrency(financials.totalBatchCost)}</span>
            <span className="hidden sm:inline">Sales: {formatCurrency(financials.totalBatchRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Per-Cookie Cost Anatomy Bar (Collapsible legend on mobile for clean vertical space) */}
      <div className="rounded-2xl border border-[#2A2520] bg-[#181614] px-3.5 py-3 sm:p-4">
        <div className="flex items-center justify-between gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowMobileAnatomy((prev) => !prev)}
            className="flex flex-1 items-center justify-between gap-2 text-left font-semibold text-[#E5DEC9] sm:cursor-default"
          >
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                Cost Anatomy ({formatCurrency(financials.exactCostPerCookie)}/ea •{' '}
                {formatCurrency(financials.exactCostPerDozen)}/doz)
              </span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 sm:hidden">
              {showMobileAnatomy ? (
                <>
                  <span>Hide</span>
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>Details</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </span>
          </button>

          <div className="hidden flex-wrap items-center gap-4 text-xs text-[#A69C8E] sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Dough & Icing:{' '}
              <strong className="font-mono text-[#F5F2EB]">
                {formatCurrency(financials.doughAndIcingCostPerCookie)}
              </strong>{' '}
              ({doughIcingPct}%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-pink-400" />
              Colors & Bags:{' '}
              <strong className="font-mono text-[#F5F2EB]">
                {formatCurrency(financials.decoratingSuppliesPerCookie)}
              </strong>{' '}
              ({decSuppliesPct}%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
              Cello & Box:{' '}
              <strong className="font-mono text-[#F5F2EB]">
                {formatCurrency(financials.packagingCostPerCookie)}
              </strong>{' '}
              ({packPct}%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
              Overhead:{' '}
              <strong className="font-mono text-[#F5F2EB]">
                {formatCurrency(financials.laborAndOverheadPerCookie)}
              </strong>{' '}
              ({overheadPct}%)
            </span>
          </div>
        </div>

        <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-[#100E0C] p-0.5 sm:mt-2.5 sm:h-3">
          <div
            style={{ width: `${Math.max(doughIcingPct, 4)}%` }}
            className="h-full rounded-l-full bg-amber-500 transition-all duration-300"
            title={`Cutout Dough & Royal Icing: ${doughIcingPct}%`}
          />
          <div
            style={{ width: `${Math.max(decSuppliesPct, 3)}%` }}
            className="h-full bg-pink-400 transition-all duration-300"
            title={`Tipless Bags, Gel Colors & Dusts: ${decSuppliesPct}%`}
          />
          <div
            style={{ width: `${Math.max(packPct, 3)}%` }}
            className="h-full bg-sky-400 transition-all duration-300"
            title={`Heat-Seal Cello Bags & Box: ${packPct}%`}
          />
          <div
            style={{ width: `${Math.max(overheadPct, 2)}%` }}
            className="h-full rounded-r-full bg-purple-400 transition-all duration-300"
            title={`Dehydrator & Overhead: ${overheadPct}%`}
          />
        </div>

        {/* Mobile Expandable Legend */}
        {showMobileAnatomy && (
          <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-[#26221E] pt-2.5 text-[11px] text-[#A69C8E] sm:hidden">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" />
              <span>
                Dough/Icing: <strong className="font-mono text-[#F5F2EB]">{formatCurrency(financials.doughAndIcingCostPerCookie)}</strong> ({doughIcingPct}%)
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-pink-400" />
              <span>
                Colors/Bags: <strong className="font-mono text-[#F5F2EB]">{formatCurrency(financials.decoratingSuppliesPerCookie)}</strong> ({decSuppliesPct}%)
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-sky-400" />
              <span>
                Packaging: <strong className="font-mono text-[#F5F2EB]">{formatCurrency(financials.packagingCostPerCookie)}</strong> ({packPct}%)
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full bg-purple-400" />
              <span>
                Overhead: <strong className="font-mono text-[#F5F2EB]">{formatCurrency(financials.laborAndOverheadPerCookie)}</strong> ({overheadPct}%)
              </span>
            </span>
          </div>
        )}
      </div>
    </section>
  );
};
