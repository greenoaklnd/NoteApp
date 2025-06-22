const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const categoriesRouter = require('./routes/categories');
const pool = require('./db'); 
const notesRouter = require('./routes/notes');
const app = express();


app.use(cors());
app.use(express.json());



app.use('/categories', categoriesRouter);
app.use('/notes', notesRouter);





const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
