import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Sliders,
  Scale,
  BookOpen,
  CheckCircle2,
  Settings,
  PlusCircle,
} from 'lucide-react';
import {
  INITIAL_COOKIE_RECIPES,
  INITIAL_PANTRY_ITEMS,
} from './data/mockBakeryData';
import {
  CookieRecipe,
  PackagingLine,
  PantryItem,
  RecipeIngredientLine,
} from './types/bakery';
import { calculateRecipeFinancials } from './utils/calculations';
import {
  STORAGE_KEYS,
  usePersistentState,
  clearAllCookieCalcStorage,
  createBlankStarterRecipe,
} from './utils/storage';
import { HeaderBar } from './components/HeaderBar';
import { ProfitHeroCards } from './components/ProfitHeroCards';
import { RecipeCostBuilder } from './components/RecipeCostBuilder';
import { PricingSimulator } from './components/PricingSimulator';
import { PantryCatalogModal } from './components/PantryCatalogModal';
import { NewRecipeModal } from './components/NewRecipeModal';
import { SettingsModal } from './components/SettingsModal';

export function App() {
  const [lastSavedIso, setLastSavedIso] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.LAST_SAVED);
    } catch {
      return null;
    }
  });

  const handleStorageSaved = () => {
    setLastSavedIso(new Date().toISOString());
  };

  // All core state wrapped in persistent localStorage hooks
  const [pantry, setPantry] = usePersistentState<PantryItem[]>(
    STORAGE_KEYS.PANTRY,
    INITIAL_PANTRY_ITEMS,
    handleStorageSaved
  );

  const [recipes, setRecipes] = usePersistentState<CookieRecipe[]>(
    STORAGE_KEYS.RECIPES,
    INITIAL_COOKIE_RECIPES,
    handleStorageSaved
  );

  const [activeRecipeId, setActiveRecipeId] = usePersistentState<string>(
    STORAGE_KEYS.ACTIVE_RECIPE_ID,
    INITIAL_COOKIE_RECIPES[0].id,
    handleStorageSaved
  );

  // Ensure new default pantry items & Roll-Out Lemon Vanilla Bean Sugar Cookie exist in older localStorage caches
  useEffect(() => {
    setPantry((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const missingDefaults = INITIAL_PANTRY_ITEMS.filter(
        (item) => !existingIds.has(item.id)
      );
      const merged =
        missingDefaults.length > 0 ? [...missingDefaults, ...prev] : prev;
      return merged.map((item) =>
        item.brand.includes('Borderlands')
          ? {
              ...item,
              brand: item.brand
                .replace('Borderlands / ', '')
                .replace(' / Borderlands', ''),
            }
          : item
      );
    });

    setRecipes((prev) => {
      const hasLemonVanilla = prev.some(
        (r) => r.id === 'rec-lemon-vanilla-rollout'
      );
      const list = !hasLemonVanilla
        ? [INITIAL_COOKIE_RECIPES[0], ...prev]
        : prev;
      if (!hasLemonVanilla) {
        setActiveRecipeId(INITIAL_COOKIE_RECIPES[0].id);
      }
      return list.map((r) =>
        r.name.includes('(Borderlands)')
          ? { ...r, name: r.name.replace(' (Borderlands)', '') }
          : r
      );
    });
  }, []);

  const [batchMultiplier, setBatchMultiplier] = usePersistentState<number>(
    STORAGE_KEYS.BATCH_MULTIPLIER,
    1,
    handleStorageSaved
  );

  const [monthlyProfitGoal, setMonthlyProfitGoal] = usePersistentState<number>(
    STORAGE_KEYS.PROFIT_GOAL,
    1200,
    handleStorageSaved
  );

  const [isPantryOpen, setIsPantryOpen] = useState<boolean>(false);
  const [isNewRecipeOpen, setIsNewRecipeOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<'recipe' | 'pricing'>('recipe');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Kitchen Mode (Screen Wake Lock API so phone doesn't sleep while weighing dough or piping icing)
  const [kitchenWakeLockActive, setKitchenWakeLockActive] = useState<boolean>(false);
  const wakeLockSentinelRef = useRef<{ release: () => Promise<void> } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2800);
  };

  const handleToggleKitchenWakeLock = async () => {
    if (kitchenWakeLockActive) {
      try {
        await wakeLockSentinelRef.current?.release();
      } catch {
        // Ignore release errors
      }
      wakeLockSentinelRef.current = null;
      setKitchenWakeLockActive(false);
      showToast('Kitchen Mode off — normal screen timeout restored');
      return;
    }

    try {
      const nav = navigator as Navigator & {
        wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
      };
      if (nav.wakeLock) {
        const sentinel = await nav.wakeLock.request('screen');
        wakeLockSentinelRef.current = sentinel;
        setKitchenWakeLockActive(true);
        showToast('Kitchen Mode active — screen will stay awake while baking');
      } else {
        setKitchenWakeLockActive(true);
        showToast('Kitchen Mode toggled on');
      }
    } catch {
      setKitchenWakeLockActive((prev) => !prev);
      showToast('Kitchen Mode toggled');
    }
  };

  const activeRecipe = useMemo(
    () => recipes.find((r) => r.id === activeRecipeId) ?? recipes[0],
    [recipes, activeRecipeId]
  );

  const financials = useMemo(
    () => calculateRecipeFinancials(activeRecipe, pantry, batchMultiplier),
    [activeRecipe, pantry, batchMultiplier]
  );

  const updateActiveRecipe = (updater: (rec: CookieRecipe) => CookieRecipe) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === activeRecipe.id ? updater(r) : r))
    );
  };

  const handleCreateRecipe = (newRecipe: CookieRecipe) => {
    setRecipes((prev) => [newRecipe, ...prev]);
    setActiveRecipeId(newRecipe.id);
    setBatchMultiplier(1);
    showToast(`Saved recipe "${newRecipe.name}" to browser storage`);
  };

  const handleDuplicateActiveRecipe = () => {
    const clonedId = `rec-clone-${Date.now()}`;
    const cloned: CookieRecipe = {
      ...activeRecipe,
      id: clonedId,
      name: `${activeRecipe.name} (Copy)`,
      ingredients: activeRecipe.ingredients.map((ing, i) => ({
        ...ing,
        id: `line-${Date.now()}-${i}`,
      })),
      packaging: activeRecipe.packaging.map((pk, i) => ({
        ...pk,
        id: `pk-${Date.now()}-${i}`,
      })),
    };
    setRecipes((prev) => [cloned, ...prev]);
    setActiveRecipeId(clonedId);
    showToast(`Cloned "${activeRecipe.name}"`);
  };

  const handleDeleteActiveRecipe = () => {
    if (recipes.length <= 1) return;
    const deletedName = activeRecipe.name;
    const remaining = recipes.filter((r) => r.id !== activeRecipe.id);
    setRecipes(remaining);
    setActiveRecipeId(remaining[0].id);
    showToast(`Deleted "${deletedName}"`);
  };

  const handleUpdateIngredient = (
    lineId: string,
    patch: Partial<RecipeIngredientLine>
  ) => {
    updateActiveRecipe((rec) => ({
      ...rec,
      ingredients: rec.ingredients.map((line) =>
        line.id === lineId ? { ...line, ...patch } : line
      ),
    }));
  };

  const handleRemoveIngredient = (lineId: string) => {
    updateActiveRecipe((rec) => ({
      ...rec,
      ingredients: rec.ingredients.filter((line) => line.id !== lineId),
    }));
    showToast('Removed ingredient line from recipe');
  };

  const handleAddIngredient = (newLine: RecipeIngredientLine) => {
    updateActiveRecipe((rec) => ({
      ...rec,
      ingredients: [...rec.ingredients, newLine],
    }));
    const item = pantry.find((p) => p.id === newLine.pantryItemId);
    if (item) {
      showToast(`Added ${newLine.quantity}${newLine.unit} ${item.name}`);
    }
  };

  const handleCreatePantryAndAddIngredient = (
    newPantryItem: PantryItem,
    newLine: RecipeIngredientLine
  ) => {
    setPantry((prev) => [newPantryItem, ...prev]);
    updateActiveRecipe((rec) => ({
      ...rec,
      ingredients: [...rec.ingredients, newLine],
    }));
    showToast(`Saved "${newPantryItem.name}" to Supply Book & added to recipe`);
  };

  const handleUpdateRecipeMeta = (patch: Partial<CookieRecipe>) => {
    updateActiveRecipe((rec) => ({
      ...rec,
      ...patch,
    }));
  };

  const handleTogglePackaging = (packId: string) => {
    updateActiveRecipe((rec) => ({
      ...rec,
      packaging: rec.packaging.map((p) =>
        p.id === packId ? { ...p, enabled: !p.enabled } : p
      ),
    }));
  };

  const handleUpdatePackagingLine = (
    packId: string,
    patch: Partial<PackagingLine>
  ) => {
    updateActiveRecipe((rec) => ({
      ...rec,
      packaging: rec.packaging.map((p) =>
        p.id === packId ? { ...p, ...patch } : p
      ),
    }));
  };

  const handleAddPackagingLine = (newPack: PackagingLine) => {
    updateActiveRecipe((rec) => ({
      ...rec,
      packaging: [...rec.packaging, newPack],
    }));
    showToast(`Added packaging "${newPack.name}"`);
  };

  const handleRemovePackagingLine = (packId: string) => {
    updateActiveRecipe((rec) => ({
      ...rec,
      packaging: rec.packaging.filter((p) => p.id !== packId),
    }));
  };

  const handleUpdatePantryItem = (updated: PantryItem) => {
    setPantry((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
  };

  const handleAddPantryItem = (newItem: PantryItem) => {
    setPantry((prev) => [newItem, ...prev]);
    showToast(`Added "${newItem.name}" to Supply Book`);
  };

  const handleDeletePantryItem = (pantryId: string) => {
    setPantry((prev) => prev.filter((item) => item.id !== pantryId));
    showToast('Removed supply from Supply Book');
  };

  // Clear All Data Option 1: Wipe cache and restore factory default recipes & pantry
  const handleClearAllAndRestoreDefaults = () => {
    clearAllCookieCalcStorage();
    setPantry(INITIAL_PANTRY_ITEMS);
    setRecipes(INITIAL_COOKIE_RECIPES);
    setActiveRecipeId(INITIAL_COOKIE_RECIPES[0].id);
    setBatchMultiplier(1);
    setMonthlyProfitGoal(1200);
    showToast('Cleared browser cache & restored factory default sets');
  };

  // Clear All Data Option 2: Wipe all recipes to a single blank recipe
  const handleClearAllToBlankSlate = () => {
    clearAllCookieCalcStorage();
    const blankRecipe = createBlankStarterRecipe();
    setPantry(INITIAL_PANTRY_ITEMS);
    setRecipes([blankRecipe]);
    setActiveRecipeId(blankRecipe.id);
    setBatchMultiplier(1);
    setMonthlyProfitGoal(1200);
    showToast('Cleared all recipes — starting with a fresh blank recipe');
  };

  // Import standalone JSON backup file
  const handleImportBackup = (
    importedPantry: PantryItem[],
    importedRecipes: CookieRecipe[]
  ) => {
    setPantry(importedPantry);
    setRecipes(importedRecipes);
    setActiveRecipeId(importedRecipes[0].id);
    setBatchMultiplier(1);
    showToast(`Imported ${importedRecipes.length} recipes & ${importedPantry.length} supplies`);
  };

  return (
    <div className="min-h-screen bg-[#0F0E0C] pb-24 text-[#F5F2EB] lg:pb-16">
      {/* Top Sticky Navigation & Recipe Builder Bar */}
      <HeaderBar
        recipes={recipes}
        activeRecipe={activeRecipe}
        onSelectRecipe={setActiveRecipeId}
        onOpenNewRecipeModal={() => setIsNewRecipeOpen(true)}
        onDuplicateActiveRecipe={handleDuplicateActiveRecipe}
        onDeleteActiveRecipe={handleDeleteActiveRecipe}
        batchMultiplier={batchMultiplier}
        onChangeBatchMultiplier={setBatchMultiplier}
        financials={financials}
        pantryCount={pantry.length}
        onOpenPantry={() => setIsPantryOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        kitchenWakeLockActive={kitchenWakeLockActive}
        onToggleKitchenWakeLock={handleToggleKitchenWakeLock}
      />

      {/* Action Confirmation Toast (Positioned above bottom nav on mobile) */}
      {toastMessage && (
        <div className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-[#14201A]/95 px-4 py-2.5 text-xs font-semibold text-emerald-300 shadow-xl backdrop-blur-md sm:left-auto sm:right-5 lg:bottom-5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content Container */}
      <main className="mx-auto max-w-7xl space-y-5 px-3 pt-4 sm:space-y-6 sm:px-6 sm:pt-5 lg:px-8">
        {/* Top Hero KPI Cards & Inline Editable Recipe Header */}
        <ProfitHeroCards
          recipe={activeRecipe}
          financials={financials}
          onUpdateRecipeMeta={handleUpdateRecipeMeta}
        />

        {/* 12-Column Responsive Split Workspace */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Left 7 Columns: Interactive Recipe & Packaging Builder */}
          <div
            className={`lg:col-span-7 ${
              mobileTab === 'pricing' ? 'hidden lg:block' : 'block'
            }`}
          >
            <RecipeCostBuilder
              recipe={activeRecipe}
              pantry={pantry}
              financials={financials}
              onUpdateIngredient={handleUpdateIngredient}
              onRemoveIngredient={handleRemoveIngredient}
              onAddIngredient={handleAddIngredient}
              onCreatePantryAndAddIngredient={handleCreatePantryAndAddIngredient}
              onUpdateRecipeMeta={handleUpdateRecipeMeta}
              onTogglePackaging={handleTogglePackaging}
              onUpdatePackagingLine={handleUpdatePackagingLine}
              onAddPackagingLine={handleAddPackagingLine}
              onRemovePackagingLine={handleRemovePackagingLine}
              onOpenPantry={() => setIsPantryOpen(true)}
            />
          </div>

          {/* Right 5 Columns: Sticky Custom Set & Dozen Quote Simulator */}
          <div
            className={`lg:sticky lg:top-20 lg:col-span-5 ${
              mobileTab === 'recipe' ? 'hidden lg:block' : 'block'
            }`}
          >
            <PricingSimulator
              recipe={activeRecipe}
              financials={financials}
              monthlyProfitGoal={monthlyProfitGoal}
              onChangeMonthlyProfitGoal={setMonthlyProfitGoal}
              onUpdateRecipeMeta={handleUpdateRecipeMeta}
            />
          </div>
        </div>
      </main>

      {/* Fixed Mobile Bottom Thumb-Zone Navigation Bar (< lg screens) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 border-t border-[#2A2520] bg-[#12100E]/95 px-2 pt-1.5 pb-safe backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-5 items-center gap-1">
          <button
            type="button"
            onClick={() => setMobileTab('recipe')}
            className={`flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-xl py-1 text-[11px] font-semibold transition ${
              mobileTab === 'recipe' && !isPantryOpen && !isSettingsOpen && !isNewRecipeOpen
                ? 'bg-amber-500/15 text-amber-400'
                : 'text-[#9E9589] active:text-[#F5F2EB]'
            }`}
          >
            <Scale className="h-4 w-4" />
            <span>Recipe</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('pricing')}
            className={`flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-xl py-1 text-[11px] font-semibold transition ${
              mobileTab === 'pricing' && !isPantryOpen && !isSettingsOpen && !isNewRecipeOpen
                ? 'bg-amber-500/15 text-amber-400'
                : 'text-[#9E9589] active:text-[#F5F2EB]'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Pricing</span>
          </button>

          {/* Center Primary Action: + Build New Recipe */}
          <button
            type="button"
            onClick={() => setIsNewRecipeOpen(true)}
            className="flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-2xl bg-amber-500 py-1.5 text-[11px] font-bold text-[#0F0E0C] shadow-md shadow-amber-500/20 active:scale-95"
          >
            <PlusCircle className="h-4 w-4 stroke-[2.5]" />
            <span>New Set</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPantryOpen(true)}
            className={`flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-xl py-1 text-[11px] font-semibold transition ${
              isPantryOpen
                ? 'bg-amber-500/15 text-amber-400'
                : 'text-[#9E9589] active:text-[#F5F2EB]'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Supplies</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className={`flex min-h-[50px] flex-col items-center justify-center gap-1 rounded-xl py-1 text-[11px] font-semibold transition ${
              isSettingsOpen
                ? 'bg-amber-500/15 text-amber-400'
                : 'text-[#9E9589] active:text-[#F5F2EB]'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </nav>

      {/* Build New Recipe Modal */}
      <NewRecipeModal
        isOpen={isNewRecipeOpen}
        onClose={() => setIsNewRecipeOpen(false)}
        onCreateRecipe={handleCreateRecipe}
        activeRecipeToClone={activeRecipe}
        existingRecipeNames={recipes.map((r) => r.name)}
      />

      {/* Bulk Supply Book Modal */}
      <PantryCatalogModal
        isOpen={isPantryOpen}
        onClose={() => setIsPantryOpen(false)}
        pantry={pantry}
        recipes={recipes}
        onUpdatePantryItem={handleUpdatePantryItem}
        onAddPantryItem={handleAddPantryItem}
        onDeletePantryItem={handleDeletePantryItem}
      />

      {/* Application Settings & Clear All Data Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        recipes={recipes}
        pantry={pantry}
        lastSavedIso={lastSavedIso}
        onClearAllAndRestoreDefaults={handleClearAllAndRestoreDefaults}
        onClearAllToBlankSlate={handleClearAllToBlankSlate}
        onImportBackup={handleImportBackup}
      />
    </div>
  );
}

export default App;
