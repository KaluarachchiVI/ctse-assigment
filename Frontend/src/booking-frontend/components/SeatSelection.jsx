import './SeatSelection.css';

function normalizeId(id) {
  return String(id).toUpperCase().trim();
}

/**
 * @typedef {{ id: string, number?: number, isSpacer?: boolean }} SeatInfo
 * @typedef {{ rowId: string, seats: SeatInfo[] }} SeatRowInfo
 * @typedef {{ categoryName: string, price: number, rows: SeatRowInfo[] }} SeatCategoryInfo
 */

export default function SeatSelection({
  layout,
  selectedSeats,
  occupiedSeats,
  onSeatSelect,
  className = '',
}) {
  const selected = new Set(selectedSeats.map(normalizeId));
  const occupied = new Set(occupiedSeats.map(normalizeId));

  return (
    <div className={`seat-selection-root ${className}`.trim()}>
      {layout.map((cat) => (
        <div key={cat.categoryName} className="seat-cat">
          <div className="seat-cat-header">
            <span className="seat-cat-name">{cat.categoryName}</span>
            <span className="seat-cat-price">From ${Number(cat.price).toFixed(2)}</span>
          </div>
          <div className="seat-cat-panel">
            <div className="seat-screen-label">Screen</div>
            <div className="seat-rows">
              {cat.rows.map((row) => (
                <div key={row.rowId} className="seat-row">
                  <span className="seat-row-id">{row.rowId}</span>
                  {row.seats.map((seat) => {
                    if (seat.isSpacer) {
                      return <div key={seat.id} className="seat-aisle-gap" aria-hidden />;
                    }
                    const id = normalizeId(seat.id);
                    const isSel = selected.has(id);
                    const isOcc = occupied.has(id);
                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={isOcc}
                        className={`seat-btn ${isOcc ? 'occupied' : ''} ${isSel ? 'selected' : ''}`.trim()}
                        onClick={() => onSeatSelect(id)}
                      >
                        {seat.number ?? ''}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
