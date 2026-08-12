import React from "react";

/**
 * SummaryCards Component
 *
 * Props:
 * - cards: Array of card objects:
 *     {
 *       label: string,           // Translation key or display text
 *       count: number,           // Count to display
 *       color: string,           // Hex color for active border & count text
 *       filter: string[] | null, // Status codes this card filters by
 *       active?: boolean,        // Explicit active override (used for "Total" card)
 *     }
 * - searchParams: object         // e.g. { status: { code: "SCHEDULED" } }
 * - t: function                  // i18n translation function (defaults to identity)
 * - onCardClick: function        // (card) => void — called when a card is clicked
 *
 * Minimal usage example:
 *
 *   const cards = [
 *     { label: "Total", count: 42, color: "#0B2559", filter: null, active: true },
 *     { label: "Scheduled", count: 10, color: "#F59E0B", filter: ["SCHEDULED"] },
 *   ];
 *   <SummaryCards cards={cards} searchParams={{}} t={(k) => k} onCardClick={console.log} />
 */
const SummaryCards = ({ cards = [], t = (k) => k, onCardClick, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="summary-cards-container">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div key={idx} className="summary-card">
            <div className="summary-card-label skeleton skeleton-text" />
            <div className="summary-card-count skeleton skeleton-count" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="summary-cards-container">
      {cards.map((card, idx) => (
        <div
          key={idx}
          className="summary-card"
          onClick={() => onCardClick?.(card)}
          title={`${t(card.label)}: ${String(card.count).padStart(2, "0")}`}
        >
          <div className="summary-card-label" style={{ whiteSpace: "normal", wordWrap: "break-word", lineHeight: "1.2", paddingRight: "4px" }}>
            {t(card.label)}
          </div>

          <div className="summary-card-count" style={{ color: card.color }}>
            {String(card.count).padStart(2, "0")}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryCards;
