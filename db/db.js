

// const mysql = require("mysql2"); 


// // MySQL connection setup
// const connection = mysql.createConnection({
//      host: process.env.HOST,
//     user: process.env.USER,
//     password: process.env.PASSWORD,
//     database: process.env.DATABASE
// });

// try {
//     connection.connect((err) => {
//         if (err) {
//             console.error('Error connecting to MySQL:', err.stack);
//             return;
//         }
//         console.log('Connected to MySQL as id ' + connection.threadId);
//     });
// } catch (error) {
//     console.error('MySQL connection failed:', error);
// }

// module.exports = connection; // Export the connection for use in other files


require("dotenv").config();
const mysql = require("mysql2/promise");


const connection = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,   
  queueLimit: 0
});


(async () => {
  try {
    const conn = await connection.getConnection();
    await conn.ping();
    console.log(" MySQL connection established ");
    conn.release();
  } catch (err) {
    console.error("MySQL connection failed:", err.message);
  }
})();

module.exports = connection;  
