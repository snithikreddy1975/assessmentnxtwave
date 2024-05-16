const express = require('express');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// 2. Install dependencies
app.use(express.json());

// 3. Define routes

// Initialize SQLite database
const db = new sqlite3.Database(':memory:');

// Create movies table
db.serialize(() => {
  db.run(`CREATE TABLE movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    img TEXT,
    summary TEXT
  )`);

  // Insert initial data
  const initialData = [
    {
      name: "Harry Potter and the Order of the Phoenix",
      img: "https://bit.ly/2IcnSwz",
      summary: "Harry Potter and Dumbledore's warning about the return of Lord Voldemort is not heeded by the wizard authorities who, in turn, look to undermine Dumbledore's authority at Hogwarts and discredit Harry."
    },
    {
      name: "The Lord of the Rings: The Fellowship of the Ring",
      img: "https://bit.ly/2tC1Lcg",
      summary: "A young hobbit, Frodo, who has found the One Ring that belongs to the Dark Lord Sauron, begins his journey with eight companions to Mount Doom, the only place where it can be destroyed."
    },
    {
      name: "Avengers: Endgame",
      img: "https://bit.ly/2Pzczlb",
      summary: "Adrift in space with no food or water, Tony Stark sends a message to Pepper Potts as his oxygen supply starts to dwindle. Meanwhile, the remaining Avengers -- Thor, Black Widow, Captain America, and Bruce Banner -- must figure out a way to bring back their vanquished allies for an epic showdown with Thanos -- the evil demigod who decimated the planet and the universe."
    }
  ];

  const stmt = db.prepare('INSERT INTO movies (name, img, summary) VALUES (?, ?, ?)');
  initialData.forEach(movie => {
    stmt.run(movie.name, movie.img, movie.summary);
  });
  stmt.finalize();
});

// GET all movies
app.get('/movies', (req, res) => {
  db.all('SELECT * FROM movies', (err, rows) => {
    if (err) {
      res.status(500).json({ message: err.message });
      return;
    }
    res.json(rows);
  });
});

// GET one movie
app.get('/movies/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM movies WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ message: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }
    res.json(row);
  });
});

// POST a new movie
app.post('/movies', (req, res) => {
  const { name, img, summary } = req.body;
  if (!name || !img || !summary) {
    res.status(400).json({ message: 'Name, img, and summary are required' });
    return;
  }

  const stmt = db.prepare('INSERT INTO movies (name, img, summary) VALUES (?, ?, ?)');
  stmt.run(name, img, summary, function(err) {
    if (err) {
      res.status(500).json({ message: err.message });
      return;
    }
    res.status(201).json({ id: this.lastID, name, img, summary });
  });
  stmt.finalize();
});

// PUT (update) a movie
app.put('/movies/:id', (req, res) => {
  const id = req.params.id;
  const { name, img, summary } = req.body;
  if (!name || !img || !summary) {
    res.status(400).json({ message: 'Name, img, and summary are required' });
    return;
  }

  const stmt = db.prepare('UPDATE movies SET name = ?, img = ?, summary = ? WHERE id = ?');
  stmt.run(name, img, summary, id, function(err) {
    if (err) {
      res.status(500).json({ message: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }
    res.json({ id, name, img, summary });
  });
  stmt.finalize();
});

// DELETE a movie
app.delete('/movies/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM movies WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ message: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ message: 'Movie not found' });
      return;
    }
    res.json({ message: 'Movie deleted', changes: this.changes });
  });
});

// 6. Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));