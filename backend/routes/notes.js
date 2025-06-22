const express = require('express');
const pool = require('../db');
const router = express.Router();

const ALL_CATEGORY_NAMES = ['pops', 'm', 'budget', 'house', 'grace', 'coding', 'doggy', 'car'];


//Daily view
router.get('/daily', async (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: 'Missing date parameter' });

  try {
    const result = await pool.query(`
      SELECT c.id AS category_id, c.name AS category_name,
             c.parent_id, p.name AS parent_name,
             n.id AS note_id, n.note, n.note_date
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      LEFT JOIN notes n ON c.id = n.category_id AND n.note_date::date = $1
      ORDER BY COALESCE(p.name, c.name), c.name, n.id
    `, [date]);
    console.log("Requested daily view for date:", date);

    // Collect categories and subcategories
    const parents = {};
    const orphans = {}; // categories with no parent

    result.rows.forEach(row => {
      if (!row.parent_id) {
        // top-level category
        if (!parents[row.category_name]) {
          parents[row.category_name] = {
            category_id: row.category_id,
            notes: [],
            subcategories: {}
          };
        }
        if (row.note_id) {
          parents[row.category_name].notes.push({
            id: row.note_id,
            note: row.note,
            note_date: row.note_date,
            category_id: row.category_id,
            category_name: row.category_name
          });
        }
      } else {
        // child category
        if (!parents[row.parent_name]) {
          // parent doesn't exist? treat as orphan for safety
          if (!orphans[row.category_name]) {
            orphans[row.category_name] = {
              category_id: row.category_id,
              notes: []
            };
          }
          if (row.note_id) {
            orphans[row.category_name].notes.push({
              id: row.note_id,
              note: row.note,
              note_date: row.note_date,
              category_id: row.category_id,
              category_name: row.category_name
            });
          }
        } else {
          if (!parents[row.parent_name].subcategories[row.category_name]) {
            parents[row.parent_name].subcategories[row.category_name] = {
              category_id: row.category_id,
              notes: []
            };
          }
          if (row.note_id) {
            parents[row.parent_name].subcategories[row.category_name].notes.push({
              id: row.note_id,
              note: row.note,
              note_date: row.note_date,
              category_id: row.category_id,
              category_name: row.category_name
            });
          }
        }
      }
    });

    // Now send both parents and orphans (orphans will be top-level categories without parent)
    res.json({ parents, orphans });
    console.log(JSON.stringify({ parents, orphans }, null, 2));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// BY CATEGORY - History view, grouped by category name
router.get('/by-category', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.note, n.note_date, c.name AS category_name
      FROM notes n
      JOIN categories c ON n.category_id = c.id
      ORDER BY c.name, n.note_date DESC
    `);

    const grouped = {};
    result.rows.forEach(row => {
      if (!grouped[row.category_name]) {
        grouped[row.category_name] = [];
      }
      grouped[row.category_name].push(row);
    });

    res.json(grouped);
  } catch (error) {
    console.error('Error fetching notes by category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST - Add note
router.post('/', async (req, res) => {
  const { note, note_date, category_id } = req.body;
  const result = await pool.query(
    'INSERT INTO notes (note, note_date, category_id) VALUES ($1, $2, $3) RETURNING *',
    [note, note_date, category_id]
  );
  res.json(result.rows[0]);
});

// PUT - Update note
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { note, note_date, category_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE notes SET note = $1, note_date = $2, category_id = $3 WHERE id = $4 RETURNING *',
      [note, note_date, category_id, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET ALL notes (optional)
router.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM notes ORDER BY note_date DESC');
  res.json(result.rows);
});

// Group notes by date
router.get('/by-day', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id AS category_id, c.name AS category_name,
             c.parent_id, p.name AS parent_name,
             n.id AS note_id, n.note, n.note_date::date
      FROM categories c
      LEFT JOIN categories p ON c.parent_id = p.id
      JOIN notes n ON c.id = n.category_id
      ORDER BY n.note_date DESC, COALESCE(p.name, c.name), c.name, n.id
    `);

    const groupedByDate = {};

    result.rows.forEach(row => {
      // note_date is a string like '2025-06-21' already
      const date = row.note_date;

      if (!groupedByDate[date]) {
        groupedByDate[date] = { parents: {}, orphans: {} };
      }

      const current = groupedByDate[date];

      if (!row.parent_id) {
        if (!current.parents[row.category_name]) {
          current.parents[row.category_name] = {
            category_id: row.category_id,
            notes: [],
            subcategories: {}
          };
        }
        current.parents[row.category_name].notes.push({
          id: row.note_id,
          note: row.note,
          note_date: row.note_date,
          category_id: row.category_id,
          category_name: row.category_name
        });
      } else {
        if (!current.parents[row.parent_name]) {
          if (!current.orphans[row.category_name]) {
            current.orphans[row.category_name] = {
              category_id: row.category_id,
              notes: []
            };
          }
          current.orphans[row.category_name].notes.push({
            id: row.note_id,
            note: row.note,
            note_date: row.note_date,
            category_id: row.category_id,
            category_name: row.category_name
          });
        } else {
          const parent = current.parents[row.parent_name];
          if (!parent.subcategories[row.category_name]) {
            parent.subcategories[row.category_name] = {
              category_id: row.category_id,
              notes: []
            };
          }
          parent.subcategories[row.category_name].notes.push({
            id: row.note_id,
            note: row.note,
            note_date: row.note_date,
            category_id: row.category_id,
            category_name: row.category_name
          });
        }
      }
    });

    console.log('Grouped result:', JSON.stringify(groupedByDate, null, 2));
    res.json(groupedByDate);

  } catch (err) {
    console.error('Error in /notes/by-day:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// DELETE - Delete a note by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM notes WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json({ success: true, deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;
