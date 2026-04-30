export default function Sidebar({ labels, selectedLabel, onSelectLabel }) {
  return (
    <aside className="sidebar">
      {labels.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-heading">Labels</div>
          {labels.map(l => (
            <button
              key={l}
              className={`sidebar-item${selectedLabel === l ? ' active' : ''}`}
              onClick={() => onSelectLabel(l)}
            >
              {l}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
