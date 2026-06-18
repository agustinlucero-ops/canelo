import { useEffect, useRef } from "react";
import { createBrowserBackHandler } from "../utils/browserBackHandler";
import { shouldWarnBeforeUnload } from "../utils/resolveBackNavigation";

function pushNavigationState() {
  window.history.pushState({ caneloNav: true }, "");
}

export default function useBrowserBackNavigation({
  layers,
  isAdmin,
  activeView,
  cartItemCount,
  onCloseLayer,
  onSwitchToCatalogo,
  onConfirmExit,
}) {
  const stateRef = useRef({
    layers,
    isAdmin,
    activeView,
    cartItemCount,
    onCloseLayer,
    onSwitchToCatalogo,
    onConfirmExit,
  });

  stateRef.current = {
    layers,
    isAdmin,
    activeView,
    cartItemCount,
    onCloseLayer,
    onSwitchToCatalogo,
    onConfirmExit,
  };

  useEffect(() => {
    if (window.history.state?.caneloNav) {
      return;
    }

    pushNavigationState();
  }, []);

  useEffect(() => {
    const handlePopState = createBrowserBackHandler({
      getNavigationState: () => {
        const current = stateRef.current;
        return {
          layers: current.layers,
          isAdmin: current.isAdmin,
          activeView: current.activeView,
          cartItemCount: current.cartItemCount,
        };
      },
      onCloseLayer: (layer) => stateRef.current.onCloseLayer(layer),
      onSwitchToCatalogo: () => stateRef.current.onSwitchToCatalogo(),
      onConfirmExit: () => stateRef.current.onConfirmExit(),
      pushState: pushNavigationState,
    });

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (!shouldWarnBeforeUnload(cartItemCount)) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [cartItemCount]);
}
