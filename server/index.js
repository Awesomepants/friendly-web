const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const colorgenerator = require('./generatecolor.js');
const app = express();
const server = http.createServer(app);
const { DatabaseSync } = require('node:sqlite');
require("dotenv").config();
const io = new Server(server, {
    cors: {
        origin: "chrome-extension://fldpkmcdfocmefnjgaaihminbhpampdm",
        methods: ["GET", "POST"]
    }
});
const MESSAGECACHELIMIT = 100;

// Serve static files, see if we can get rid of these later since it's a browser extension
app.use(express.static(path.join(__dirname, 'public', 'index.html')));
// I'm not sure this gets used, candidate for removal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//Above code will become obselete, setting up local sqlite database:

const db = new DatabaseSync("data/messages.db");
db.exec(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY,
    message TEXT,
    color TEXT,
    room_id INTEGER
    )`);
db.exec(`CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY,
    url TEXT
    )`);
const newMessage = db.prepare("INSERT INTO messages (message, color, room_id) VALUES (?, ?, ?)");
const newRoom = db.prepare("INSERT INTO rooms (url) VALUES (?)");
const roomCheck = db.prepare("SELECT id, url FROM rooms WHERE url = ?");
const getMessagesCache = db.prepare("SELECT message, color FROM messages ORDER BY id DESC LIMIT ?");

io.on('connection', (socket) => {
    console.log('A user connected');
    const queryUrl = socket.handshake.query.url;
    const url = queryUrl.split("?")[0];
    let color;
    try {
        color = JSON.parse(socket.handshake.query.color);
    } catch (error) {
        console.error(error);
    }
    
    console.log(socket.handshake.query);
    socket.join(url);
    console.log("joined " + url);
    console.log(socket.rooms);
    if(!roomCheck.get(url)){
        console.log("Room not yet entered into database, entering");
        newRoom.run(url);
    } else {
        console.log(`Room ${url} exists in database`);
        const gotMessages = getMessagesCache.all(MESSAGECACHELIMIT);
        console.log(gotMessages);
        socket.emit("messagescache", gotMessages.reverse());
    }
    const roomId = roomCheck.get(url).id;
    console.log(`Room ID ${roomId}`);
    if (color === "null" || color === "undefined" || color === null || color === undefined){
        console.log("Generating new color, color was " + color);
        color = colorgenerator.getRandomHexColor();
        console.log("color now is " + color);
        socket.emit("colorassign",JSON.stringify(color));
    } else {
        console.log("Color was not null: ");
        console.log(color);
        console.log(color.color);
        color = color.color;
    }
    
    
    socket.on("message", (data) => {
        console.log(data);
        const message = {
            message: data,
            color: color
        }
        socket.to(url).emit("message", message);
        socket.emit("message", message);
        // SQLite based message storage
        newMessage.run(data, color, roomId);
    })
})
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});