import { useCallback, useEffect, useState } from "react";
import CollapsibleSection from "./CollapsibleSection";
import CatalogImportReviewView from "./CatalogImportReviewView";
import ProductEditModal from "./ProductEditModal";
import { readCatalogImportFile } from "../utils/readCatalogImportFile";
import {
  discardImportDraftApi,
  fetchImportDraft,
  parseCatalogImportPdf,
  parseCatalogImportRows,
  publishImportDraftApi,
  removeImportDraftItemApi,
  renameImportDraftCategoryApi,
  updateImportDraftItemApi,
} from "../api/adminCatalogImport";

function importItemToEditDraft(item) {
  return {
    ...item.payload,
    presentations: item.payload.presentations.map((presentation) => ({ ...presentation })),
  };
}

export default function CatalogImportPanel({
  isActionDisabled,
  isCatalogApiAvailable,
  productCategoryOptions,
  onCatalogRefresh,
  adminPendingAction,
  onPendingChange,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [importMode, setImportMode] = useState("new_products_only");
  const [updateExisting, setUpdateExisting] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importError, setImportError] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [isLoadingDraft, setIsLoadingDraft] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editingDraft, setEditingDraft] = useState(null);
  const [editError, setEditError] = useState("");

  const isBusy = isLoadingDraft || Boolean(adminPendingAction);
  const isDisabled = isActionDisabled || isBusy || !isCatalogApiAvailable;

  const loadDraft = useCallback(async () => {
    setIsLoadingDraft(true);
    setImportError("");
    try {
      const nextDraft = await fetchImportDraft();
      setDraft(nextDraft);
    } catch (err) {
      setImportError(err?.message || "No se pudo cargar el borrador.");
      setDraft(null);
    } finally {
      setIsLoadingDraft(false);
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !isCatalogApiAvailable) return;
    loadDraft();
  }, [isOpen, isCatalogApiAvailable, loadDraft]);

  const runPending = async (label, action) => {
    onPendingChange?.(label);
    try {
      await action();
    } finally {
      onPendingChange?.("");
    }
  };

  const handleImportFile = async () => {
    if (!selectedFile) {
      setImportError("Elegí un archivo PDF o Excel.");
      return;
    }

    setImportError("");
    setImportMessage("");

    await runPending("Cargando al borrador...", async () => {
      const payload = await readCatalogImportFile(selectedFile);
      const options = {
        importMode,
        updateExisting,
        sourceFilename: payload.sourceFilename,
      };

      if (payload.type === "rows") {
        const result = await parseCatalogImportRows({
          rows: payload.rows,
          ...options,
        });
        setImportMessage(
          `Borrador listo: ${result.summary.toCreate} nuevos, ${result.summary.toUpdate} actualizaciones, ${result.summary.skipped} omitidos.`
        );
      } else {
        const result = await parseCatalogImportPdf({
          pdfBase64: payload.pdfBase64,
          ...options,
        });
        setImportMessage(
          `Borrador listo: ${result.summary.toCreate} nuevos, ${result.summary.toUpdate} actualizaciones, ${result.summary.skipped} omitidos.`
        );
      }

      setSelectedFile(null);
      await loadDraft();
    }).catch((err) => {
      setImportError(err?.message || "No se pudo importar el archivo.");
    });
  };

  const handlePublish = async () => {
    if (!window.confirm("¿Publicar estos productos en la tienda? Los clientes los verán de inmediato.")) {
      return;
    }

    await runPending("Publicando...", async () => {
      const result = await publishImportDraftApi();
      setImportMessage(
        `Publicado: ${result.result.created} nuevos y ${result.result.updated} actualizados.`
      );
      setDraft(null);
      await onCatalogRefresh?.({ showRefreshing: true });
    }).catch((err) => {
      setImportError(err?.message || "No se pudo publicar el borrador.");
    });
  };

  const handleDiscard = async () => {
    if (!window.confirm("¿Descartar el borrador sin publicar?")) {
      return;
    }

    await runPending("Descartando borrador...", async () => {
      await discardImportDraftApi();
      setDraft(null);
      setImportMessage("Borrador descartado.");
    }).catch((err) => {
      setImportError(err?.message || "No se pudo descartar el borrador.");
    });
  };

  const handleRenameCategory = async (currentName) => {
    const nextName = window.prompt(`Nuevo nombre para la categoría "${currentName}"`, currentName);
    if (!nextName || nextName.trim() === currentName) return;

    await runPending("Renombrando categoría...", async () => {
      await renameImportDraftCategoryApi(currentName, nextName.trim());
      await loadDraft();
    }).catch((err) => {
      setImportError(err?.message || "No se pudo renombrar la categoría.");
    });
  };

  const handleRemoveItem = async (itemId) => {
    if (!window.confirm("¿Quitar este producto del borrador?")) return;

    await runPending("Actualizando borrador...", async () => {
      await removeImportDraftItemApi(itemId);
      await loadDraft();
    }).catch((err) => {
      setImportError(err?.message || "No se pudo quitar el producto.");
    });
  };

  const handleStartEditItem = (item) => {
    setEditingItem(item);
    setEditingDraft(importItemToEditDraft(item));
    setEditError("");
  };

  const handleSaveEditedItem = async () => {
    if (!editingItem || !editingDraft) return;

    await runPending("Guardando producto...", async () => {
      await updateImportDraftItemApi(editingItem.id, editingDraft);
      setEditingItem(null);
      setEditingDraft(null);
      setEditError("");
      await loadDraft();
    }).catch((err) => {
      setEditError(err?.message || "No se pudo guardar el producto.");
    });
  };

  return (
    <>
      <CollapsibleSection
        title="Importar catálogo"
        isOpen={isOpen}
        onToggle={() => setIsOpen((value) => !value)}
      >
        {!isCatalogApiAvailable && (
          <p className="admin-error">La API no está disponible. No podés importar en este momento.</p>
        )}

        <div className="admin-import-upload">
          <fieldset className="admin-import-fieldset" disabled={isDisabled}>
            <legend>Tipo de archivo</legend>
            <label className="admin-import-radio">
              <input
                type="radio"
                name="import-mode"
                value="full_catalog"
                checked={importMode === "full_catalog"}
                onChange={() => setImportMode("full_catalog")}
              />
              Catálogo completo — comparar con la tienda
            </label>
            <label className="admin-import-radio">
              <input
                type="radio"
                name="import-mode"
                value="new_products_only"
                checked={importMode === "new_products_only"}
                onChange={() => setImportMode("new_products_only")}
              />
              Solo productos nuevos
            </label>
          </fieldset>

          {importMode === "full_catalog" && (
            <label className="stock-toggle">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(event) => setUpdateExisting(event.target.checked)}
                disabled={isDisabled}
              />
              Actualizar productos que ya están en la tienda
            </label>
          )}

          <input
            type="file"
            accept=".pdf,.xlsx,.xls,.csv"
            onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
            disabled={isDisabled}
          />
          <p className="field-label">
            Plantilla Excel: columnas <code>categoria</code>, <code>nombre</code>, <code>precio</code>,{" "}
            <code>presentacion</code> (opcional).
          </p>
          <button
            className="button primary"
            type="button"
            onClick={handleImportFile}
            disabled={isDisabled || !selectedFile}
          >
            Cargar al borrador
          </button>
        </div>

        {isLoadingDraft && <p className="field-label">Cargando borrador…</p>}
        {importMessage && <p className="field-label">{importMessage}</p>}
        {importError && <p className="admin-error">{importError}</p>}

        {draft?.items?.length > 0 && (
          <CatalogImportReviewView
            draft={draft}
            isActionDisabled={isDisabled}
            onEditItem={handleStartEditItem}
            onRemoveItem={handleRemoveItem}
            onRenameCategory={handleRenameCategory}
            onDiscard={handleDiscard}
            onPublish={handlePublish}
          />
        )}

        {!isLoadingDraft && draft && draft.items.length === 0 && (
          <p className="field-label">El borrador está vacío.</p>
        )}
      </CollapsibleSection>

      {editingDraft && (
        <ProductEditModal
          draft={editingDraft}
          productCategoryOptions={productCategoryOptions}
          productAdminError={editError}
          onClose={() => {
            setEditingItem(null);
            setEditingDraft(null);
            setEditError("");
          }}
          onSave={handleSaveEditedItem}
          onEditProductField={(field, value) =>
            setEditingDraft((current) => ({ ...current, [field]: value }))
          }
          onEditProductPresentationField={(index, field, value) =>
            setEditingDraft((current) => ({
              ...current,
              presentations: current.presentations.map((presentation, presentationIndex) =>
                presentationIndex === index
                  ? { ...presentation, [field]: value }
                  : presentation
              ),
            }))
          }
          onAddPresentationToDraft={() =>
            setEditingDraft((current) => ({
              ...current,
              presentations: [...current.presentations, { label: "", price: "" }],
            }))
          }
          onRemovePresentationFromDraft={(index) =>
            setEditingDraft((current) => ({
              ...current,
              presentations: current.presentations.filter((_, presentationIndex) => presentationIndex !== index),
            }))
          }
          onEditProductImageFile={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              setEditingDraft((current) => ({ ...current, image: String(reader.result ?? "") }));
            };
            reader.readAsDataURL(file);
          }}
          isActionDisabled={isDisabled}
          isSaving={isBusy}
        />
      )}
    </>
  );
}
