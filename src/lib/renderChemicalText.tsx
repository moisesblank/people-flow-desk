import React from "react";

// Token seguro (não-HTML) para estados físicos, para evitar escape de tags.
// Ex.: "CO₂⟦state:g⟧" será renderizado como CO₂(g) em subscrito visual.
const STATE_TOKEN_RE = /⟦state:(s|l|g|v|aq)⟧/gi;

export function renderChemicalText(text: string): React.ReactNode {
  if (!text) return text;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  STATE_TOKEN_RE.lastIndex = 0;

  while ((match = STATE_TOKEN_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const state = (match[1] || "").toLowerCase();
    nodes.push(
      <sub key={`state-${match.index}`} className="align-sub text-[0.7em] leading-none">
        ({state})
      </sub>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return <>{nodes}</>;
}
