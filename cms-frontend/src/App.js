import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState([]);
  const [columnName, setColumnName] = useState('');
  const [columnType, setColumnType] = useState('');
  const [data, setData] = useState({});
  const [message, setMessage] = useState('');
  const [createdTables, setCreatedTables] = useState([]);
  const [tablesDetails, setTablesDetails] = useState([]);

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get-tables-details');
      if (response.data && response.data.tablesDetails) {
        setTablesDetails(response.data.tablesDetails);
      }
    } catch (error) {
      setMessage('Failed to fetch tables: ' + error.message);
    }
  };

  const handleCreateTable = async () => {
    try {
      const response = await axios.post('http://localhost:5000/create-table', {
        tableName,
        columns
      });

      if (response.data && response.data.message) {
        setMessage(response.data.message);
        fetchTables(); // Refresh the list of tables after creation
        setCreatedTables([...createdTables, { tableName, columns }]);
        setTableName('');
        setColumns([]);
      } else {
        setMessage('Failed to create table: Unknown error');
      }
    } catch (error) {
      setMessage('Failed to create table: ' + error.response?.data.message);
    }
  };

  const handleAddColumn = () => {
    if (columnName && columnType) {
      setColumns([...columns, { name: columnName, type: columnType }]);
      setColumnName('');
      setColumnType('');
    }
  };

  const handleAddData = async (currentTableName) => {
    try {
      const response = await axios.post('http://localhost:5000/insert-data', {
        tableName: currentTableName,
        data
      });

      if (response.data && response.data.message) {
        setMessage(response.data.message);
        setData({});
        fetchTables();
      } else {
        setMessage('Failed to insert data: Unknown error');
      }
    } catch (error) {
      setMessage('Failed to insert data: ' + error.response?.data.message);
    }
  };

  const handleDataChange = (columnName, value) => {
    setData(prevData => ({
      ...prevData,
      [columnName]: value
    }));
  };

  const handleDeleteData = async (tableName, id) => {
    try {
      const response = await axios.delete(`http://localhost:5000/delete-data/${tableName}/${id}`);
      setMessage(response.data.message);
      fetchTables(); // Refresh data
    } catch (error) {
      setMessage('Failed to delete data: ' + error.message);
    }
  };

  return (
    <div className="App">
      <h1>Create Table</h1>
      <input
        type="text"
        placeholder="Table Name"
        value={tableName}
        onChange={(e) => setTableName(e.target.value)}
      />
      <br />
      <input
        type="text"
        placeholder="Column Name"
        value={columnName}
        onChange={(e) => setColumnName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Column Type"
        value={columnType}
        onChange={(e) => setColumnType(e.target.value)}
      />
      <button onClick={handleAddColumn}>Add Column</button>
      <br />
      <button onClick={handleCreateTable}>Create Table</button>

      <hr />

      <h1>Insert Data</h1>
      {createdTables.map((table, index) => (
        <div key={index}>
          <h2>{table.tableName}</h2>
          {table.columns.map((column, idx) => (
            <input
              key={idx}
              type="text"
              placeholder={column.name}
              onChange={(e) => handleDataChange(column.name, e.target.value)}
            />
          ))}
          <button onClick={() => handleAddData(table.tableName)}>Add Data to {table.tableName}</button>
        </div>
      ))}

      <hr />
      <h1>Database Tables Details</h1>
      {tablesDetails.map((table, index) => (
        <div key={index} className="database-table-container">
          <h2>{table.tableName}</h2>
          <h3>Columns</h3>
          <table className="database-table">
            <thead>
              <tr>
                {table.columns.map((column, idx) => (
                  <th key={idx}>{column.Field}</th>
                ))}
                <th>Actions</th> 
              </tr>
            </thead>
            <tbody>
              {table.data.map((row, idx) => (
                <tr key={idx}>
                  {table.columns.map((column, colIdx) => (
                    <td key={colIdx}>{row[column.Field]}</td>
                  ))}
                  <td>
                    <button onClick={() => handleDeleteData(table.tableName, row.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}


      {message && <p>{message}</p>}
    </div>
  );
}

export default App;