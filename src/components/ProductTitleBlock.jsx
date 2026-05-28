import { useMemo } from "react";
import { normalizeProductName } from "../utils/productName";

export default function ProductTitleBlock({ name, category, shelfNote }) {
  const title = useMemo(
    () => normalizeProductName(name, category),
    [category, name]
  );
  const note = String(shelfNote ?? "").trim();

  return (
    <div className="product-title-block">
      <h3>{title}</h3>
      {note ? <p className="product-shelf-note">{note}</p> : null}
    </div>
  );
}
