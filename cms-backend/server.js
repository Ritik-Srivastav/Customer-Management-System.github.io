const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const port =  5000;

app.use(cors()); // Use CORS
app.use(bodyParser.json());

// MySQL connection setup
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Ritik@123',
  database: 'management'
});

connection.connect(err => {
  if (err) {
    console.error('Error connecting to MySQL: ', err);
    return;
  }
  console.log('Connected to MySQL');
});

app.post('/create-table', (req, res) => {
  const { tableName, columns } = req.body;

  if (!tableName || !columns || !Array.isArray(columns) || columns.length === 0) {
    return res.status(400).json({ message: 'Invalid request body' });
  }

  // Start the CREATE TABLE query with the id column as the PRIMARY KEY
  let createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (id INT AUTO_INCREMENT PRIMARY KEY`;

  // Add other columns specified in the request body
  columns.forEach((column, index) => {
    createTableQuery += `, ${column.name} ${column.type}`;
  });

  createTableQuery += ')'; // Close the CREATE TABLE statement
  console.log('CREATE TABLE query:', createTableQuery);

  connection.query(createTableQuery, (err, result) => {
    if (err) {
      console.error('Error creating table: ', err);
      return res.status(500).json({ message: 'Failed to create table' });
    }
    console.log(`Table ${tableName} created successfully`);
    res.status(200).json({ message: `Table ${tableName} created successfully` });
  });
});


// API endpoint to insert data into a table
app.post('/insert-data', (req, res) => {
  const { tableName, data } = req.body;

  if (!tableName) {
    return res.status(400).json({ message: 'Table name is required' });
  }

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ message: 'Invalid data object' });
  }

  const columns = Object.keys(data).join(', ');
  const values = Object.values(data).map(value => 
    typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value
  );

  const insertQuery = `INSERT INTO ${tableName} (${columns}) VALUES (${values.join(', ')})`;

  connection.query(insertQuery, (err, result) => {
    if (err) {
      console.error('Error inserting data: ', err);
      return res.status(500).json({ message: 'Failed to insert data' });
    }
    console.log(`Data inserted into ${tableName} successfully`);
    res.status(200).json({ message: `Data inserted into ${tableName} successfully`, insertedId: result.insertId });
  });
});



// API endpoint to get all tables with their columns 
app.get('/get-tables-details', async (req, res) => {
  connection.query('SHOW TABLES', async (err, tables) => {
      if (err) {
          console.error('Error fetching tables: ', err);
          return res.status(500).json({ message: 'Failed to fetch tables' });
      }

      let tablesDetails = [];
      for (let table of tables) {
          let tableName = table[`Tables_in_${connection.config.database}`];
          try {
              const [columns] = await connection.promise().query(`SHOW COLUMNS FROM ${tableName}`);
              const [data] = await connection.promise().query(`SELECT * FROM ${tableName} LIMIT 5`); // Limit data to 5 rows
              tablesDetails.push({ tableName, columns, data });
          } catch (queryError) {
              console.error('Error fetching details for table:', tableName, queryError);
          }
      }

      res.status(200).json({ tablesDetails });
  });
});


// API endpoint to delete data from a table
app.delete('/delete-data/:tableName/:id', (req, res) => {
  const { tableName, id } = req.params;

  if (!tableName || !id) {
    return res.status(400).json({ message: 'Invalid request parameters' });
  }

  const deleteQuery = `DELETE FROM ${tableName} WHERE id = ?`;

  connection.query(deleteQuery, [id], (err, result) => {
    if (err) {
      console.error('Error deleting data: ', err);
      return res.status(500).json({ message: 'Failed to delete data' });
    }
    console.log(`Data deleted from ${tableName} with id ${id}`);
    res.status(200).json({ message: `Data deleted from ${tableName} with id ${id}` });
  });
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

