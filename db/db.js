require('dotenv').config();

const mysql = require("mysql2"); 


// MySQL connection setup
const connection = mysql.createConnection({
     host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

try {
    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to MySQL:', err.stack);
            return;
        }
        console.log('Connected to MySQL as id ' + connection.threadId);
    });
} catch (error) {
    console.error('MySQL connection failed:', error);
}

module.exports = connection; // Export the connection for use in other files