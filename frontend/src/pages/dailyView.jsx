import React, { useEffect, useState } from 'react';

export default function DailyView() {
  const [notesData, setNotesData] = useState(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [addingToCategory, setAddingToCategory] = useState(null); // { catName, category_id, isSub, parentName }
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Fetch and reshape notes on mount and after add/delete
  const fetchAndReshapeNotes = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/notes/by-day');
      const data = await res.json();

      const categoryMap = {};

      for (const [date, dayData] of Object.entries(data)) {
        for (const [catName, catData] of Object.entries(dayData.parents || {})) {
          if (!categoryMap[catName]) {
            categoryMap[catName] = {
              category_id: catData.category_id,
              dates: {},
              subcategories: {}
            };
          }
          if (catData.notes && catData.notes.length > 0) {
            if (!categoryMap[catName].dates[date]) categoryMap[catName].dates[date] = [];
            categoryMap[catName].dates[date].push(...catData.notes);
          }
          for (const [subName, subData] of Object.entries(catData.subcategories || {})) {
            if (!categoryMap[catName].subcategories[subName]) {
              categoryMap[catName].subcategories[subName] = {
                category_id: subData.category_id,
                dates: {}
              };
            }
            if (subData.notes && subData.notes.length > 0) {
              if (!categoryMap[catName].subcategories[subName].dates[date]) {
                categoryMap[catName].subcategories[subName].dates[date] = [];
              }
              categoryMap[catName].subcategories[subName].dates[date].push(...subData.notes);
            }
          }
        }
        for (const [catName, catData] of Object.entries(dayData.orphans || {})) {
          if (!categoryMap[catName]) {
            categoryMap[catName] = {
              category_id: catData.category_id,
              dates: {},
              subcategories: {}
            };
          }
          if (catData.notes && catData.notes.length > 0) {
            if (!categoryMap[catName].dates[date]) categoryMap[catName].dates[date] = [];
            categoryMap[catName].dates[date].push(...catData.notes);
          }
        }
      }

      setNotesData(categoryMap);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notes:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndReshapeNotes();
  }, []);

  // When opening an add note input, clear previous input text
  const openAddNoteInput = (catName, category_id, isSub = false, parentName = null) => {
    setNewNoteText('');
    setAddingToCategory({ catName, category_id, isSub, parentName });
  };

  const handleAddNote = async (catName, category_id, isSub = false, parentName = null) => {
    if (!newNoteText.trim()) {
      alert('Note text cannot be empty');
      return;
    }
    setSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const body = {
        note: newNoteText.trim(),
        note_date: today,
        category_id
      };
      const res = await fetch('http://localhost:4000/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Failed to add note');

      setNewNoteText('');
      setAddingToCategory(null);
      await fetchAndReshapeNotes();
    } catch (err) {
      console.error(err);
      alert('Error adding note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      const res = await fetch(`http://localhost:4000/notes/${noteId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete note');
      await fetchAndReshapeNotes();
    } catch (err) {
      console.error(err);
      alert('Error deleting note');
    }
  };

  if (loading) return <p>Loading notes...</p>;
  if (!notesData) return <p>No notes data available.</p>;

  return (
    <div style={{ padding: 20 }}>
      <h1>Daily View - All Notes Grouped by Category</h1>

      {Object.entries(notesData).map(([catName, catData]) => (
        <div key={catName} style={{ marginBottom: 30, border: '1px solid #ddd', padding: 10 }}>
          <h2>{catName}</h2>

          {/* Add note button for parent category */}
          {addingToCategory &&
          addingToCategory.catName === catName &&
          !addingToCategory.isSub ? (
            <div>
              <textarea
                rows={3}
                cols={60}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder={`Add note to ${catName}`}
              />
              <br />
              <button
                disabled={submitting || !newNoteText.trim()}
                onClick={() => handleAddNote(catName, catData.category_id, false)}
              >
                Submit
              </button>{' '}
              <button onClick={() => setAddingToCategory(null)}>Cancel</button>
            </div>
          ) : (
            <button
              onClick={() => openAddNoteInput(catName, catData.category_id, false)}
            >
              Add Note
            </button>
          )}

          {/* Dates for parent category */}
          {Object.entries(catData.dates).map(([date, notes]) => (
            <div key={date} style={{ marginLeft: 20 }}>
              <h4>{date}</h4>
              <ul>
                {notes.map((note) => (
                  <li key={note.id}>
                    {note.note}{' '}
                    <button onClick={() => handleDeleteNote(note.id)} style={{ color: 'red' }}>
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Subcategories */}
          {Object.entries(catData.subcategories).map(([subName, subData]) => (
            <div key={subName} style={{ marginLeft: 40, marginTop: 20 }}>
              <h3>{subName}</h3>

              {/* Add note button for subcategory */}
              {addingToCategory &&
              addingToCategory.catName === subName &&
              addingToCategory.isSub ? (
                <div>
                  <textarea
                    rows={3}
                    cols={60}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder={`Add note to ${subName}`}
                  />
                  <br />
                  <button
                    disabled={submitting || !newNoteText.trim()}
                    onClick={() =>
                      handleAddNote(subName, subData.category_id, true, catName)
                    }
                  >
                    Submit
                  </button>{' '}
                  <button onClick={() => setAddingToCategory(null)}>Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() =>
                    openAddNoteInput(subName, subData.category_id, true, catName)
                  }
                >
                  Add Note
                </button>
              )}

              {/* Dates for subcategory */}
              {Object.entries(subData.dates).map(([date, notes]) => (
                <div key={date} style={{ marginLeft: 20 }}>
                  <h4>{date}</h4>
                  <ul>
                    {notes.map((note) => (
                      <li key={note.id}>
                        {note.note}{' '}
                        <button onClick={() => handleDeleteNote(note.id)} style={{ color: 'red' }}>
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
