const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const colorgenerator = require('./generatecolor.js');
const app = express();
const server = http.createServer(app);
require("dotenv").config();
const io = new Server(server, {
    cors: {
        origin: "chrome-extension://fldpkmcdfocmefnjgaaihminbhpampdm",
        methods: ["GET", "POST"]
    }
});
// If this project were to scale to a production level, we'd almost certainly want to implement a databse rather than caching messages in the RAM. The function of this is moreso to allow a user to accidentally close the message box or navigate away without losing their current conversation, the goal is NOT to keep messages for posterity. The server could run out of RAM if many users used this extension.
const MESSAGECACHELIMIT = 100;
const messageCache = {};
/*
messageCache Schema:
{
"https://room.url": [
        {
            "color":'#ffffff',
            "message":'hello world!'
    }
]
}
*/
// Serve static files, see if we can get rid of these later since it's a browser extension
app.use(express.static(path.join(__dirname, 'public', 'index.html')));
// I'm not sure this gets used, candidate for removal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

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
    if(!messageCache[url]){
        console.log(`no existing message cache for ${url}, creating one: `);
        messageCache[url] = [];
    } else {
        socket.emit("messagescache", messageCache[url]);
    }
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
        messageCache[url].push(message);
        socket.to(url).emit("message", message);
        socket.emit("message", message);
        if(messageCache[url].length > MESSAGECACHELIMIT){
            messageCache[url].shift();
        }
    })
})
const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});