import React, { useState } from 'react';
import {
  Sliders,
  ShoppingBag,
  Target,
  Sparkles,
  ArrowUpRight,
  ClipboardCheck,
  Copy,
} from 'lucide-react';
import { CookieRecipe, RecipeFinancialSummary } from '../types/bakery';
import { formatCurrency } from '../utils/calculations';

interface PricingSimulatorProps {
  recipe: CookieRecipe;
  financials: RecipeFinancialSummary;
  monthlyProfitGoal: number;
  onChangeMonthlyProfitGoal: (goal: number) => void;
  onUpdateRecipeMeta: (patch: Partial<CookieRecipe>) => void;
}

export const PricingSimulator: React.FC<PricingSimulatorProps> = ({
  recipe,
  financials,
  monthlyProfitGoal,
  onChangeMonthlyProfitGoal,
  onUpdateRecipeMeta,
}) => {
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);

  // Per-cookie and per-dozen metrics
  const cost = financials.exactCostPerCookie;
  const singlePrice = recipe.targetRetailPrice;
  const singleProfit = singlePrice - cost;

  const baseDozenPrice = singlePrice * 12;

  // Custom Set Order Matrix: Single Favor, Half-Dozen (6), 1 Dozen (12), 2 Dozen Event Set (24)
  const halfDozenPrice =
    singlePrice * 6 * (1 - recipe.halfDozenDiscountPercent / 100);
  const halfDozenCost = cost * 6;
  const halfDozenProfit = halfDozenPrice - halfDozenCost;

  const dozenPrice =
    singlePrice * 12 * (1 - recipe.dozenDiscountPercent / 100);
  const dozenCost = cost * 12;
  const dozenProfit = dozenPrice - dozenCost;

  const twoDozenPrice = dozenPrice * 2;
  const twoDozenCost = dozenCost * 2;
  const twoDozenProfit = twoDozenPrice - twoDozenCost;

  // Goal calculator (in dozens and cookies)
  const dozensNeededForGoal =
    dozenProfit > 0 ? (monthlyProfitGoal / dozenProfit).toFixed(1) : '0';
  const cookiesNeededForGoal =
    singleProfit > 0 ? Math.ceil(monthlyProfitGoal / singleProfit) : 0;

  const handleCopyQuote = () => {
    const summary = [
      `Custom Cookie Quote — ${recipe.name}`,
      `Specs: ${recipe.cutterSizeProfile} (${recipe.rollThickness} thick, up to ${recipe.colorCount} royal icing colors)`,
      `• Single Favor (Heat-Sealed): ${formatCurrency(singlePrice)}/ea`,
      `• Half-Dozen Box (6 Cutouts): ${formatCurrency(halfDozenPrice)}`,
      `• 1 Dozen Custom Set (12 Cutouts): ${formatCurrency(dozenPrice)}`,
      `• 2 Dozen Event Package (24 Cutouts): ${formatCurrency(twoDozenPrice)}`,
    ].join('\n');

    navigator.clipboard?.writeText(summary).catch(() => {});
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  return (
    <aside className="space-y-5">
      {/* Interactive Custom Set Price Slider & Direct Input Card */}
      <div className="rounded-2xl border border-[#2E2924] bg-[#181614] p-5 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-amber-400" />
            <h2 className="text-base font-bold text-[#F5F2EB]">
              Custom Cookie & Dozen Pricing
            </h2>
          </div>
          <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-300">
            {formatCurrency(baseDozenPrice)} / doz
          </span>
        </div>

        <p className="mt-1 text-xs text-[#9E9589]">
          Slide or type your exact price per cookie to see profit per cookie and per dozen.
        </p>

        {/* Price Slider + Direct Numeric Input */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A69C8E]">
              Quote Price Per Cookie
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-[#332D27] bg-[#12100E] px-2.5 py-1">
                <span className="font-mono text-sm font-bold text-amber-400">$</span>
                <input
                  type="number"
                  step="0.25"
                  min={0.5}
                  max={50}
                  aria-label="Direct retail price per cookie"
                  value={recipe.targetRetailPrice}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (Number.isFinite(val) && val > 0 && val <= 100) {
                      onUpdateRecipeMeta({ targetRetailPrice: val });
                    }
                  }}
                  className="w-16 bg-transparent text-right font-mono text-lg font-bold text-amber-400 focus:outline-none"
                />
              </div>
              <span className="font-mono text-xs text-[#D5CFC2]">
                ({formatCurrency(baseDozenPrice)}/doz)
              </span>
            </div>
          </div>

          <input
            type="range"
            min={3.0}
            max={9.5}
            step={0.25}
            value={Math.min(9.5, Math.max(3.0, recipe.targetRetailPrice))}
            onChange={(e) =>
              onUpdateRecipeMeta({ targetRetailPrice: parseFloat(e.target.value) })
            }
            className="amber-slider mt-3 w-full"
            aria-label="Target retail price per cookie slider"
          />

          <div className="mt-1.5 flex justify-between font-mono text-xs text-[#786F64]">
            <span>$3.50 ($42/dz)</span>
            <span>$5.50 ($66/dz)</span>
            <span>$7.50 ($90/dz)</span>
            <span>$9.50 ($114/dz)</span>
          </div>
        </div>

        {/* Custom Cookier Complexity Tier Presets */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onUpdateRecipeMeta({ targetRetailPrice: 4.5 })}
            className={`rounded-xl border p-2 text-left transition ${
              recipe.targetRetailPrice === 4.5
                ? 'border-amber-500 bg-amber-500/15'
                : 'border-[#2E2924] bg-[#141210] hover:border-amber-500/40'
            }`}
          >
            <div className="text-xs text-[#8C8275]">Basic / 3-Color</div>
            <div className="mt-0.5 font-mono text-xs font-bold text-[#F5F2EB]">
              $4.50 ($54/dz)
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateRecipeMeta({ targetRetailPrice: 5.5 })}
            className={`rounded-xl border p-2 text-left transition ${
              recipe.targetRetailPrice === 5.5
                ? 'border-amber-500 bg-amber-500/15'
                : 'border-amber-500/30 bg-amber-500/10 hover:border-amber-500'
            }`}
          >
            <div className="flex items-center gap-1 text-xs font-medium text-amber-300">
              <Sparkles className="h-3 w-3" /> Detailed Set
            </div>
            <div className="mt-0.5 font-mono text-xs font-bold text-amber-400">
              $5.50 ($66/dz)
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateRecipeMeta({ targetRetailPrice: 6.5 })}
            className={`rounded-xl border p-2 text-left transition ${
              recipe.targetRetailPrice === 6.5
                ? 'border-amber-500 bg-amber-500/15'
                : 'border-[#2E2924] bg-[#141210] hover:border-amber-500/40'
            }`}
          >
            <div className="text-xs text-[#8C8275]">Elaborate / 3D</div>
            <div className="mt-0.5 font-mono text-xs font-bold text-[#F5F2EB]">
              $6.50 ($78/dz)
            </div>
          </button>
        </div>

        {/* Visual Split Bar: Hard Cost vs Net Profit inside 1 Cookie */}
        <div className="mt-5 rounded-xl border border-[#26221E] bg-[#12100E] p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9E9589]">Every Cookie Sold Splits Into:</span>
            <span className="font-mono font-semibold text-emerald-400">
              {financials.grossMarginPercent.toFixed(1)}% Net Margin
            </span>
          </div>

          <div className="mt-2 flex h-7 w-full overflow-hidden rounded-lg bg-[#1C1916] font-mono text-xs font-bold">
            <div
              style={{
                width: `${Math.min(
                  92,
                  Math.max(18, 100 - financials.grossMarginPercent)
                )}%`,
              }}
              className="flex items-center justify-center bg-[#332D27] text-[#D5CFC2] transition-all duration-300"
            >
              Cost {formatCurrency(cost)}
            </div>
            <div
              style={{
                width: `${Math.max(
                  8,
                  Math.min(82, financials.grossMarginPercent)
                )}%`,
              }}
              className="flex items-center justify-center bg-emerald-500 text-[#0F0E0C] transition-all duration-300"
            >
              Profit +{formatCurrency(singleProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Order Quote & Set Profit Matrix */}
      <div className="rounded-2xl border border-[#2E2924] bg-[#181614] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-[#F5F2EB]">
              Custom Set Quote & Profit Matrix
            </h3>
          </div>
          <button
            type="button"
            onClick={handleCopyQuote}
            className="inline-flex items-center gap-1 rounded-lg border border-[#332D27] bg-[#141210] px-2.5 py-1 text-xs font-semibold text-amber-400 transition hover:border-amber-500/40 hover:bg-[#221F1B]"
          >
            {copiedQuote ? (
              <>
                <ClipboardCheck className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Quote!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Client Quote</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-3.5 space-y-2.5">
          {/* Single Favor Cookie */}
          <div className="flex items-center justify-between rounded-xl border border-[#26221E] bg-[#141210] p-3">
            <div>
              <div className="text-xs font-semibold text-[#F5F2EB]">
                Single Party Favor (Heat-Sealed)
              </div>
              <div className="font-mono text-xs text-[#8C8275]">
                Exact Cost: {formatCurrency(cost)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-bold text-[#F5F2EB]">
                Quote {formatCurrency(singlePrice)}
              </div>
              <div className="font-mono text-xs font-semibold text-emerald-400">
                Profit +{formatCurrency(singleProfit)}
              </div>
            </div>
          </div>

          {/* Half-Dozen Box (6 Cookies) */}
          <div className="flex items-center justify-between rounded-xl border border-[#26221E] bg-[#141210] p-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#F5F2EB]">
                  Half-Dozen Gift Set (6 Cookies)
                </span>
                <select
                  aria-label="Half-dozen discount percentage"
                  value={recipe.halfDozenDiscountPercent}
                  onChange={(e) =>
                    onUpdateRecipeMeta({
                      halfDozenDiscountPercent: parseInt(e.target.value, 10),
                    })
                  }
                  className="rounded bg-[#221F1B] px-1.5 py-0.5 font-mono text-xs text-amber-400"
                >
                  <option value={0}>Standard</option>
                  <option value={5}>5% off</option>
                </select>
              </div>
              <div className="font-mono text-xs text-[#8C8275]">
                Materials Cost: {formatCurrency(halfDozenCost)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-bold text-[#F5F2EB]">
                Quote {formatCurrency(halfDozenPrice)}
              </div>
              <div className="font-mono text-xs font-semibold text-emerald-400">
                Profit +{formatCurrency(halfDozenProfit)}
              </div>
            </div>
          </div>

          {/* 1 Dozen Custom Set (12 Cookies) */}
          <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-[#1B1713] p-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-[#F5F2EB]">
                  1 Dozen Custom Set (12 Cookies)
                </span>
                <select
                  aria-label="Dozen discount percentage"
                  value={recipe.dozenDiscountPercent}
                  onChange={(e) =>
                    onUpdateRecipeMeta({
                      dozenDiscountPercent: parseInt(e.target.value, 10),
                    })
                  }
                  className="rounded bg-[#28221B] px-1.5 py-0.5 font-mono text-xs text-amber-400"
                >
                  <option value={0}>0% off</option>
                  <option value={3}>3% off</option>
                  <option value={4}>4% off</option>
                  <option value={5}>5% off</option>
                  <option value={10}>10% off</option>
                </select>
              </div>
              <div className="font-mono text-xs text-[#9E9589]">
                Materials Cost: {formatCurrency(dozenCost)} ({formatCurrency(dozenPrice / 12)}/ea)
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-bold text-amber-300">
                Quote {formatCurrency(dozenPrice)}
              </div>
              <div className="font-mono text-xs font-semibold text-emerald-400">
                Profit +{formatCurrency(dozenProfit)}
              </div>
            </div>
          </div>

          {/* 2 Dozen Event Package (24 Cookies) */}
          <div className="flex items-center justify-between rounded-xl border border-[#26221E] bg-[#141210] p-3">
            <div>
              <div className="text-xs font-semibold text-[#F5F2EB]">
                2 Dozen Event Order (24 Cookies)
              </div>
              <div className="font-mono text-xs text-[#8C8275]">
                Materials Cost: {formatCurrency(twoDozenCost)} (Full 1x Batch)
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-sm font-bold text-[#F5F2EB]">
                Quote {formatCurrency(twoDozenPrice)}
              </div>
              <div className="font-mono text-xs font-semibold text-emerald-400">
                Profit +{formatCurrency(twoDozenProfit)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Order Booking Profit Planner */}
      <div className="rounded-2xl border border-[#2E2924] bg-gradient-to-br from-[#181614] to-[#141210] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-[#F5F2EB]">
              Custom Order Income Goal Planner
            </h3>
          </div>
          <ArrowUpRight className="h-4 w-4 text-[#8C8275]" />
        </div>
        <p className="mt-1 text-xs text-[#8C8275]">
          How many dozens of this custom set do you need to book to hit your profit goal?
        </p>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-[#2E2924] bg-[#12100E] px-3.5 py-2.5">
          <span className="text-xs font-medium text-[#D5CFC2]">
            Target Net Profit Goal
          </span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm text-emerald-400">$</span>
            <input
              type="number"
              min={50}
              step={50}
              value={monthlyProfitGoal}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (Number.isFinite(val) && val > 0) {
                  onChangeMonthlyProfitGoal(val);
                }
              }}
              className="w-20 bg-transparent text-right font-mono text-base font-bold text-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <div className="rounded-xl border border-[#26221E] bg-[#141210] p-3">
            <div className="text-xs text-[#8C8275]">Dozens to Book</div>
            <div className="mt-1 font-mono text-xl font-bold text-amber-400">
              {dozensNeededForGoal}{' '}
              <span className="text-xs font-normal text-[#8C8275]">dozens</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#26221E] bg-[#141210] p-3">
            <div className="text-xs text-[#8C8275]">Total Cutouts</div>
            <div className="mt-1 font-mono text-xl font-bold text-[#F5F2EB]">
              {cookiesNeededForGoal}{' '}
              <span className="text-xs font-normal text-[#8C8275]">cookies</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
