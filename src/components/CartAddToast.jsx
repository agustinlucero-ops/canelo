export default function CartAddToast({ message }) {
  if (!message) return null;

  return (
    <div className="cart-add-toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
