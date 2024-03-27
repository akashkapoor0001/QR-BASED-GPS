// app.js

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mysql = require('mysql');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

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
// sourcery skip: use-object-destructuring
    const userType = req.query.userType;

    console.log('Received request with userType:', userType);

    if (userType === 'student') {
        res.sendFile(__dirname + '/Main_Interface/Student_Interface.html');
    } else if (userType === 'warden') {
        res.sendFile(__dirname + '/Main_Interface/Warden_Interface.html');
    } else {
        console.log('Invalid userType:', userType);
        res.status(400).send('Invalid user type');
    }
});

// WebSocket server handling connections
wss.on('connection', (ws) => {
    console.log('A user connected via WebSocket');

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'submitGatepass') {
            const { name, uid, branch, date, place, timeOut, timeIn, gatepassType } = data.data;

            const insertQuery = `INSERT INTO gatepass_requests (name, uid, branch, date, place, time_out, time_in, gatepass_type, status)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`;

            db.query(insertQuery, [name, uid, branch, date, place, timeOut, timeIn, gatepassType], (err, result) => {
                if (err) {
                    console.error('Error inserting into database: ' + err.stack);
                    ws.send(JSON.stringify({ type: 'error', message: 'Failed to submit gatepass request' }));
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

                // Notify all connected clients (warden interfaces) about the new request
                wss.clients.forEach((client) => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: 'newGatepassRequest', data: newGatepassRequest }));
                    }
                });

                ws.send(JSON.stringify({ type: 'success', message: 'Gatepass request submitted successfully' }));
            });
        }
    });

    ws.on('close', () => {
        console.log('User disconnected via WebSocket');
    });
});

const PORT = 3300;
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
