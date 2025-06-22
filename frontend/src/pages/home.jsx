import React, { useState, useEffect } from 'react';
import NoteForm from '../components/NoteForm';
import NoteList from '../components/NoteList';

export default function Home() {
  const [notes, setNotes] = useState([]);

  // Fetch all notes
  useEffect(() => {
    fetch('http://localhost:4000/notes')
      .then(res => res.json())
      .then(data => setNotes(data))
      .catch(console.error);
  }, []);

  // Add note
  const addNote = async (note) => {
    try {
      const res = await fetch('http://localhost:4000/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(note),
      });
      const savedNote = await res.json();
      setNotes(prev => [savedNote, ...prev]);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  return (
    <div>
      <h1>📝 My Notes</h1>
      <NoteForm onAddNote={addNote} />
      <NoteList notes={notes} />
    </div>
  );
}
