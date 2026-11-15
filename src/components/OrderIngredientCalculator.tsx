import React, { useState, useMemo } from 'react';
import {
  Calculator,
  ChevronDown,
  ChevronUp,
  Minus,
  Plus,
  ShoppingCart,
  Copy,
  ClipboardCheck,
  Sparkles,
  CheckCircle2,
  Package,
  Scale,
} from 'lucide-react';
import {
  CookieRecipe,
  PantryItem,
  RecipeSectionType,
} from '../types/bakery';
import {
  calculateIngredientLineCost,
  convertToBaseGrams,
  formatCurrency,
} from '../utils/calculations';
import { NumericInput } from './NumericInput';

interface OrderIngredientCalculatorProps {
  recipe: CookieRecipe;
  pantry: PantryItem[];
  activeBatchMultiplier: number;
  onApplyBatchMultiplier: (multiplier: number) => void;
}

type BufferMode = 'none' | 'plus2' | 'plus4' | 'onePerDozen';
type RoundingMode = 'exact' | 'halfBatch' | 'wholeBatch';

const ORDER_PRESETS = [
  { label: '1 Doz (12)', cookies: 12 },
  { label: '1.5 Doz (18)', cookies: 18 },
  { label: '2 Doz (24)', cookies: 24 },
  { label: '3 Doz (36)', cookies: 36 },
  { label: '4 Doz (48)', cookies: 48 },
  { label: '5 Doz (60)', cookies: 60 },
  { label: '6 Doz (72)', cookies: 72 },
  { label: '100 Cookies', cookies: 100 },
];

const SECTION_TITLES: Record<RecipeSectionType, { title: string; accent: string }> = {
  dough: {
    title: '1. Cutout Cookie Dough',
    accent: 'text-amber-300',
  },
  icing: {
    title: '2. Royal Icing Base',
    accent: 'text-sky-300',
  },
  decorating: {
    title: '3. Gel Colors, Bags & Transfers',
    accent: 'text-pink-300',
  },
};

export const OrderIngredientCalculator: React.FC<OrderIngredientCalculatorProps> = ({
  recipe,
  pantry,
  activeBatchMultiplier,
  onApplyBatchMultiplier,
}) => {
  // Collapsed by default per user preference
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Order size in cookies (defaults to 36 cookies / 3 dozen as a common custom order)
  const [orderCookies, setOrderCookies] = useState<number>(36);
  const [bufferMode, setBufferMode] = useState<BufferMode>('onePerDozen');
  const [roundingMode, setRoundingMode] = useState<RoundingMode>('exact');
  const [copiedOrderSheet, setCopiedOrderSheet] = useState<boolean>(false);

  const pantryMap = useMemo(
    () => new Map(pantry.map((item) => [item.id, item])),
    [pantry]
  );

  // Calculate extra buffer cookies ("oops cookies" for breakage/piping tests)
  const extraBufferCookies = useMemo(() => {
    if (bufferMode === 'none') return 0;
    if (bufferMode === 'plus2') return 2;
    if (bufferMode === 'plus4') return 4;
    return Math.max(1, Math.ceil(orderCookies / 12));
  }, [bufferMode, orderCookies]);

  const totalCookiesToBake = orderCookies + extraBufferCookies;
  const orderDozens = Number((orderCookies / 12).toFixed(2));
  const baseYield = Math.max(1, recipe.baseYieldCookies);

  // Raw multiplier vs rounded multiplier
  const rawMultiplier = totalCookiesToBake / baseYield;
  const effectiveMultiplier = useMemo(() => {
    if (roundingMode === 'halfBatch') {
      return Math.max(0.5, Math.ceil(rawMultiplier * 2) / 2);
    }
    if (roundingMode === 'wholeBatch') {
      return Math.max(1, Math.ceil(rawMultiplier));
    }
    return Number(rawMultiplier.toFixed(2));
  }, [rawMultiplier, roundingMode]);

  const resultingCookieYield = Math.round(baseYield * effectiveMultiplier);
  const lossFactor = 1 + recipe.doughLossPercent / 100;

  // Calculate scaled ingredients & bulk packages needed for this order
  const scaledSections = useMemo(() => {
    const sections: RecipeSectionType[] = ['dough', 'icing', 'decorating'];
    return sections.map((sec) => {
      const lines = recipe.ingredients
        .filter((l) => l.section === sec)
        .map((line) => {
          const pantryItem = pantryMap.get(line.pantryItemId);
          if (!pantryItem) return null;

          const { cost: baseCost, weightInGrams: baseGrams } =
            calculateIngredientLineCost(line.quantity, line.unit, pantryItem);

          const scaledQty = Number(
            (line.quantity * effectiveMultiplier * lossFactor).toFixed(2)
          );
          const scaledGrams = baseGrams * effectiveMultiplier * lossFactor;
          const scaledCost = baseCost * effectiveMultiplier * lossFactor;

          // Calculate how many store packages this order uses
          let packageFraction = 0;
          if (pantryItem.packageUnit === 'each' && line.unit === 'each') {
            packageFraction = scaledQty / Math.max(pantryItem.packageSize, 1);
          } else {
            const pkgGrams = convertToBaseGrams(
              pantryItem.packageSize,
              pantryItem.packageUnit,
              pantryItem
            );
            packageFraction = scaledGrams / Math.max(pkgGrams, 1);
          }

          const packagesToBuy = Math.max(1, Math.ceil(packageFraction));

          // Friendly secondary weight display (oz / lb)
          let secondaryWeight = '';
          if (line.unit !== 'each') {
            if (scaledGrams >= 453.6) {
              secondaryWeight = `${(scaledGrams / 453.592).toFixed(2)} lb (${Math.round(
                scaledGrams
              )} g)`;
            } else {
              secondaryWeight = `${(scaledGrams / 28.3495).toFixed(1)} oz (${Math.round(
                scaledGrams
              )} g)`;
            }
          }

          return {
            lineId: line.id,
            name: pantryItem.name,
            brand: pantryItem.brand,
            unit: line.unit,
            baseQty: line.quantity,
            scaledQty,
            scaledGrams,
            secondaryWeight,
            scaledCost,
            packageSize: pantryItem.packageSize,
            packageUnit: pantryItem.packageUnit,
            packageCost: pantryItem.packageCost,
            packageFraction,
            packagesToBuy,
            notes: line.notes,
          };
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      const sectionCost = lines.reduce((sum, l) => sum + l.scaledCost, 0);
      return {
        section: sec,
        title: SECTION_TITLES[sec].title,
        accent: SECTION_TITLES[sec].accent,
        lines,
        sectionCost,
      };
    });
  }, [recipe.ingredients, pantryMap, effectiveMultiplier, lossFactor]);

  // Calculate packaging counts needed for the client's ordered cookies
  const scaledPackaging = useMemo(() => {
    return recipe.packaging
      .filter((p) => p.enabled)
      .map((pack) => {
        const rawUnitsNeeded = orderCookies * pack.qtyPerCookie;
        const unitsNeeded = Math.max(1, Math.ceil(rawUnitsNeeded));
        const singleUnitCost = pack.bulkCost / Math.max(pack.bulkCount, 1);
        const totalPackCost = unitsNeeded * singleUnitCost;
        return {
          id: pack.id,
          name: pack.name,
          unitsNeeded,
          totalPackCost,
          bulkCount: pack.bulkCount,
        };
      });
  }, [recipe.packaging, orderCookies]);

  const totalOrderIngredientsCost = scaledSections.reduce(
    (sum, s) => sum + s.sectionCost,
    0
  );
  const totalOrderPackagingCost = scaledPackaging.reduce(
    (sum, p) => sum + p.totalPackCost,
    0
  );
  const totalOrderMaterialsCost =
    totalOrderIngredientsCost + totalOrderPackagingCost;

  const isSyncedWithApp =
    Math.abs(activeBatchMultiplier - effectiveMultiplier) < 0.01;

  const handleCopyOrderList = () => {
    const lines: string[] = [
      `📋 ORDER INGREDIENT & SHOPPING LIST — ${recipe.name}`,
      `Client Order: ${orderCookies} Cookies (${orderDozens} Dozen) + ${extraBufferCookies} Extra Buffer = ${totalCookiesToBake} Cutouts`,
      `Batch Scale: ${effectiveMultiplier}x Batch (Yields ~${resultingCookieYield} cookies, includes ${recipe.doughLossPercent}% scrap/bag buffer)`,
      `Estimated Materials Cost: ${formatCurrency(totalOrderMaterialsCost)} (${formatCurrency(
        totalOrderIngredientsCost
      )} ingredients + ${formatCurrency(totalOrderPackagingCost)} packaging)`,
      '',
    ];

    for (const sec of scaledSections) {
      if (sec.lines.length === 0) continue;
      lines.push(`--- ${sec.title} (${formatCurrency(sec.sectionCost)}) ---`);
      for (const item of sec.lines) {
        const weightInfo =
          item.unit !== 'each' && item.secondaryWeight
            ? ` [${item.secondaryWeight}]`
            : '';
        lines.push(
          `[ ] ${item.scaledQty} ${item.unit} ${item.name}${weightInfo} — ${formatCurrency(
            item.scaledCost
          )} (${(item.packageFraction * 100).toFixed(0)}% of ${item.packageSize}${
            item.packageUnit
          } pkg)`
        );
      }
      lines.push('');
    }

    if (scaledPackaging.length > 0) {
      lines.push(
        `--- 4. Packaging Needed (${formatCurrency(totalOrderPackagingCost)}) ---`
      );
      for (const pk of scaledPackaging) {
        lines.push(
          `[ ] ${pk.unitsNeeded}x ${pk.name} (${formatCurrency(pk.totalPackCost)})`
        );
      }
    }

    navigator.clipboard?.writeText(lines.join('\n')).catch(() => {});
    setCopiedOrderSheet(true);
    setTimeout(() => setCopiedOrderSheet(false), 2500);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2E2924] bg-[#181614] shadow-sm">
      {/* Clickable Collapsible Header (Collapsed by default) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        className="flex w-full flex-wrap items-center justify-between gap-2.5 bg-gradient-to-r from-[#181614] via-[#1E1A15] to-[#181614] px-4 py-3.5 text-left transition hover:bg-[#1F1B17] sm:px-5 sm:py-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          {isOpen ? (
            <ChevronUp className="h-4 w-4 shrink-0 text-amber-400" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-[#8C8275]" />
          )}
          <Calculator className="h-4 w-4 shrink-0 text-amber-400" />
          <h2 className="text-sm font-bold text-[#F5F2EB] sm:text-base">
            Order Size Ingredient Calculator
          </h2>
          <span className="rounded-md bg-amber-500/15 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
            {orderCookies} cookies ({orderDozens} doz)
          </span>
        </div>

        <div className="flex items-center gap-2 pl-6 sm:pl-0">
          <span className="rounded-md bg-[#24201C] px-2 py-0.5 font-mono text-xs font-semibold text-[#D5CFC2]">
            {effectiveMultiplier}x Batch
          </span>
          <span className="font-mono text-xs font-bold text-emerald-400">
            {formatCurrency(totalOrderMaterialsCost)} materials
          </span>
        </div>
      </button>

      {/* Expandable Calculator Body */}
      {isOpen && (
        <div className="space-y-4 border-t border-[#2A2520] p-4 sm:p-5">
          {/* Top Controls Grid: Cookies Ordered, Dozens Ordered & Extra Breakage Buffer */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-[#2A2520] bg-[#141210] p-3.5 sm:grid-cols-3">
            {/* 1. Exact Cookies in Order */}
            <div>
              <label className="block text-xs font-semibold text-[#D5CFC2]">
                Cookies in Client Order
              </label>
              <div className="mt-1.5 flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Decrease order by 6 cookies"
                  onClick={() => setOrderCookies((prev) => Math.max(1, prev - 6))}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#332D27] bg-[#181614] text-xs font-bold text-[#D5CFC2] hover:border-amber-500/40 active:bg-amber-500 active:text-[#0F0E0C]"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <div className="flex flex-1 items-center rounded-lg border border-[#332D27] bg-[#181614] px-2.5 py-1">
                  <NumericInput
                    integer
                    min={1}
                    max={2400}
                    aria-label="Number of cookies in order"
                    value={orderCookies}
                    onValueChange={(val) => setOrderCookies(val)}
                    className="w-full bg-transparent text-center font-mono text-base font-bold text-amber-400 focus:outline-none"
                  />
                  <span className="ml-1 text-xs text-[#8C8275]">cookies</span>
                </div>
                <button
                  type="button"
                  aria-label="Increase order by 6 cookies"
                  onClick={() => setOrderCookies((prev) => Math.min(2400, prev + 6))}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#332D27] bg-[#181614] text-xs font-bold text-[#D5CFC2] hover:border-amber-500/40 active:bg-amber-500 active:text-[#0F0E0C]"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Dozens Equivalent Input */}
            <div>
              <label className="block text-xs font-semibold text-[#D5CFC2]">
                Order Size in Dozens
              </label>
              <div className="mt-1.5 flex items-center gap-1.5">
                <button
                  type="button"
                  aria-label="Decrease order by 0.5 dozen"
                  onClick={() =>
                    setOrderCookies((prev) => Math.max(6, prev - 6))
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#332D27] bg-[#181614] text-xs font-bold text-[#D5CFC2] hover:border-amber-500/40 active:bg-amber-500 active:text-[#0F0E0C]"
                >
                  -½
                </button>
                <div className="flex flex-1 items-center rounded-lg border border-[#332D27] bg-[#181614] px-2.5 py-1">
                  <NumericInput
                    min={0.25}
                    max={200}
                    aria-label="Number of dozens in order"
                    value={orderDozens}
                    onValueChange={(doz) =>
                      setOrderCookies(Math.max(1, Math.round(doz * 12)))
                    }
                    className="w-full bg-transparent text-center font-mono text-base font-bold text-[#F5F2EB] focus:outline-none"
                  />
                  <span className="ml-1 text-xs text-[#8C8275]">dozens</span>
                </div>
                <button
                  type="button"
                  aria-label="Increase order by 0.5 dozen"
                  onClick={() =>
                    setOrderCookies((prev) => Math.min(2400, prev + 6))
                  }
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#332D27] bg-[#181614] text-xs font-bold text-[#D5CFC2] hover:border-amber-500/40 active:bg-amber-500 active:text-[#0F0E0C]"
                >
                  +½
                </button>
              </div>
            </div>

            {/* 3. Extra "Oops Cookie" Breakage Buffer */}
            <div>
              <label className="block text-xs font-semibold text-[#D5CFC2]">
                Extra "Oops" Cookies (Breakage Buffer)
              </label>
              <select
                aria-label="Extra cookies buffer"
                value={bufferMode}
                onChange={(e) => setBufferMode(e.target.value as BufferMode)}
                className="mt-1.5 h-[36px] w-full rounded-lg border border-[#332D27] bg-[#181614] px-2.5 text-xs font-medium text-[#F5F2EB] focus:border-amber-500 focus:outline-none"
              >
                <option value="onePerDozen">
                  +1 Extra / Dozen (+{Math.max(1, Math.ceil(orderCookies / 12))} cookies)
                </option>
                <option value="plus2">+2 Extra Cookies</option>
                <option value="plus4">+4 Extra Cookies</option>
                <option value="none">No Extra Buffer (Exact {orderCookies})</option>
              </select>
            </div>
          </div>

          {/* Quick Order Size Presets + Batch Rounding Mode */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8275]">
                Quick Order:
              </span>
              {ORDER_PRESETS.map((preset) => (
                <button
                  key={preset.cookies}
                  type="button"
                  onClick={() => setOrderCookies(preset.cookies)}
                  className={`rounded-lg px-2.5 py-1 font-mono text-xs font-semibold transition ${
                    orderCookies === preset.cookies
                      ? 'border border-amber-500/50 bg-amber-500/20 text-amber-300'
                      : 'border border-[#2A2520] bg-[#141210] text-[#9E9589] hover:text-[#F5F2EB]'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[#8C8275]">Scale Mode:</span>
              <select
                aria-label="Batch scaling rounding mode"
                value={roundingMode}
                onChange={(e) => setRoundingMode(e.target.value as RoundingMode)}
                className="rounded-lg border border-[#2E2924] bg-[#141210] px-2.5 py-1 text-xs font-medium text-amber-300 focus:border-amber-500 focus:outline-none"
              >
                <option value="exact">Exact Scale ({rawMultiplier.toFixed(2)}x)</option>
                <option value="halfBatch">Round Up to Nearest 0.5x Batch</option>
                <option value="wholeBatch">Round Up to Whole Batch (1x, 2x...)</option>
              </select>
            </div>
          </div>

          {/* Order Summary Banner + Sync with Recipe & Copy Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="space-y-0.5 text-xs">
              <div className="flex flex-wrap items-center gap-1.5 font-semibold text-[#F5F2EB]">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>
                  Baking Target:{' '}
                  <strong className="font-mono text-amber-300">
                    {totalCookiesToBake} cutouts
                  </strong>{' '}
                  ({orderCookies} order + {extraBufferCookies} buffer) ={' '}
                  <strong className="font-mono text-amber-300">
                    {effectiveMultiplier}x recipe batch
                  </strong>
                </span>
              </div>
              <div className="text-[#C8BFA8]">
                Base recipe yields {baseYield} cutouts (1x). Includes{' '}
                {recipe.doughLossPercent}% bowl/reroll/piping bag scrap buffer.
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onApplyBatchMultiplier(effectiveMultiplier)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  isSyncedWithApp
                    ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                    : 'bg-amber-500 text-[#0F0E0C] hover:bg-amber-400'
                }`}
              >
                {isSyncedWithApp ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Synced to {effectiveMultiplier}x Batch</span>
                  </>
                ) : (
                  <>
                    <Scale className="h-3.5 w-3.5" />
                    <span>Apply {effectiveMultiplier}x to Entire App</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyOrderList}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#332D27] bg-[#141210] px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:border-amber-500/40 hover:bg-[#221F1B]"
              >
                {copiedOrderSheet ? (
                  <>
                    <ClipboardCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied Order List!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Shopping & Weigh List</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Scaled Ingredients Breakdown by Section */}
          <div className="space-y-3">
            {scaledSections.map((sec) => {
              if (sec.lines.length === 0) return null;
              return (
                <div
                  key={sec.section}
                  className="overflow-hidden rounded-xl border border-[#26221E] bg-[#141210]"
                >
                  <div className="flex items-center justify-between border-b border-[#221F1B] bg-[#12100E] px-3.5 py-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${sec.accent}`}>
                      {sec.title}
                    </span>
                    <span className="font-mono text-xs font-semibold text-[#A69C8E]">
                      Order Subtotal: {formatCurrency(sec.sectionCost)}
                    </span>
                  </div>

                  <div className="divide-y divide-[#1E1B18]">
                    {sec.lines.map((item) => (
                      <div
                        key={item.lineId}
                        className="flex flex-col justify-between gap-2 px-3.5 py-2.5 text-xs sm:flex-row sm:items-center"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-[#F5F2EB]">
                              {item.name}
                            </span>
                            <span className="font-mono text-[11px] text-[#8C8275]">
                              (1x base: {item.baseQty} {item.unit})
                            </span>
                          </div>
                          {item.notes && (
                            <div className="mt-0.5 text-[11px] italic text-[#8C8275]">
                              Note: {item.notes}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
                          {/* Store Package Usage Badge */}
                          <div className="flex items-center gap-1 rounded-lg bg-[#1C1916] px-2 py-1 text-[11px] text-[#A69C8E]">
                            <ShoppingCart className="h-3 w-3 text-amber-400" />
                            <span>
                              {(item.packageFraction * 100).toFixed(0)}% of{' '}
                              {item.packageSize}
                              {item.packageUnit}
                            </span>
                            {item.packageFraction > 1 && (
                              <span className="ml-1 rounded bg-amber-500/20 px-1.5 py-0.2 font-mono font-bold text-amber-300">
                                Need {item.packagesToBuy} pkgs
                              </span>
                            )}
                          </div>

                          {/* Exact Scaled Weight to Weigh on Scale */}
                          <div className="min-w-[110px] text-right">
                            <div className="font-mono text-sm font-bold text-amber-300">
                              {item.scaledQty} {item.unit}
                            </div>
                            {item.secondaryWeight && (
                              <div className="font-mono text-[11px] text-[#8C8275]">
                                {item.secondaryWeight}
                              </div>
                            )}
                          </div>

                          {/* Scaled Cost for this Order */}
                          <div className="min-w-[64px] text-right font-mono text-xs font-semibold text-[#F5F2EB]">
                            {formatCurrency(item.scaledCost)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* 4. Packaging Count Needed for Order */}
            {scaledPackaging.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-[#26221E] bg-[#141210]">
                <div className="flex items-center justify-between border-b border-[#221F1B] bg-[#12100E] px-3.5 py-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-300">
                    <Package className="h-3.5 w-3.5" />
                    <span>4. Boxes & Heat-Seal Bags for {orderCookies} Cookies</span>
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#A69C8E]">
                    Packaging Subtotal: {formatCurrency(totalOrderPackagingCost)}
                  </span>
                </div>

                <div className="divide-y divide-[#1E1B18]">
                  {scaledPackaging.map((pk) => (
                    <div
                      key={pk.id}
                      className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs"
                    >
                      <span className="font-medium text-[#F5F2EB]">{pk.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-sm font-bold text-sky-300">
                          {pk.unitsNeeded} needed
                        </span>
                        <span className="min-w-[64px] text-right font-mono font-semibold text-[#F5F2EB]">
                          {formatCurrency(pk.totalPackCost)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
