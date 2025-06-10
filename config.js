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
  host: 'metro.proxy.rlwy.net',          // Host from CLI
  port: 52312,                            // Port from CLI
  user: 'root',                           // User from CLI
  password: 'GGopjCKQkiIFTieXePzJPqMEAnnTbjVA',  // Password from CLI
  database: 'railway',                    // Database name from CLI
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.warn('Connected to Railway MySQL');

module.exports = db;





