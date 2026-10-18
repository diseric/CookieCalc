import React from 'react';
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
    <section aria-label="Unit Economics & Profit Summary" className="space-y-4">
      {/* Editable Recipe Title Banner + Rolled Cutout Specs */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-[#2A2520] bg-gradient-to-r from-[#181614] via-[#1C1916] to-[#181614] p-4 sm:p-5 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              aria-label="Recipe category or tier badge"
              value={recipe.badge}
              onChange={(e) => onUpdateRecipeMeta({ badge: e.target.value })}
              className="w-48 rounded-md border border-amber-500/25 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300 focus:border-amber-400 focus:outline-none"
            />
            <span className="text-xs text-[#9E9589]">
              • {financials.batchMultiplier}x Batch ={' '}
              <strong className="font-mono text-[#F5F2EB]">
                {financials.effectiveYield} cutouts
              </strong>{' '}
              ({financials.effectiveDozens} dozen)
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
              className="w-full rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-xl font-bold tracking-tight text-[#F5F2EB] transition hover:border-[#332D27] focus:border-amber-500 focus:bg-[#12100E] focus:px-2.5 focus:outline-none sm:text-2xl"
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

        {/* Rolled Cutout & Royal Icing Specs Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
          {/* 1x Batch Cutout Yield */}
          <div className="rounded-xl border border-[#2E2924] bg-[#12100E] px-3 py-2">
            <label
              htmlFor="base-yield-input"
              className="block text-xs font-medium text-[#9E9589]"
            >
              1x Batch Cutout Yield
            </label>
            <div className="mt-0.5 flex items-baseline gap-1.5">
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
                className="w-12 bg-transparent font-mono text-base font-bold text-amber-400 focus:outline-none"
              />
              <span className="text-xs text-[#8C8275]">
                cutouts ({(recipe.baseYieldCookies / 12).toFixed(1)} doz)
              </span>
            </div>
          </div>

          {/* Roll Thickness Guide */}
          <div className="rounded-xl border border-[#2E2924] bg-[#12100E] px-3 py-2">
            <label
              htmlFor="roll-thickness-select"
              className="flex items-center gap-1 text-xs font-medium text-[#9E9589]"
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
              className="mt-0.5 bg-transparent font-mono text-xs font-bold text-[#F5F2EB] focus:outline-none"
            >
              {ROLL_THICKNESS_OPTIONS.map((t) => (
                <option key={t} value={t} className="bg-[#181614] text-[#F5F2EB]">
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Cutter Size Profile & Color Count */}
          <div className="rounded-xl border border-[#2E2924] bg-[#12100E] px-3 py-2">
            <label
              htmlFor="cutter-profile-select"
              className="flex items-center gap-1 text-xs font-medium text-[#9E9589]"
            >
              <Palette className="h-3 w-3 text-amber-400" />
              Cutter Size & Icing Colors
            </label>
            <div className="mt-0.5 flex items-center gap-2">
              <select
                id="cutter-profile-select"
                value={recipe.cutterSizeProfile}
                onChange={(e) =>
                  onUpdateRecipeMeta({
                    cutterSizeProfile: e.target.value as CutterSizeProfile,
                  })
                }
                className="bg-transparent text-xs font-bold text-[#F5F2EB] focus:outline-none"
              >
                {CUTTER_PROFILES.map((c) => (
                  <option key={c} value={c} className="bg-[#181614] text-[#F5F2EB]">
                    {c}
                  </option>
                ))}
              </select>
              <div className="flex items-center rounded bg-amber-500/15 px-1.5 py-0.5">
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
                  className="w-7 bg-transparent text-center font-mono text-xs font-bold text-amber-300 focus:outline-none"
                />
                <span className="text-xs text-amber-300">colors</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Card KPI Spotlight Grid */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Card 1: Exact Cost Per Cookie & Per Dozen */}
        <div className="relative overflow-hidden rounded-2xl border border-[#2E2924] bg-[#181614] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E9589]">
              Exact Cost / Cutout
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-[#F5F2EB]">
              {formatCurrency(financials.exactCostPerCookie)}
            </span>
            <span className="font-mono text-xs text-amber-400">
              ({formatCurrency(financials.exactCostPerDozen)} / doz)
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#26221E] pt-2.5 text-xs text-[#A69C8E]">
            <span>Dough+Icing: {formatCurrency(financials.doughAndIcingCostPerCookie)}</span>
            <span>Bags+Box: {formatCurrency(financials.packagingCostPerCookie + financials.decoratingSuppliesPerCookie)}</span>
          </div>
        </div>

        {/* Card 2: Net Profit Per Cookie & Per Dozen (Hero Highlight) */}
        <div
          className={`relative overflow-hidden rounded-2xl border p-4 shadow-md ${
            isHealthy
              ? 'border-emerald-500/40 bg-gradient-to-br from-[#13221C] via-[#161A17] to-[#181614]'
              : isWarning
              ? 'border-amber-500/40 bg-gradient-to-br from-[#241D12] via-[#1B1814] to-[#181614]'
              : 'border-rose-500/40 bg-gradient-to-br from-[#271416] via-[#1C1515] to-[#181614]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-300/90">
              Net Profit / Cookie
            </span>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
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
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`font-mono text-3xl font-bold tracking-tight ${
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
            <span className="text-xs text-[#A69C8E]">
              at {formatCurrency(financials.retailPricePerCookie)}/ea
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-xs">
            <span className="text-[#D5CFC2]">
              Quote: <strong className="font-mono">{formatCurrency(financials.retailPricePerCookie * 12)}/doz</strong>
            </span>
            <span className="font-mono font-semibold text-emerald-300">
              +{formatCurrency(financials.netProfitPerCookie * 12)} profit/doz
            </span>
          </div>
        </div>

        {/* Card 3: Gross Profit Margin & Custom Cookier Benchmark */}
        <div className="relative overflow-hidden rounded-2xl border border-[#2E2924] bg-[#181614] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E9589]">
              Custom Set Margin %
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Award className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2.5">
            <span className="font-mono text-3xl font-bold tracking-tight text-[#F5F2EB]">
              {margin.toFixed(1)}%
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
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
                  <AlertTriangle className="h-3 w-3" /> Low for Custom
                </>
              )}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#26221E] pt-2.5 text-xs text-[#A69C8E]">
            <span>Materials Cost: {(100 - margin).toFixed(1)}%</span>
            <span>Break-even: {financials.breakEvenCookies} cookies</span>
          </div>
        </div>

        {/* Card 4: Total Batch Take-Home Profit */}
        <div className="relative overflow-hidden rounded-2xl border border-[#2E2924] bg-[#181614] p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9E9589]">
              Set Net Profit ({financials.effectiveDozens} Doz)
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-mono text-3xl font-bold tracking-tight text-amber-400">
              {formatCurrency(financials.totalBatchNetProfit)}
            </span>
            <span className="text-xs text-[#9E9589]">
              / {financials.effectiveYield} cookies
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[#26221E] pt-2.5 text-xs text-[#A69C8E]">
            <span>Supplies: {formatCurrency(financials.totalBatchCost)}</span>
            <span>Order Total: {formatCurrency(financials.totalBatchRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Per-Cookie Cost Anatomy Bar */}
      <div className="rounded-2xl border border-[#2A2520] bg-[#181614] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 font-semibold text-[#E5DEC9]">
            <Layers className="h-4 w-4 text-amber-400" />
            <span>
              Decorated Cutout Cost Anatomy ({formatCurrency(financials.exactCostPerCookie)} / cookie •{' '}
              {formatCurrency(financials.exactCostPerDozen)} / dozen)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-[#A69C8E]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Cutout Dough & Royal Icing:{' '}
              <strong className="font-mono text-[#F5F2EB]">
                {formatCurrency(financials.doughAndIcingCostPerCookie)}
              </strong>{' '}
              ({doughIcingPct}%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-pink-400" />
              Tipless Bags, Gel Colors & Dusts:{' '}
              <strong className="font-mono text-[#F5F2EB]">
                {formatCurrency(financials.decoratingSuppliesPerCookie)}
              </strong>{' '}
              ({decSuppliesPct}%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
              Cello Bags & Bakery Box:{' '}
              <strong className="font-mono text-[#F5F2EB]">
                {formatCurrency(financials.packagingCostPerCookie)}
              </strong>{' '}
              ({packPct}%)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-400" />
              Dehydrator/Overhead:{' '}
              <strong className="font-mono text-[#F5F2EB]">
                {formatCurrency(financials.laborAndOverheadPerCookie)}
              </strong>{' '}
              ({overheadPct}%)
            </span>
          </div>
        </div>

        <div className="mt-2.5 flex h-3 w-full overflow-hidden rounded-full bg-[#100E0C] p-0.5">
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
      </div>
    </section>
  );
};
