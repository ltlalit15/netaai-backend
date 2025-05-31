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
  host: 'maglev.proxy.rlwy.net',
  port: 22643,
  user: 'root',
  password: 'CWwzsHDosFewubRAsdjvZRNiAlagjkFT',
  database: 'railway',   // replace with your actual Railway database name if different
  multipleStatements: true,
});

console.warn('Connected to Railway MySQL');

module.exports = db;



