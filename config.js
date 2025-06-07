// local db
// const mysql = require('mysql2/promise');

// const db = mysql.createPool({
//     host: '127.0.0.1',
//     port: 3306,
//     user: 'root',
//     password: '',
//     database: 'netaai',
//     multipleStatements: true
// });

 

// console.warn('Connected');

// module.exports = db;


// live db
const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'crossover.proxy.rlwy.net',  // Updated host from new CLI
  port: 22208,                       // Updated port from new CLI
  user: 'root',                      // Same as CLI
  password: 'YjbLZhUBzwNdtzHeMooDGksWzTXxAFuO',  // Updated password from new CLI
  database: 'railway',               // Same as CLI
  multipleStatements: true,
});

console.warn('Connected to Railway MySQL');

module.exports = db;




