import React, { useState, useMemo, useEffect } from "react";
import ReactDOM from "react-dom";
import {
  PlusIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
} from "@heroicons/react/24/outline";
import SealCard from "./seals/SealCard";
import EditSealInfo from "./seals/EditSealInfo";
import RuleBuilder from "../ruleBuilder/RuleBuilder";
import Button from "../generic/Button";
import { exportSingleSeal } from "../codeGeneration/Card/index";
import type { Rule } from "../ruleBuilder/types";
import { SealData, slugify } from "../data/BalatroUtils";

interface SealsPageProps {
  modName: string;
  seals: SealData[];
  setSeals: React.Dispatch<React.SetStateAction<SealData[]>>;
  selectedSealId: string | null;
  setSelectedSealId: React.Dispatch<React.SetStateAction<string | null>>;
  modPrefix: string;
  showConfirmation: (options: {
    type?: "default" | "warning" | "danger" | "success";
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: "primary" | "secondary" | "danger";
    icon?: React.ReactNode;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => void;
}

type SortOption = {
  value: string;
  label: string;
  sortFn: (a: SealData, b: SealData) => number;
};

let availablePlaceholders: string[] | null = null;
let upscaledPlaceholders: string[] | null = null;

const upscaleImage = (imageSrc: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width === 71 && img.height === 95) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = 142;
        canvas.height = 190;

        if (ctx) {
          ctx.imageSmoothingEnabled = false;
          ctx.drawImage(img, 0, 0, 142, 190);
        }

        resolve(canvas.toDataURL("image/png"));
      } else {
        resolve(imageSrc);
      }
    };
    img.onerror = () => resolve(imageSrc);
    img.src = imageSrc;
  });
};

const getRandomPlaceholderSeal = async (): Promise<{
  imageData: string;
  creditIndex?: number;
}> => {
  if (upscaledPlaceholders && upscaledPlaceholders.length > 0) {
    const randomIndex = Math.floor(Math.random() * upscaledPlaceholders.length);
    const imagePath = availablePlaceholders?.[randomIndex];
    const match = imagePath?.match(/placeholder-seal-(\d+)\.png/);
    const imageNumber = match ? parseInt(match[1], 10) : randomIndex + 1;

    return {
      imageData: upscaledPlaceholders[randomIndex],
      creditIndex: imageNumber,
    };
  }

  if (availablePlaceholders && availablePlaceholders.length > 0) {
    const upscaled = await Promise.all(
      availablePlaceholders.map((placeholder) => upscaleImage(placeholder))
    );
    upscaledPlaceholders = upscaled;
    const randomIndex = Math.floor(Math.random() * upscaled.length);
    const match = availablePlaceholders[randomIndex].match(
      /placeholder-seal-(\d+)\.png/
    );
    const imageNumber = match ? parseInt(match[1], 10) : 1;

    return {
      imageData: upscaled[randomIndex],
      creditIndex: imageNumber,
    };
  }

  const checkImage = (src: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  const placeholders: string[] = [];
  let counter = 1;
  let keepChecking = true;

  while (keepChecking) {
    const imagePath = `/images/placeholderseals/placeholder-seal-${counter}.png`;

    if (await checkImage(imagePath)) {
      placeholders.push(imagePath);
      counter++;
    } else {
      keepChecking = false;
    }
  }

  availablePlaceholders = placeholders;

  if (placeholders.length === 0) {
    return { imageData: "/images/placeholder-seal.png" };
  }

  const upscaled = await Promise.all(
    placeholders.map((placeholder) => upscaleImage(placeholder))
  );
  upscaledPlaceholders = upscaled;

  const randomIndex = Math.floor(Math.random() * upscaled.length);
  const match = placeholders[randomIndex].match(/placeholder-seal-(\d+)\.png/);
  const imageNumber = match ? parseInt(match[1], 15) : 1;

  return {
    imageData: upscaled[randomIndex],
    creditIndex: imageNumber,
  };
};

const isPlaceholderSeal = (imagePath: string): boolean => {
  return (
    imagePath.includes("/images/placeholderseals/") ||
    imagePath.includes("placeholder-seal") ||
    imagePath.startsWith("data:image")
  );
};

const SealsPage: React.FC<SealsPageProps> = ({
  modName,
  seals,
  setSeals,
  selectedSealId,
  setSelectedSealId,
  modPrefix,
  showConfirmation,
}) => {
  const [editingSeal, setEditingSeal] = useState<SealData | null>(null);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [currentSealForRules, setCurrentSealForRules] =
    useState<SealData | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortMenuPosition, setSortMenuPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  const sortButtonRef = React.useRef<HTMLButtonElement>(null);
  const sortMenuRef = React.useRef<HTMLDivElement>(null);

  const sortOptions: SortOption[] = useMemo(
    () => [
      {
        value: "name-asc",
        label: "Name (A-Z)",
        sortFn: (a, b) => a.name.localeCompare(b.name),
      },
      {
        value: "name-desc",
        label: "Name (Z-A)",
        sortFn: (a, b) => b.name.localeCompare(a.name),
      },
      {
        value: "rules-desc",
        label: "Rules (Most to Least)",
        sortFn: (a, b) => (b.rules?.length || 0) - (a.rules?.length || 0),
      },
      {
        value: "rules-asc",
        label: "Rules (Least to Most)",
        sortFn: (a, b) => (a.rules?.length || 0) - (b.rules?.length || 0),
      },
    ],
    []
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        sortButtonRef.current &&
        !sortButtonRef.current.contains(event.target as Node) &&
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setShowSortMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (showSortMenu && sortButtonRef.current) {
      const rect = sortButtonRef.current.getBoundingClientRect();
      setSortMenuPosition({
        top: rect.bottom + 8,
        left: rect.right - 224,
        width: 224,
      });
    }
  }, [showSortMenu]);

  const handleAddNewSeal = async () => {
    const placeholderResult = await getRandomPlaceholderSeal();

    const newSeal: SealData = {
      id: crypto.randomUUID(),
      name: "New Seal",
      description: "A {C:blue}custom{} seal with {C:red}unique{} effects.",
      imagePreview: placeholderResult.imageData,
      sealKey: slugify("New Seal"),
      badge_colour: "#FFFFFF",
      unlocked: true,
      discovered: true,
      rules: [],
      placeholderCreditIndex: placeholderResult.creditIndex,
    };
    setSeals([...seals, newSeal]);
    setEditingSeal(newSeal);
  };

  const handleSaveSeal = (updatedSeal: SealData) => {
    setSeals((prev) =>
      prev.map((seal) => (seal.id === updatedSeal.id ? updatedSeal : seal))
    );
  };

  const handleDeleteSeal = (sealId: string) => {
    setSeals((prev) => prev.filter((seal) => seal.id !== sealId));

    if (selectedSealId === sealId) {
      const remainingSeals = seals.filter((seal) => seal.id !== sealId);
      setSelectedSealId(
        remainingSeals.length > 0 ? remainingSeals[0].id : null
      );
    }
  };

  const handleDuplicateSeal = async (seal: SealData) => {
    if (isPlaceholderSeal(seal.imagePreview)) {
      const placeholderResult = await getRandomPlaceholderSeal();
      const duplicatedSeal: SealData = {
        ...seal,
        id: crypto.randomUUID(),
        name: `${seal.name} Copy`,
        imagePreview: placeholderResult.imageData,
        placeholderCreditIndex: placeholderResult.creditIndex,
        sealKey: slugify(`${seal.name} Copy`),
      };
      setSeals([...seals, duplicatedSeal]);
    } else {
      const duplicatedSeal: SealData = {
        ...seal,
        id: crypto.randomUUID(),
        name: `${seal.name} Copy`,
        sealKey: slugify(`${seal.name} Copy`),
      };
      setSeals([...seals, duplicatedSeal]);
    }
  };

  const handleExportSeal = (seal: SealData) => {
    try {
      exportSingleSeal(seal);
    } catch (error) {
      console.error("Failed to export seal:", error);
    }
  };

  const handleQuickUpdate = (seal: SealData, updates: Partial<SealData>) => {
    const updatedSeal = { ...seal, ...updates };
    handleSaveSeal(updatedSeal);
  };

  const handleEditInfo = (seal: SealData) => {
    setEditingSeal(seal);
  };

  const handleEditRules = (seal: SealData) => {
    setCurrentSealForRules(seal);
    setShowRuleBuilder(true);
  };

  const handleSaveRules = (rules: Rule[]) => {
    if (currentSealForRules) {
      const updatedSeal = { ...currentSealForRules, rules };
      handleSaveSeal(updatedSeal);
    }
    setShowRuleBuilder(false);
    setCurrentSealForRules(null);
  };

  const handleUpdateSealFromRuleBuilder = (updates: Partial<SealData>) => {
    if (currentSealForRules) {
      const updatedSeal = { ...currentSealForRules, ...updates };
      setCurrentSealForRules(updatedSeal);
      handleSaveSeal(updatedSeal);
    }
  };

  const handleSortMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSortMenu(!showSortMenu);
  };

  const filteredAndSortedSeals = useMemo(() => {
    const filtered = seals.filter((seal) => {
      const matchesSearch =
        seal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seal.description.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    const currentSort = sortOptions.find((option) => option.value === sortBy);
    if (currentSort) {
      filtered.sort(currentSort.sortFn);
    }

    return filtered;
  }, [seals, searchTerm, sortBy, sortOptions]);

  const currentSortLabel =
    sortOptions.find((option) => option.value === sortBy)?.label ||
    "Name (A-Z)";

  return (
    <div className="min-h-screen">
      <div className="p-8 font-lexend max-w-7xl mx-auto">
        <h1 className="text-3xl text-white-light tracking-widest text-center">
          Seals
        </h1>
        <h1 className="text-xl text-white-dark font-light tracking-widest mb-6 text-center">
          {modName}
        </h1>
        <div className="flex justify-center mb-2">
          <Button
            variant="primary"
            onClick={handleAddNewSeal}
            icon={<PlusIcon className="h-5 w-5" />}
            size="md"
            className="shadow-lg hover:shadow-2xl transition-shadow"
          >
            Add New Seal
          </Button>
        </div>
        <div className="flex items-center mb-2">
          <div>
            <div className="flex items-center gap-6 text-white-darker text-sm">
              <div className="flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-2 text-mint" />
                {modName} • {filteredAndSortedSeals.length} of {seals.length}{" "}
                seal{seals.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative group">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white-darker group-focus-within:text-mint transition-colors" />
              <input
                type="text"
                placeholder="Search seals by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-black-darker shadow-2xl border-2 border-black-lighter rounded-lg pl-12 pr-4 py-4 text-white-light tracking-wider placeholder-white-darker focus:outline-none focus:border-mint transition-all duration-200"
              />
            </div>

            <div className="flex gap-3">
              <div className="relative">
                <button
                  ref={sortButtonRef}
                  onClick={handleSortMenuToggle}
                  className="flex items-center gap-2 bg-black-dark text-white-light px-4 py-4 border-2 border-black-lighter rounded-lg hover:border-mint transition-colors cursor-pointer"
                >
                  <ArrowsUpDownIcon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{currentSortLabel}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {filteredAndSortedSeals.length === 0 && seals.length > 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="rounded-2xl p-8 max-w-md">
              <MagnifyingGlassIcon className="h-16 w-16 text-mint opacity-60 mb-4 mx-auto" />
              <h3 className="text-white-light text-xl font-light mb-3">
                No Seals Found
              </h3>
              <p className="text-white-darker text-sm mb-6 leading-relaxed">
                No seals match your current search criteria. Try adjusting your
                search terms.
              </p>
              <Button
                variant="secondary"
                onClick={() => setSearchTerm("")}
                fullWidth
              >
                Clear Search
              </Button>
            </div>
          </div>
        ) : filteredAndSortedSeals.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="rounded-2xl p-8 max-w-md">
              <DocumentTextIcon className="h-16 w-16 text-mint opacity-60 mb-4 mx-auto" />
              <h3 className="text-white-light text-xl font-light mb-3">
                No Seals Yet :(
              </h3>
              <p className="text-white-darker text-sm mb-6 leading-relaxed">
                Create your first seal to get started with editing its
                information and defining its custom rules.
              </p>
              <Button
                variant="primary"
                onClick={handleAddNewSeal}
                icon={<PlusIcon className="h-5 w-5" />}
                fullWidth
              >
                Create Your First Seal
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 md:grid-cols-1 gap-14">
            {filteredAndSortedSeals.map((seal) => (
              <SealCard
                key={seal.id}
                seal={seal}
                onEditInfo={() => handleEditInfo(seal)}
                onEditRules={() => handleEditRules(seal)}
                onDelete={() => handleDeleteSeal(seal.id)}
                onDuplicate={() => handleDuplicateSeal(seal)}
                onExport={() => handleExportSeal(seal)}
                onQuickUpdate={(updates) => handleQuickUpdate(seal, updates)}
                modPrefix={modPrefix}
                showConfirmation={showConfirmation}
              />
            ))}
          </div>
        )}

        {editingSeal && (
          <EditSealInfo
            isOpen={!!editingSeal}
            seal={editingSeal}
            onClose={() => setEditingSeal(null)}
            onSave={handleSaveSeal}
            onDelete={handleDeleteSeal}
            modPrefix={modPrefix}
            showConfirmation={showConfirmation}
          />
        )}

        {showRuleBuilder && currentSealForRules && (
          <RuleBuilder
            isOpen={showRuleBuilder}
            onClose={() => {
              setShowRuleBuilder(false);
              setCurrentSealForRules(null);
            }}
            onSave={handleSaveRules}
            existingRules={currentSealForRules.rules || []}
            item={currentSealForRules}
            onUpdateItem={handleUpdateSealFromRuleBuilder}
            itemType="card"
          />
        )}
      </div>

      {showSortMenu &&
        ReactDOM.createPortal(
          <div
            ref={sortMenuRef}
            className="fixed bg-black-darker border-2 border-black-lighter rounded-xl shadow-xl overflow-hidden"
            style={{
              top: `${sortMenuPosition.top}px`,
              left: `${sortMenuPosition.left}px`,
              width: `${sortMenuPosition.width}px`,
              zIndex: 99999,
            }}
          >
            <div className="p-2">
              <h3 className="text-white-light font-medium text-sm mb-2 px-3 py-1">
                Sort By
              </h3>
              <div className="space-y-1">
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSortBy(option.value);
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all cursor-pointer ${
                      sortBy === option.value
                        ? "bg-mint/20 border border-mint text-mint"
                        : "hover:bg-black-lighter text-white-darker hover:text-white-light"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default SealsPage;
