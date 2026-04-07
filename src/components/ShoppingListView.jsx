import { useState } from 'react';
import { getShoppingList, toggleListItem, clearShoppingList } from '../services/storageService';

export default function ShoppingListView({ onBack }) {
  const [items, setItems] = useState(() => getShoppingList());

  const handleToggle = (id) => {
    const updated = toggleListItem(id);
    setItems(updated);
  };

  const handleClear = () => {
    if (confirm('Clear the whole shopping list?')) {
      clearShoppingList();
      setItems([]);
    }
  };

  const checkedCount = items.filter(i => i.checked).length;

  return (
    <section className="shopping-list-view container">
      <header className="view-header">
        <button className="btn-back" onClick={onBack}>← Back to Cookbook</button>
        <div className="flex-between">
          <h1 className="view-title">Grocery List</h1>
          {items.length > 0 && (
            <button className="btn-subtle" onClick={handleClear}>Clear All</button>
          )}
        </div>
        {items.length > 0 && (
          <div className="progress-summary">
            {checkedCount} / {items.length} items checked
          </div>
        )}
      </header>

      <div className="list-container">
        {items.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🛒</span>
            <h2>Your list is empty</h2>
            <p>Go to your cookbook and select recipes to add ingredients here.</p>
            <button className="btn btn-primary" onClick={onBack}>Go to Cookbook</button>
          </div>
        ) : (
          <ul className="shopping-list">
            {items.map(item => (
              <li key={item.id} className={`list-item ${item.checked ? 'checked' : ''}`}>
                <label className="list-item-label">
                  <input 
                    type="checkbox" 
                    checked={item.checked} 
                    onChange={() => handleToggle(item.id)} 
                  />
                  <span className="item-text">{item.original || item.name}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="list-footer">
        <p>Tip: Items with the same name and unit are automatically consolidated.</p>
      </div>
    </section>
  );
}
