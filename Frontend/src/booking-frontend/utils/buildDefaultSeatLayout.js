/**
 * Static theatre layout (rows A–J) matching frontend-late seat map.
 * @param {number} basePrice — from schedule; applied to all tiers for display.
 * @returns {Array<{ categoryName: string, price: number, rows: Array }>}
 */
export function buildDefaultSeatLayout(basePrice = 12) {
  const price = typeof basePrice === 'number' && !Number.isNaN(basePrice) ? basePrice : 12;

  const makeSeat = (rowId, col) => ({
    id: `${rowId}${col}`,
    number: col,
  });

  const makeRow = (rowId) => {
    const left = Array.from({ length: 6 }, (_, i) => makeSeat(rowId, i + 1));
    const spacer = { id: `${rowId}-aisle`, isSpacer: true };
    const right = Array.from({ length: 6 }, (_, i) => makeSeat(rowId, i + 7));
    return {
      rowId,
      seats: [...left, spacer, ...right],
    };
  };

  return [
    {
      categoryName: 'CLASSIC',
      price: price * 0.8,
      rows: ['A', 'B'].map(makeRow),
    },
    {
      categoryName: 'CLASSIC PLUS',
      price,
      rows: ['C', 'D', 'E', 'F', 'G'].map(makeRow),
    },
    {
      categoryName: 'PRIME',
      price: price * 1.15,
      rows: ['H', 'I', 'J'].map(makeRow),
    },
  ];
}
