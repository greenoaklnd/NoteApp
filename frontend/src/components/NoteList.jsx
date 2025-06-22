export default function NoteList({ notes }) {
  return (
    <ul>
      {notes.map(note => (
        <li key={note.id}>
          <strong>{note.title}</strong> ({note.category_name || 'No category'})<br />
          {note.content}<br />
          <small>{note.note_date}</small>
        </li>
      ))}
    </ul>
  );
}
