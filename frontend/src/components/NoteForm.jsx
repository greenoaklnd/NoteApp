import React, { useState } from 'react';
import CategoryDropdown from './CategoryDropdown'; // Adjust path as needed

export default function NoteForm({ onAddNote }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !content || !categoryId) {
      alert('Please fill all fields and select a category.');
      return;
    }
    onAddNote({
      id: Date.now(),
      title,
      content,
      categoryId,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    });

    // Clear form
    setTitle('');
    setContent('');
    setCategoryId('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Note title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Note content"
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <label>Category:</label>
      <CategoryDropdown
        value={categoryId}
        onChange={e => setCategoryId(e.target.value)}
      />
      <button type="submit">Add Note</button>
    </form>
  );
}
