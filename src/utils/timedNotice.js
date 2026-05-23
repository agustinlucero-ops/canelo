export function createTimedNotice({ onShow, onHide, delayMs = 2500 }) {
  let timeoutId = null;

  return {
    show(message) {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }

      onShow(message);
      timeoutId = setTimeout(() => {
        timeoutId = null;
        onHide();
      }, delayMs);
    },
    cancel() {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      onHide();
    },
  };
}
