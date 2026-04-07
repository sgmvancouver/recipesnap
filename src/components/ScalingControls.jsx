export default function ScalingControls({ servings, onScale }) {
  if (!servings || isNaN(servings)) return null;

  return (
    <div className="scaling-controls" aria-label="Scale recipe servings">
      <span className="scaling-label">Servings</span>
      <div className="scaling-buttons">
        <button 
          className="btn-icon" 
          onClick={() => onScale(0.5)}
          disabled={servings <= 1}
          title="Halve servings"
        >
          ½
        </button>
        <div className="servings-display">
          <span className="servings-count">{servings}</span>
        </div>
        <button 
          className="btn-icon" 
          onClick={() => onScale(2)}
          title="Double servings"
        >
          2×
        </button>
      </div>
      <button 
        className="btn-subtle" 
        style={{ marginLeft: 'var(--space-2)' }}
        onClick={() => onScale(null)}
      >
        Reset
      </button>
    </div>
  );
}
