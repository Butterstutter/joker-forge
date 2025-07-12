import { useState, useEffect, useCallback, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./components/Sidebar";
import OverviewPage from "./components/pages/OverviewPage";
import JokersPage from "./components/pages/JokersPage";
import ModMetadataPage, {
  ModMetadata,
  DEFAULT_MOD_METADATA,
} from "./components/pages/ModMetadataPage";
import ConsumablesPage from "./components/pages/ConsumablesPage";
import DecksPage from "./components/pages/DecksPage";
import EditionsPage from "./components/pages/EditionsPage";
import VanillaRemadePage from "./components/pages/VanillaReforgedPage";
import ExtraCreditPage from "./components/pages/ExtraCreditPage";
import AcknowledgementsPage from "./components/pages/AcknowledgementsPage";
import NotFoundPage from "./components/pages/NotFoundPage";
import { JokerData } from "./components/JokerCard";
import { exportJokersAsMod } from "./components/codeGeneration/index";
import {
  exportModAsJSON,
  importModFromJSON,
} from "./components/JSONImportExport";
import Alert from "./components/generic/Alert";
import Modal from "./components/generic/Modal";
import Button from "./components/generic/Button";
import {
  CheckCircleIcon,
  FolderIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface AlertState {
  isVisible: boolean;
  type: "success" | "warning" | "error";
  title: string;
  content: string;
}

interface AutoSaveData {
  modMetadata: ModMetadata;
  jokers: JokerData[];
  timestamp: number;
}

const AUTO_SAVE_KEY = "joker-forge-autosave";

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();

  const currentSection = location.pathname.slice(1) || "overview";
  const isExpanded = currentSection === "overview" || currentSection === "";

  const [modMetadata, setModMetadata] =
    useState<ModMetadata>(DEFAULT_MOD_METADATA);
  const [jokers, setJokers] = useState<JokerData[]>([]);
  const [selectedJokerId, setSelectedJokerId] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [alert, setAlert] = useState<AlertState>({
    isVisible: false,
    type: "success",
    title: "",
    content: "",
  });
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [showExportSuccessModal, setShowExportSuccessModal] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clearStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevDataRef = useRef<{
    modMetadata: ModMetadata;
    jokers: JokerData[];
  } | null>(null);

  const saveToLocalStorage = useCallback(
    (metadata: ModMetadata, jokerData: JokerData[]) => {
      try {
        const data: AutoSaveData = {
          modMetadata: metadata,
          jokers: jokerData,
          timestamp: Date.now(),
        };
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(data));
        console.log("Auto-saved project state");
      } catch (error) {
        console.warn("Failed to auto-save:", error);
      }
    },
    []
  );

  const loadFromLocalStorage = useCallback((): {
    modMetadata: ModMetadata;
    jokers: JokerData[];
  } | null => {
    try {
      const savedData = localStorage.getItem(AUTO_SAVE_KEY);
      if (!savedData) return null;

      const data: AutoSaveData = JSON.parse(savedData);

      if (!data.modMetadata || !Array.isArray(data.jokers)) {
        console.warn("Invalid auto-save data structure");
        localStorage.removeItem(AUTO_SAVE_KEY);
        return null;
      }

      console.log("Loaded auto-saved project state");
      return {
        modMetadata: data.modMetadata,
        jokers: data.jokers,
      };
    } catch (error) {
      console.warn("Failed to load auto-save:", error);
      localStorage.removeItem(AUTO_SAVE_KEY);
      return null;
    }
  }, []);

  const clearAutoSave = useCallback(() => {
    try {
      localStorage.removeItem(AUTO_SAVE_KEY);
      console.log("Cleared auto-save data");
    } catch (error) {
      console.warn("Failed to clear auto-save:", error);
    }
  }, []);

  const getAutoSaveMetadata = useCallback((): {
    timestamp: number;
    daysOld: number;
  } | null => {
    try {
      const savedData = localStorage.getItem(AUTO_SAVE_KEY);
      if (!savedData) return null;

      const data: AutoSaveData = JSON.parse(savedData);
      const daysOld = (Date.now() - data.timestamp) / (24 * 60 * 60 * 1000);

      return {
        timestamp: data.timestamp,
        daysOld: Math.floor(daysOld * 10) / 10,
      };
    } catch {
      return null;
    }
  }, []);

  const hasDataChanged = useCallback(
    (metadata: ModMetadata, jokerData: JokerData[]) => {
      if (!prevDataRef.current) return true;

      const prevData = prevDataRef.current;
      return (
        JSON.stringify(prevData.modMetadata) !== JSON.stringify(metadata) ||
        JSON.stringify(prevData.jokers) !== JSON.stringify(jokerData)
      );
    },
    []
  );

  const debouncedSave = useCallback(
    (metadata: ModMetadata, jokerData: JokerData[]) => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        saveToLocalStorage(metadata, jokerData);
      }, 500);
    },
    [saveToLocalStorage]
  );

  useEffect(() => {
    const loadAutoSave = () => {
      const savedData = loadFromLocalStorage();
      if (savedData) {
        setShowRestoreModal(true);
      }
      setHasLoadedInitialData(true);
    };

    loadAutoSave();
  }, [loadFromLocalStorage]);

  useEffect(() => {
    if (!hasLoadedInitialData) return;

    if (!modMetadata.name && jokers.length === 0) return;

    if (!hasDataChanged(modMetadata, jokers)) return;

    prevDataRef.current = { modMetadata, jokers };

    setAutoSaveStatus("saving");

    debouncedSave(modMetadata, jokers);

    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }
    if (clearStatusTimeoutRef.current) {
      clearTimeout(clearStatusTimeoutRef.current);
    }

    statusTimeoutRef.current = setTimeout(() => {
      setAutoSaveStatus("saved");
    }, 400);

    clearStatusTimeoutRef.current = setTimeout(() => {
      setAutoSaveStatus("idle");
    }, 1000);

    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      if (clearStatusTimeoutRef.current) {
        clearTimeout(clearStatusTimeoutRef.current);
      }
    };
  }, [
    modMetadata,
    jokers,
    hasLoadedInitialData,
    debouncedSave,
    hasDataChanged,
  ]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      if (clearStatusTimeoutRef.current) {
        clearTimeout(clearStatusTimeoutRef.current);
      }
    };
  }, []);

  const handleRestoreAutoSave = () => {
    const savedData = loadFromLocalStorage();
    if (savedData) {
      setModMetadata(savedData.modMetadata);
      setJokers(savedData.jokers);
      setSelectedJokerId(null);
      prevDataRef.current = {
        modMetadata: savedData.modMetadata,
        jokers: savedData.jokers,
      };
      showAlert(
        "success",
        "Project Restored",
        "Your auto-saved project has been restored successfully!"
      );
    }
    setShowRestoreModal(false);
  };

  const handleDiscardAutoSave = () => {
    clearAutoSave();
    setShowRestoreModal(false);
  };

  const showAlert = (
    type: "success" | "warning" | "error",
    title: string,
    content: string
  ) => {
    setAlert({
      isVisible: true,
      type,
      title,
      content,
    });
  };

  const hideAlert = () => {
    setAlert((prev) => ({ ...prev, isVisible: false }));
  };

  const handleNavigate = (section: string) => {
    navigate(`/${section}`);
  };

  const handleExport = async () => {
    if (
      !modMetadata.author ||
      modMetadata.author.length === 0 ||
      !modMetadata.author[0].trim()
    ) {
      showAlert(
        "error",
        "Export Failed",
        "Please enter an author name before exporting."
      );
      return;
    }

    if (!modMetadata.name.trim()) {
      showAlert(
        "error",
        "Export Failed",
        "Please enter a mod name before exporting."
      );
      return;
    }

    setExportLoading(true);
    try {
      await exportJokersAsMod(jokers, modMetadata);
      setShowExportSuccessModal(true);
    } catch (error) {
      console.error("Export failed:", error);
      showAlert(
        "error",
        "Export Failed",
        "Failed to export mod files. Please try again."
      );
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportJSON = () => {
    try {
      exportModAsJSON(modMetadata, jokers);
      showAlert(
        "success",
        "Mod Saved",
        "Your mod has been saved as a JSON file successfully!"
      );
    } catch (error) {
      console.error("JSON export failed:", error);
      showAlert(
        "error",
        "Save Failed",
        "Failed to save mod as JSON. Please try again."
      );
    }
  };

  const handleImportJSON = async () => {
    try {
      const importedData = await importModFromJSON();
      if (importedData) {
        setModMetadata(importedData.metadata);
        setJokers(importedData.jokers);
        setSelectedJokerId(null);
        prevDataRef.current = {
          modMetadata: importedData.metadata,
          jokers: importedData.jokers,
        };
        showAlert(
          "success",
          "Mod Imported",
          "Your mod has been imported successfully!"
        );
      }
    } catch (error) {
      console.error("JSON import failed:", error);
      showAlert(
        "error",
        "Import Failed",
        "Failed to import mod. Please check the file format and try again."
      );
    }
  };

  return (
    <div className="h-screen bg-black-darker flex overflow-hidden">
      <Sidebar
        selectedSection={currentSection}
        onSectionChange={handleNavigate}
        projectName={modMetadata.id || "mycustommod"}
        onExport={handleExport}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        exportLoading={exportLoading}
        jokers={jokers}
        modName={modMetadata.name}
        authorName={modMetadata.author.join(", ")}
      />
      <motion.div
        className="flex-1 flex flex-col overflow-y-auto custom-scrollbar"
        animate={{
          marginLeft: isExpanded ? 0 : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
        }}
      >
        <Routes>
          <Route
            path="/"
            element={
              <OverviewPage
                jokerCount={jokers.length}
                jokers={jokers}
                modName={modMetadata.name}
                authorName={modMetadata.author.join(", ")}
                metadata={modMetadata}
                setMetadata={setModMetadata}
                onExport={handleExport}
                onNavigate={handleNavigate}
              />
            }
          />
          <Route
            path="/overview"
            element={
              <OverviewPage
                jokerCount={jokers.length}
                jokers={jokers}
                modName={modMetadata.name}
                authorName={modMetadata.author.join(", ")}
                metadata={modMetadata}
                setMetadata={setModMetadata}
                onExport={handleExport}
                onNavigate={handleNavigate}
              />
            }
          />
          <Route
            path="/metadata"
            element={
              <ModMetadataPage
                metadata={modMetadata}
                setMetadata={setModMetadata}
              />
            }
          />
          <Route
            path="/jokers"
            element={
              <JokersPage
                modName={modMetadata.name}
                jokers={jokers}
                setJokers={setJokers}
                selectedJokerId={selectedJokerId}
                setSelectedJokerId={setSelectedJokerId}
              />
            }
          />
          <Route path="/consumables" element={<ConsumablesPage />} />
          <Route path="/decks" element={<DecksPage />} />
          <Route path="/editions" element={<EditionsPage />} />
          <Route
            path="/vanilla"
            element={
              <VanillaRemadePage
                onDuplicateToProject={(joker) => {
                  setJokers([...jokers, joker]);
                }}
                onNavigateToJokers={() => {
                  navigate("/jokers");
                }}
              />
            }
          />
          <Route
            path="/credit"
            element={
              <ExtraCreditPage
                onDuplicateToProject={(joker) => {
                  setJokers([...jokers, joker]);
                }}
                onNavigateToJokers={() => {
                  navigate("/jokers");
                }}
              />
            }
          />
          <Route path="/acknowledgements" element={<AcknowledgementsPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>

      <AnimatePresence>
        {autoSaveStatus !== "idle" && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="fixed bottom-4 right-4 z-50"
          >
            <div
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                autoSaveStatus === "saving"
                  ? "bg-mint-darker text-white-light border border-mint-dark"
                  : "bg-mint-light text-black-dark border border-mint-lighter"
              }`}
            >
              {autoSaveStatus === "saving" ? "Auto-saving..." : "Auto-saved"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-black-dark border-2 border-black-lighter rounded-xl p-6 max-w-md mx-4">
            <h3 className="text-white-light text-lg font-medium tracking-widest mb-4">
              Restore Auto-Saved Project?
            </h3>
            <p className="text-white-dark tracking-wide text-sm mb-6">
              We found an auto-saved version of your project from{" "}
              {(() => {
                const metadata = getAutoSaveMetadata();
                if (!metadata) return "recently";
                if (metadata.daysOld < 1) return "today";
                if (metadata.daysOld < 2) return "yesterday";
                return `${Math.floor(metadata.daysOld)} days ago`;
              })()}{" "}
              Would you like to restore it?
            </p>
            <div className="flex gap-4">
              <Button
                color="primary"
                variant="primary"
                onClick={handleRestoreAutoSave}
                className="w-full"
              >
                Restore
              </Button>
              <Button
                color="secondary"
                variant="secondary"
                className="w-full"
                onClick={handleDiscardAutoSave}
              >
                Start Fresh
              </Button>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showExportSuccessModal}
        onClose={() => setShowExportSuccessModal(false)}
        title="Mod Exported Successfully!"
        icon={<CheckCircleIcon className="h-6 w-6 text-mint" />}
        maxWidth="max-w-2xl"
        buttons={[
          {
            label: "Okay!",
            onClick: () => setShowExportSuccessModal(false),
            variant: "primary",
          },
        ]}
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-mint/10 border border-mint/30 rounded-lg">
            <FolderIcon className="h-5 w-5 text-mint flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-mint font-medium mb-2">
                Installation Instructions
              </h4>
              <p className="text-sm text-white-light leading-relaxed">
                To use your custom mod, place the exported folder in:
              </p>
              <code className="bg-black-dark px-2 py-1 rounded text-mint-lighter font-mono">
                %appdata%\Roaming\Balatro\Mods
              </code>
              <p className="text-sm text-white-dark mt-2">
                Make sure you have{" "}
                <a
                  href="https://github.com/Steamodded/smods"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mint-light hover:text-mint-lighter hover:underline"
                >
                  SMODS (Steamodded)
                </a>{" "}
                installed as well.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-balatro-orange/10 border border-balatro-orange/30 rounded-lg">
            <ExclamationCircleIcon className="h-5 w-5 text-balatro-orange flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-balatro-orange font-medium mb-2">
                Found a Bug or Have Suggestions?
              </h4>
              <p className="text-sm text-white-light leading-relaxed">
                If you encounter any issues with the generated code or have
                ideas for improvements, please{" "}
                <a
                  href="https://github.com/Jayd-H/joker-forge/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-balatro-orange hover:text-orange-300 hover:underline font-medium"
                >
                  open an issue on GitHub
                </a>
                . Your feedback helps make Joker Forge better!
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <Alert
        isVisible={alert.isVisible}
        type={alert.type}
        title={alert.title}
        content={alert.content}
        onClose={hideAlert}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
