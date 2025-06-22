import React, { useEffect, useState } from 'react';

export default function TopicHistoryView() {
  const [groupedNotes, setGroupedNotes] = useState({});

  useEffect(() => {
    fetch('http://localhost:4000/notes/by-topic')
      .then(res => res.json())
      .then(data => setGroupedNotes(data))
      .catch(console.error);
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      <h1>📚 Topic History</h1>
      {Object.entries(groupedNotes).map(([topic, notes]) => (
        <div key={topic} style={{ marginBottom: '2rem' }}>
          <h2>{topic}</h2>
          {notes.map(note => (
            <div key={note.note_date + note.note} style={{ marginLeft: '1rem', padding: '0.5rem', borderBottom: '1px solid #ccc' }}>
              <small style={{ fontStyle: 'italic' }}>{note.note_date}</small>
              <p>{note.note}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
