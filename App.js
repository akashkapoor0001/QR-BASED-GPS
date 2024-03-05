// app.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Root@123',
    database: 'gps',
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database');
});

app.use(express.static('Main_Interface'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/Main_Interface/Student_Interface.html');
});

// Add this route to handle fetching gatepass requests from the database
app.get('/getRequests', (req, res) => {
    // Fetch gatepass requests from the database (adjust the query accordingly)
    const selectQuery = 'SELECT * FROM gatepass_requests';
    db.query(selectQuery, (err, results) => {
        if (err) {
            console.error('Error fetching requests from the database:', err.stack);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        // Send the fetched data as JSON
        res.json(results);
    });
});

// Listen for gatepass submission from student interface
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('submitGatepass', (data) => {
        const { name, uid, branch, date, place, timeOut, timeIn, gatepassType } = data;

        const insertQuery = `INSERT INTO gatepass_requests (name, uid, branch, date, place, time_out, time_in, gatepass_type, status)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`;

        db.query(insertQuery, [name, uid, branch, date, place, timeOut, timeIn, gatepassType], (err, result) => {
            if (err) {
                console.error('Error inserting into database: ' + err.stack);
                return;
            }

            console.log('Gatepass request inserted into the database');

            const newGatepassRequest = {
                id: result.insertId,
                name,
                uid,
                branch,
                date,
                place,
                timeOut,
                timeIn,
                gatepassType,
                status: 'Pending',
            };

            // Notify the warden interface about the new request
            io.emit('newGatepassRequest', newGatepassRequest);
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

const PORT = 3300;
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
