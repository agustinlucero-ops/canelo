import { EXIT_CONFIRM_MESSAGE } from "../utils/resolveBackNavigation";

export default function ExitConfirmDialog({ isOpen, onStay, onLeave }) {
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <button className="overlay" aria-label="Cerrar confirmación de salida" onClick={onStay} />
      <div className="modal-card exit-confirm-dialog" role="dialog" aria-modal="true">
        <h2>Salir de la tienda</h2>
        <p>{EXIT_CONFIRM_MESSAGE}</p>
        <div className="modal-actions">
          <button type="button" className="button" onClick={onStay}>
            Seguir comprando
          </button>
          <button type="button" className="button primary" onClick={onLeave}>
            Salir
          </button>
        </div>
      </div>
    </>
  );
}
