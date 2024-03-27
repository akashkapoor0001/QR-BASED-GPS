const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root@123',
    database: 'gps',
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database');
});

app.get('/', (req, res) => {
    res.send('Welcome to the Hosteller Gatepass System!');
});

app.post('/login', (req, res) => {
    const { uid, password, eid } = req.body;

    if (uid) {
        // Student login
        const sql = `SELECT * FROM student_data WHERE UID='${uid}' AND Password='${password}'`;

        db.query(sql, (err, result) => {
            if (err) {
                console.error('Error executing student query: ' + err.stack);
                return res.status(500).send('Internal Server Error');
            }

            if (result.length > 0) {
                // Authentication successful
                res.status(200).send('success');
            } else {
                // Authentication failed
                res.status(401).send('Invalid student credentials.');
            }
        });
    } else if (eid) {
        // Admin login
        const sql = `SELECT * FROM warden_data WHERE EID='${eid}' AND Password='${password}'`;

        db.query(sql, (err, result) => {
            if (err) {
                console.error('Error executing admin query: ' + err.stack);
                return res.status(500).send('Internal Server Error');
            }

            if (result.length > 0) {
                // Authentication successful
                res.status(200).send('success');
            } else {
                // Authentication failed
                res.status(401).send('Invalid admin credentials.');
            }
        });
    } else {
        // Invalid request
        res.status(400).send('Invalid request.');
    }
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
