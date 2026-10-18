import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Sparkles,
  FileText,
  Copy,
  AlertCircle,
} from 'lucide-react';
import {
  CookieRecipe,
  CutterSizeProfile,
  RollThickness,
} from '../types/bakery';
import { validateNewRecipeInput } from '../utils/validation';

interface NewRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRecipe: (recipe: CookieRecipe) => void;
  activeRecipeToClone: CookieRecipe;
  existingRecipeNames: string[];
}

type StarterTemplate = 'blank' | 'base-cutout' | 'clone-current';

export const NewRecipeModal: React.FC<NewRecipeModalProps> = ({
  isOpen,
  onClose,
  onCreateRecipe,
  activeRecipeToClone,
  existingRecipeNames,
}) => {
  const [template, setTemplate] = useState<StarterTemplate>('blank');
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('Custom Recipe');
  const [baseYield, setBaseYield] = useState('24');
  const [rollThickness, setRollThickness] = useState<RollThickness>('3/8" (10mm)');
  const [cutterProfile, setCutterProfile] = useState<CutterSizeProfile>(
    'Standard 3.5"–4" Cutouts'
  );
  const [colorCount, setColorCount] = useState('5');
  const [targetPrice, setTargetPrice] = useState('5.50');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSelectTemplate = (nextTemplate: StarterTemplate) => {
    setTemplate(nextTemplate);
    setErrors({});
    if (nextTemplate === 'clone-current') {
      setName(`${activeRecipeToClone.name} (Copy)`);
      setSubtitle(activeRecipeToClone.subtitle);
      setBadge(activeRecipeToClone.badge);
      setBaseYield(String(activeRecipeToClone.baseYieldCookies));
      setRollThickness(activeRecipeToClone.rollThickness);
      setCutterProfile(activeRecipeToClone.cutterSizeProfile);
      setColorCount(String(activeRecipeToClone.colorCount));
      setTargetPrice(String(activeRecipeToClone.targetRetailPrice));
    } else if (nextTemplate === 'base-cutout') {
      if (!name.trim()) setName('Signature Vanilla Almond Cutout Set');
      if (!subtitle.trim())
        setSubtitle('No-spread rolled cutout dough with soft-bite royal icing');
      setBadge('Starter Cutout Set');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateNewRecipeInput({
      name,
      baseYield,
      colorCount,
      targetPrice,
      existingNames: existingRecipeNames,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    const id = `rec-custom-${Date.now()}`;
    const yieldNum = Math.round(Number(baseYield));
    const priceNum = Number(targetPrice);
    const colorsNum = Math.round(Number(colorCount));

    if (template === 'clone-current') {
      const cloned: CookieRecipe = {
        ...activeRecipeToClone,
        id,
        name: name.trim(),
        subtitle: subtitle.trim() || activeRecipeToClone.subtitle,
        badge: badge.trim() || activeRecipeToClone.badge,
        baseYieldCookies: yieldNum,
        rollThickness,
        cutterSizeProfile: cutterProfile,
        colorCount: colorsNum,
        targetRetailPrice: priceNum,
        ingredients: activeRecipeToClone.ingredients.map((ing, idx) => ({
          ...ing,
          id: `line-${Date.now()}-${idx}`,
        })),
        packaging: activeRecipeToClone.packaging.map((pk, idx) => ({
          ...pk,
          id: `pk-${Date.now()}-${idx}`,
        })),
      };
      onCreateRecipe(cloned);
      setName('');
      setSubtitle('');
      onClose();
      return;
    }

    const baseIngredients =
      template === 'base-cutout'
        ? [
            {
              id: `line-${Date.now()}-1`,
              pantryItemId: 'p-butter-kirkland',
              quantity: 454,
              unit: 'g' as const,
              section: 'dough' as const,
              notes: '2 cups (4 sticks) unsalted butter',
            },
            {
              id: `line-${Date.now()}-2`,
              pantryItemId: 'p-sugar-granulated',
              quantity: 400,
              unit: 'g' as const,
              section: 'dough' as const,
              notes: '2 cups granulated sugar',
            },
            {
              id: `line-${Date.now()}-3`,
              pantryItemId: 'p-eggs-large',
              quantity: 2,
              unit: 'each' as const,
              section: 'dough' as const,
              notes: '2 large eggs',
            },
            {
              id: `line-${Date.now()}-4`,
              pantryItemId: 'p-flour-ka',
              quantity: 780,
              unit: 'g' as const,
              section: 'dough' as const,
              notes: '6.5 cups all-purpose flour',
            },
            {
              id: `line-${Date.now()}-5`,
              pantryItemId: 'p-vanilla-paste',
              quantity: 15,
              unit: 'g' as const,
              section: 'dough' as const,
              notes: '1 tbsp vanilla bean paste',
            },
            {
              id: `line-${Date.now()}-6`,
              pantryItemId: 'p-sugar-powdered',
              quantity: 907,
              unit: 'g' as const,
              section: 'icing' as const,
              notes: '2 lbs 10X powdered sugar',
            },
            {
              id: `line-${Date.now()}-7`,
              pantryItemId: 'p-meringue-powder',
              quantity: 45,
              unit: 'g' as const,
              section: 'icing' as const,
              notes: '6 tbsp meringue powder',
            },
            {
              id: `line-${Date.now()}-8`,
              pantryItemId: 'p-tipless-bags',
              quantity: colorsNum * 2,
              unit: 'each' as const,
              section: 'decorating' as const,
              notes: 'Tipless piping bags',
            },
          ]
        : [];

    const newRecipe: CookieRecipe = {
      id,
      name: name.trim(),
      subtitle:
        subtitle.trim() ||
        'Custom rolled cutout dough & royal icing recipe built in CookieCalc',
      badge: badge.trim() || 'Custom Recipe',
      rollThickness,
      cutterSizeProfile: cutterProfile,
      colorCount: colorsNum,
      baseYieldCookies: yieldNum,
      doughLossPercent: 5,
      targetRetailPrice: priceNum,
      halfDozenDiscountPercent: 0,
      dozenDiscountPercent: 0,
      prepMinutesPerBatch: 120,
      hourlyLaborRate: 25,
      includeLaborInCost: false,
      cottageOverheadPerBatch: 2.0,
      ingredients: baseIngredients,
      packaging: [
        {
          id: `pk-${Date.now()}-1`,
          name: '4x6 Heat-Seal Cello Bag',
          supplier: 'ClearBags',
          bulkCost: 17.5,
          bulkCount: 250,
          qtyPerCookie: 1,
          enabled: true,
        },
        {
          id: `pk-${Date.now()}-2`,
          name: 'Window Bakery Dozen Box + Shred',
          supplier: 'BRP Box Shop',
          bulkCost: 138.0,
          bulkCount: 100,
          qtyPerCookie: 0.0833,
          enabled: true,
        },
      ],
    };

    onCreateRecipe(newRecipe);
    setName('');
    setSubtitle('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#332D27] bg-[#181614] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2A2520] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F5F2EB]">
                Build a New Cookie Recipe / Custom Set
              </h2>
              <p className="text-xs text-[#9E9589]">
                Start from a blank slate, a classic cutout dough + royal icing base, or clone your active recipe.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#9E9589] hover:bg-[#24201C] hover:text-[#F5F2EB]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 p-5">
          {/* Starter Template Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#9E9589]">
              1. Choose How to Start
            </label>
            <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => handleSelectTemplate('blank')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                  template === 'blank'
                    ? 'border-amber-500 bg-amber-500/15'
                    : 'border-[#2E2924] bg-[#141210] hover:border-[#3D3730]'
                }`}
              >
                <FileText className="h-4 w-4 text-amber-400" />
                <div className="mt-1.5 text-xs font-bold text-[#F5F2EB]">
                  Blank Recipe
                </div>
                <p className="mt-0.5 text-xs text-[#8C8275]">
                  0 ingredients — add every dough & icing item yourself.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTemplate('base-cutout')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                  template === 'base-cutout'
                    ? 'border-amber-500 bg-amber-500/15'
                    : 'border-[#2E2924] bg-[#141210] hover:border-[#3D3730]'
                }`}
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <div className="mt-1.5 text-xs font-bold text-[#F5F2EB]">
                  Cutout + Icing Starter
                </div>
                <p className="mt-0.5 text-xs text-[#8C8275]">
                  Pre-fills butter, flour, sugar, eggs, 10X sugar & meringue.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleSelectTemplate('clone-current')}
                className={`flex flex-col items-start rounded-xl border p-3 text-left transition ${
                  template === 'clone-current'
                    ? 'border-amber-500 bg-amber-500/15'
                    : 'border-[#2E2924] bg-[#141210] hover:border-[#3D3730]'
                }`}
              >
                <Copy className="h-4 w-4 text-amber-400" />
                <div className="mt-1.5 text-xs font-bold text-[#F5F2EB]">
                  Clone Current Set
                </div>
                <p className="mt-0.5 text-xs text-[#8C8275]">
                  Duplicates your current recipe so you can tweak flavors.
                </p>
              </button>
            </div>
          </div>

          {/* Validation Summary Banner */}
          {Object.keys(errors).length > 0 && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>Please fix the highlighted fields below:</span>
              </div>
              <ul className="mt-1 list-disc space-y-0.5 pl-5">
                {Object.values(errors).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recipe Name & Description */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[#D5CFC2]">
                Recipe / Custom Set Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Lemon Raspberry Cutout Sugar Cookies"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                className={`mt-1 w-full rounded-xl border bg-[#12100E] px-3 py-2 text-sm text-[#F5F2EB] placeholder-[#6E655B] focus:outline-none ${
                  errors.name
                    ? 'border-rose-500 focus:border-rose-400'
                    : 'border-[#332D27] focus:border-amber-500'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D5CFC2]">
                Flavor / Tier Tag
              </label>
              <input
                type="text"
                placeholder="e.g., Signature Dough"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#332D27] bg-[#12100E] px-3 py-2 text-sm text-[#F5F2EB] focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#D5CFC2]">
              Recipe Notes / Set Description
            </label>
            <input
              type="text"
              placeholder="e.g., Rolled to 3/8 inch, chilled 20 mins, baked at 350°F for 11 mins"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#332D27] bg-[#12100E] px-3 py-2 text-xs text-[#F5F2EB] placeholder-[#6E655B] focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Yield, Roll Thickness, Price */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-[#D5CFC2]">
                1x Cutout Yield *
              </label>
              <input
                type="number"
                min={1}
                max={1000}
                value={baseYield}
                onChange={(e) => {
                  setBaseYield(e.target.value);
                  if (errors.baseYield)
                    setErrors((prev) => ({ ...prev, baseYield: '' }));
                }}
                className={`mt-1 w-full rounded-xl border bg-[#12100E] px-3 py-2 font-mono text-sm font-bold text-amber-400 focus:outline-none ${
                  errors.baseYield ? 'border-rose-500' : 'border-[#332D27]'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D5CFC2]">
                Roll Thickness
              </label>
              <select
                value={rollThickness}
                onChange={(e) => setRollThickness(e.target.value as RollThickness)}
                className="mt-1 w-full rounded-xl border border-[#332D27] bg-[#12100E] px-2.5 py-2 font-mono text-xs text-[#F5F2EB]"
              >
                <option value='1/4" (6mm)'>1/4" (6mm)</option>
                <option value='5/16" (8mm)'>5/16" (8mm)</option>
                <option value='3/8" (10mm)'>3/8" (10mm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D5CFC2]">
                Icing Colors *
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={colorCount}
                onChange={(e) => {
                  setColorCount(e.target.value);
                  if (errors.colorCount)
                    setErrors((prev) => ({ ...prev, colorCount: '' }));
                }}
                className={`mt-1 w-full rounded-xl border bg-[#12100E] px-3 py-2 font-mono text-sm text-[#F5F2EB] focus:outline-none ${
                  errors.colorCount ? 'border-rose-500' : 'border-[#332D27]'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#D5CFC2]">
                Price / Cookie ($) *
              </label>
              <input
                type="number"
                step="0.25"
                min="0.25"
                value={targetPrice}
                onChange={(e) => {
                  setTargetPrice(e.target.value);
                  if (errors.targetPrice)
                    setErrors((prev) => ({ ...prev, targetPrice: '' }));
                }}
                className={`mt-1 w-full rounded-xl border bg-[#12100E] px-3 py-2 font-mono text-sm font-bold text-emerald-400 focus:outline-none ${
                  errors.targetPrice ? 'border-rose-500' : 'border-[#332D27]'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#D5CFC2]">
              Cutter Size Profile
            </label>
            <select
              value={cutterProfile}
              onChange={(e) => setCutterProfile(e.target.value as CutterSizeProfile)}
              className="mt-1 w-full rounded-xl border border-[#332D27] bg-[#12100E] px-3 py-2 text-xs text-[#F5F2EB]"
            >
              <option value='Standard 3.5"–4" Cutouts'>Standard 3.5"–4" Cutouts</option>
              <option value='Large 4.25"–4.5" Statement'>Large 4.25"–4.5" Statement</option>
              <option value='Mini 2"–2.5" Cutouts'>Mini 2"–2.5" Cutouts</option>
              <option value='Mixed Dozen (Standard + Minis)'>Mixed Dozen (Standard + Minis)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-[#2A2520] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-medium text-[#9E9589] hover:text-[#F5F2EB]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-5 py-2 text-xs font-bold text-[#0F0E0C] shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Create & Open Recipe Builder</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
