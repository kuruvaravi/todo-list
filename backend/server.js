const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise'); // Using promise-based API
const app = express();

app.use(cors());
app.use(express.json());

// MySQL database configuration
const dbConfig = {
  host: 'localhost',
  user: 'root', // replace with your MySQL username
  password: 'jheno#3001', // replace with your MySQL password
  database: 'todo_app'
};

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Helper function to execute queries
async function query(sql, params) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// Get all todos
app.get('/api/todos', async (req, res) => {
  try {
    const todos = await query(`
      SELECT 
        id,
        title,
        description,
        difficulty,
        due_date AS dueDate,
        completed,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM todos 
      ORDER BY created_at DESC
    `);
    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Error fetching todos' });
  }
});

// Create a new todo
app.post('/api/todos', async (req, res) => {
  const { title, description, difficulty, dueDate } = req.body;
  
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  try {
    const result = await query(
      `INSERT INTO todos 
        (title, description, difficulty, due_date) 
       VALUES (?, ?, ?, ?)`,
      [title, description, difficulty, dueDate]
    );
    
    const [newTodo] = await query(
      `SELECT 
        id,
        title,
        description,
        difficulty,
        due_date AS dueDate,
        completed,
        created_at AS createdAt,
        updated_at AS updatedAt
       FROM todos WHERE id = ?`, 
      [result.insertId]
    );
    
    res.status(201).json(newTodo);
  } catch (error) {
    console.error('Error adding todo:', error);
    res.status(500).json({ error: 'Error adding todo' });
  }
});

// Update a todo
app.put('/api/todos/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, difficulty, dueDate, completed } = req.body;

  try {
    await query(
      `UPDATE todos 
       SET 
        title = ?, 
        description = ?, 
        difficulty = ?, 
        due_date = ?, 
        completed = ? 
       WHERE id = ?`,
      [title, description, difficulty, dueDate, completed, id]
    );
    
    const [updatedTodo] = await query(
      `SELECT 
        id,
        title,
        description,
        difficulty,
        due_date AS dueDate,
        completed,
        created_at AS createdAt,
        updated_at AS updatedAt
       FROM todos WHERE id = ?`, 
      [id]
    );
    
    if (!updatedTodo) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.json(updatedTodo);
  } catch (error) {
    console.error('Error updating todo:', error);
    res.status(500).json({ error: 'Error updating todo' });
  }
});

// Delete a todo
app.delete('/api/todos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await query('DELETE FROM todos WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Error deleting todo' });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`MySQL database connected to ${dbConfig.database}`);
});