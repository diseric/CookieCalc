import React, { useState } from 'react';
import {
  Sliders,
  ShoppingBag,
  Target,
  Sparkles,
  ArrowUpRight,
  ClipboardCheck,
  Copy,
  Share2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Wand2,
} from 'lucide-react';
import { CookieRecipe, RecipeFinancialSummary } from '../types/bakery';
import { formatCurrency } from '../utils/calculations';
import { NumericInput } from './NumericInput';

interface PricingSimulatorProps {
  recipe: CookieRecipe;
  financials: RecipeFinancialSummary;
  monthlyProfitGoal: number;
  onChangeMonthlyProfitGoal: (goal: number) => void;
  onUpdateRecipeMeta: (patch: Partial<CookieRecipe>) => void;
}

interface DesignAddOn {
  id: string;
  label: string;
  shortTag: string;
  perDozenUpcharge: number;
}

const DESIGN_ADD_ONS: DesignAddOn[] = [
  {
    id: 'metallic',
    label: 'Metallic Gold / Silver Luster Painting',
    shortTag: 'Metallic Luster',
    perDozenUpcharge: 6,
  },
  {
    id: 'logos',
    label: 'Intricate Logos / Character Piping',
    shortTag: 'Logos / Characters',
    perDozenUpcharge: 12,
  },
  {
    id: 'florals',
    label: '3D Royal Icing Florals & Transfers',
    shortTag: '3D Florals',
    perDozenUpcharge: 9,
  },
  {
    id: 'bows',
    label: 'Hand-Tied Satin Bows + Favor Tags',
    shortTag: 'Satin Bows & Tags',
    perDozenUpcharge: 6,
  },
  {
    id: 'rush',
    label: 'Rush Order Priority (< 7 Days Notice)',
    shortTag: 'Rush Order Fee',
    perDozenUpcharge: 15,
  },
];

export const PricingSimulator: React.FC<PricingSimulatorProps> = ({
  recipe,
  financials,
  monthlyProfitGoal,
  onChangeMonthlyProfitGoal,
  onUpdateRecipeMeta,
}) => {
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);

  const toggleAddOn = (id: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const activeAddOns = DESIGN_ADD_ONS.filter((a) =>
    selectedAddOnIds.includes(a.id)
  );
  const addOnPerDozenTotal = activeAddOns.reduce(
    (sum, a) => sum + a.perDozenUpcharge,
    0
  );
  const addOnPerCookieTotal = addOnPerDozenTotal / 12;

  // Per-cookie and per-dozen metrics (including active design add-ons)
  const cost = financials.exactCostPerCookie;
  const baseSinglePrice = recipe.targetRetailPrice;
  const effectiveSinglePrice = baseSinglePrice + addOnPerCookieTotal;
  const singleProfit = effectiveSinglePrice - cost;

  const baseDozenPrice = baseSinglePrice * 12;
  const effectiveBaseDozenPrice = effectiveSinglePrice * 12;

  // Custom Set Order Matrix: Single Favor, Half-Dozen (6), 1 Dozen (12), 2 Dozen Event Set (24)
  const halfDozenPrice =
    effectiveSinglePrice * 6 * (1 - recipe.halfDozenDiscountPercent / 100);
  const halfDozenCost = cost * 6;
  const halfDozenProfit = halfDozenPrice - halfDozenCost;

  const dozenPrice =
    effectiveSinglePrice * 12 * (1 - recipe.dozenDiscountPercent / 100);
  const dozenCost = cost * 12;
  const dozenProfit = dozenPrice - dozenCost;

  const twoDozenPrice = dozenPrice * 2;
  const twoDozenCost = dozenCost * 2;
  const twoDozenProfit = twoDozenPrice - twoDozenCost;

  // True Artist Hourly Earnings & Recommended Price Coach
  const batchHours = Math.max(
    (recipe.prepMinutesPerBatch * financials.batchMultiplier) / 60,
    0.1
  );
  const effectiveBatchProfit = singleProfit * financials.effectiveYield;
  const effectiveHourlyEarnings = effectiveBatchProfit / batchHours;
  const targetHourlyRate = recipe.hourlyLaborRate || 25;

  // Recommended cookie price = (Hard Materials/Overhead Cost + Active Labor Cost at Target Rate) * 1.25 studio profit buffer
  const laborCostPerCookie =
    ((recipe.prepMinutesPerBatch / 60) * targetHourlyRate) /
    Math.max(recipe.baseYieldCookies, 1);
  const rawRecommendedPrice = (cost + (recipe.includeLaborInCost ? 0 : laborCostPerCookie)) * 1.25;
  const recommendedPricePerCookie = Math.max(
    4.0,
    Math.ceil(rawRecommendedPrice * 4) / 4
  ); // Round up to nearest $0.25

  const isUnderpayingHourly = effectiveHourlyEarnings < targetHourlyRate;

  // Goal calculator (in dozens and cookies)
  const dozensNeededForGoal =
    dozenProfit > 0 ? (monthlyProfitGoal / dozenProfit).toFixed(1) : '0';
  const cookiesNeededForGoal =
    singleProfit > 0 ? Math.ceil(monthlyProfitGoal / singleProfit) : 0;

  const buildQuoteText = () => {
    const lines = [
      `✨ Custom Cookie Quote — ${recipe.name}`,
      `Specs: ${recipe.cutterSizeProfile} (${recipe.rollThickness} thick, up to ${recipe.colorCount} royal icing colors)`,
    ];
    if (activeAddOns.length > 0) {
      lines.push(
        `Included Design Upgrades: ${activeAddOns
          .map((a) => `${a.shortTag} (+$${a.perDozenUpcharge}/doz)`)
          .join(', ')}`
      );
    }
    lines.push(
      `• Single Favor (Heat-Sealed): ${formatCurrency(effectiveSinglePrice)}/ea`,
      `• Half-Dozen Box (6 Cutouts): ${formatCurrency(halfDozenPrice)}`,
      `• 1 Dozen Custom Set (12 Cutouts): ${formatCurrency(dozenPrice)}`,
      `• 2 Dozen Event Package (24 Cutouts): ${formatCurrency(twoDozenPrice)}`
    );
    return lines.join('\n');
  };

  const handleCopyQuote = () => {
    const summary = buildQuoteText();
    navigator.clipboard?.writeText(summary).catch(() => {});
    setCopiedQuote(true);
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  const handleShareQuote = async () => {
    const summary = buildQuoteText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Custom Cookie Quote — ${recipe.name}`,
          text: summary,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    handleCopyQuote();
  };

  return (
    <aside className="space-y-4 sm:space-y-5">
      {/* Interactive Custom Set Price Slider & Direct Input Card */}
      <div className="rounded-2xl border border-[#2E2924] bg-[#181614] p-4 shadow-md sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 shrink-0 text-amber-400" />
            <h2 className="text-sm font-bold text-[#F5F2EB] sm:text-base">
              Custom Cookie & Dozen Pricing
            </h2>
          </div>
          <span className="whitespace-nowrap rounded-full bg-amber-500/15 px-2.5 py-0.5 font-mono text-xs font-bold text-amber-300">
            {formatCurrency(effectiveBaseDozenPrice)} / doz
          </span>
        </div>

        <p className="mt-1 text-xs text-[#9E9589]">
          Slide or type your base price per cookie, then toggle any design add-ons below.
        </p>

        {/* Price Slider + Direct Numeric Input */}
        <div className="mt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#A69C8E]">
              Base Price Per Cookie
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-xl border border-[#332D27] bg-[#12100E] px-2.5 py-1">
                <span className="font-mono text-sm font-bold text-amber-400">$</span>
                <NumericInput
                  min={0.5}
                  max={100}
                  aria-label="Direct retail price per cookie"
                  value={recipe.targetRetailPrice}
                  onValueChange={(val) =>
                    onUpdateRecipeMeta({ targetRetailPrice: val })
                  }
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

          <div className="mt-1 flex justify-between font-mono text-[11px] text-[#786F64] sm:text-xs">
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
            <div className="text-[11px] text-[#8C8275] sm:text-xs">Basic / 3-Color</div>
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
            <div className="flex items-center gap-1 text-[11px] font-medium text-amber-300 sm:text-xs">
              <Sparkles className="h-3 w-3 shrink-0" /> Detailed Set
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
            <div className="text-[11px] text-[#8C8275] sm:text-xs">Elaborate / 3D</div>
            <div className="mt-0.5 font-mono text-xs font-bold text-[#F5F2EB]">
              $6.50 ($78/dz)
            </div>
          </button>
        </div>

        {/* Smart Profit Coach & Hourly Pay Banner */}
        <div
          className={`mt-4 rounded-xl border p-3 ${
            isUnderpayingHourly
              ? 'border-amber-500/40 bg-amber-500/10'
              : 'border-emerald-500/30 bg-emerald-950/20'
          }`}
        >
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold">
              {isUnderpayingHourly ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              ) : (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              )}
              <span className="text-[#F5F2EB]">
                Artist Hourly Earnings:{' '}
                <strong
                  className={`font-mono ${
                    isUnderpayingHourly ? 'text-amber-300' : 'text-emerald-400'
                  }`}
                >
                  {formatCurrency(effectiveHourlyEarnings)}/hr
                </strong>
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#9E9589]">
              Target: ${targetHourlyRate}/hr
            </span>
          </div>

          {recipe.targetRetailPrice < recommendedPricePerCookie && (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2 text-xs">
              <span className="text-[#D5CFC2]">
                Suggested for {recipe.prepMinutesPerBatch}m labor + 25% margin:{' '}
                <strong className="font-mono text-amber-300">
                  {formatCurrency(recommendedPricePerCookie)}/ea (
                  {formatCurrency(recommendedPricePerCookie * 12)}/dz)
                </strong>
              </span>
              <button
                type="button"
                onClick={() =>
                  onUpdateRecipeMeta({
                    targetRetailPrice: recommendedPricePerCookie,
                  })
                }
                className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-[#0F0E0C] transition hover:bg-amber-400"
              >
                <Wand2 className="h-3 w-3" />
                <span>Apply {formatCurrency(recommendedPricePerCookie)}</span>
              </button>
            </div>
          )}
        </div>

        {/* Visual Split Bar: Hard Cost vs Net Profit inside 1 Cookie */}
        <div className="mt-4 rounded-xl border border-[#26221E] bg-[#12100E] p-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9E9589]">Every Cookie Sold Splits Into:</span>
            <span className="font-mono font-semibold text-emerald-400">
              {effectiveSinglePrice > 0
                ? ((singleProfit / effectiveSinglePrice) * 100).toFixed(1)
                : '0.0'}
              % Net Margin
            </span>
          </div>

          <div className="mt-2 flex h-7 w-full overflow-hidden rounded-lg bg-[#1C1916] font-mono text-xs font-bold">
            <div
              style={{
                width: `${Math.min(
                  92,
                  Math.max(
                    18,
                    effectiveSinglePrice > 0
                      ? (cost / effectiveSinglePrice) * 100
                      : 50
                  )
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
                  Math.min(
                    82,
                    effectiveSinglePrice > 0
                      ? (singleProfit / effectiveSinglePrice) * 100
                      : 50
                  )
                )}%`,
              }}
              className="flex items-center justify-center bg-emerald-500 text-[#0F0E0C] transition-all duration-300"
            >
              Profit +{formatCurrency(singleProfit)}
            </div>
          </div>
        </div>
      </div>

      {/* Profit-Boosting Design Add-Ons & Complexity Upcharges */}
      <div className="rounded-2xl border border-[#2E2924] bg-[#181614] p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 shrink-0 text-emerald-400" />
            <h3 className="text-sm font-bold text-[#F5F2EB]">
              Design Add-On Upcharges
            </h3>
          </div>
          {addOnPerDozenTotal > 0 ? (
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-300">
              +{formatCurrency(addOnPerDozenTotal)}/doz added
            </span>
          ) : (
            <span className="text-xs text-[#8C8275]">Tap extras to add</span>
          )}
        </div>
        <p className="mt-1 text-xs text-[#8C8275]">
          Stop giving away hand-painted gold, logos, or bows for free—toggle extras to add directly to your client quote.
        </p>

        <div className="mt-3 space-y-2">
          {DESIGN_ADD_ONS.map((addon) => {
            const active = selectedAddOnIds.includes(addon.id);
            return (
              <button
                key={addon.id}
                type="button"
                onClick={() => toggleAddOn(addon.id)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-xs transition ${
                  active
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-[#F5F2EB]'
                    : 'border-[#26221E] bg-[#141210] text-[#A69C8E] hover:border-[#36302A] hover:text-[#F5F2EB]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-bold ${
                      active
                        ? 'border-emerald-400 bg-emerald-500 text-[#0F0E0C]'
                        : 'border-[#3D3730] bg-[#181614]'
                    }`}
                  >
                    {active ? '✓' : ''}
                  </span>
                  <span className="font-medium">{addon.label}</span>
                </div>
                <span
                  className={`shrink-0 font-mono font-bold ${
                    active ? 'text-emerald-400' : 'text-amber-400/80'
                  }`}
                >
                  +${addon.perDozenUpcharge}/doz
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Order Quote & Set Profit Matrix */}
      <div className="rounded-2xl border border-[#2E2924] bg-[#181614] p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 shrink-0 text-amber-400" />
            <h3 className="text-sm font-bold text-[#F5F2EB]">
              Client Quote & Profit Matrix
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyQuote}
              className="inline-flex items-center gap-1 rounded-lg border border-[#332D27] bg-[#141210] px-2.5 py-1.5 text-xs font-semibold text-amber-400 transition hover:border-amber-500/40 hover:bg-[#221F1B]"
            >
              {copiedQuote ? (
                <>
                  <ClipboardCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Quote</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleShareQuote}
              title="Share quote via SMS, Instagram, or Email"
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-2.5 py-1.5 text-xs font-bold text-[#0F0E0C] transition hover:bg-amber-400"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
          </div>
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
                Quote {formatCurrency(effectiveSinglePrice)}
              </div>
              <div className="font-mono text-xs font-semibold text-emerald-400">
                Profit +{formatCurrency(singleProfit)}
              </div>
            </div>
          </div>

          {/* Half-Dozen Box (6 Cookies) */}
          <div className="flex items-center justify-between rounded-xl border border-[#26221E] bg-[#141210] p-3">
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
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
              <div className="flex flex-wrap items-center gap-1.5">
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
      <div className="rounded-2xl border border-[#2E2924] bg-gradient-to-br from-[#181614] to-[#141210] p-4 shadow-sm sm:p-5">
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
            <NumericInput
              integer
              min={10}
              value={monthlyProfitGoal}
              onValueChange={(val) => onChangeMonthlyProfitGoal(val)}
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
