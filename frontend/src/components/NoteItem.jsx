import React, { useState, useEffect } from 'react';

export default function NoteItem({ note, onSave }) {
  const [isEditing, setIsEditing] = useState(!note.id); // auto-edit if new note
  const [noteText, setNoteText] = useState(note?.note || '');

  // Reset text if `note` changes (e.g. on edit cancel)
  useEffect(() => {
    setNoteText(note?.note || '');
  }, [note]);

  if (!note) return <div style={{ color: 'red' }}>Error: note data missing</div>;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...note, note: noteText });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} style={{ marginBottom: '10px' }}>
        <textarea
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          placeholder="Write your note..."
          rows={3}
          style={{ width: '100%' }}
        />
        <button type="submit">💾 Save</button>
        <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
      </form>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{ cursor: 'pointer', marginBottom: '8px', whiteSpace: 'pre-wrap' }}
    >
      {note.note || <i>(empty note)</i>}
    </div>
  );
}
