import { ChevronDown } from "lucide-react";
import { useId } from "react";

export default function CollapsibleSection({
  title,
  isOpen,
  onToggle,
  children,
  className = "",
}) {
  const panelId = useId();
  const triggerId = useId();

  return (
    <section className={`collapsible-section ${className}`.trim()}>
      <button
        id={triggerId}
        type="button"
        className="collapsible-trigger"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span>{title}</span>
        <ChevronDown
          className={`collapsible-chevron ${isOpen ? "is-open" : ""}`}
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={triggerId}
        className={`collapsible-panel ${isOpen ? "is-open" : ""}`}
        hidden={!isOpen}
      >
        {children}
      </div>
    </section>
  );
}
