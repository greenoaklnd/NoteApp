import React, { useEffect, useState } from 'react';

export default function CategoryDropdown({ value, onChange }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/categories')
      .then(res => res.json())
      .then(setCategories)
      .catch(console.error);
  }, []);

  const renderOptions = (cats, level = 0) =>
    cats.map(cat => (
      <React.Fragment key={cat.id}>
        <option value={cat.id}>
          {'- '.repeat(level) + cat.name}
        </option>
        {cat.children && renderOptions(cat.children, level + 1)}
      </React.Fragment>
    ));

  return (
    <select value={value} onChange={onChange}>
      <option value="">Select category</option>
      {renderOptions(categories)}
    </select>
  );
}
