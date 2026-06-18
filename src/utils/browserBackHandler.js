import { BACK_ACTIONS, resolveBackNavigation } from "./resolveBackNavigation";

export function createBrowserBackHandler({
  getNavigationState,
  onCloseLayer,
  onSwitchToCatalogo,
  onConfirmExit,
  pushState,
}) {
  return function handlePopState() {
    const action = resolveBackNavigation(getNavigationState());

    if (action.type === BACK_ACTIONS.ALLOW_EXIT) {
      return { handled: false };
    }

    pushState();

    if (action.type === BACK_ACTIONS.CLOSE_LAYER) {
      onCloseLayer(action.layer);
    } else if (action.type === BACK_ACTIONS.SWITCH_TO_CATALOGO) {
      onSwitchToCatalogo();
    } else if (action.type === BACK_ACTIONS.CONFIRM_EXIT) {
      onConfirmExit();
    }

    return { handled: true };
  };
}
