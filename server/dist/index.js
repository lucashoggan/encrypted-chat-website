"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const node_http_1 = require("node:http");
const socket_io_1 = require("socket.io");
const node_path_1 = __importDefault(require("node:path"));
let users = []; // socket id -> User
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)
const getUsernames = () => users.map(v => v.username);
const getSocketID = (username) => users.filter(v => v.username === username)[0].socketID;
const app = (0, express_1.default)();
const server = (0, node_http_1.createServer)(app);
const PORT = process.env.PORT || 8080;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});
app.use(express_1.default.static(node_path_1.default.join(__dirname, '..', 'public'), {
    maxAge: "1y",
    immutable: true
}));
app.get("/", (req, res) => {
    res.sendFile(node_path_1.default.join(__dirname, '..', 'public', 'index.html'));
});
io.on('connection', (socket) => {
    console.log("a user connected");
    socket.on('register', (payload) => {
        if (getUsernames().includes(payload.username)) {
            socket.emit("error:register->name-already-exists");
        }
        else {
            users.push({
                username: payload.username,
                publicKey: payload.publicKey,
                socketID: socket.id
            });
            socket.emit("register-success");
            io.emit('user-list', users.map(v => { return { username: v.username, publicKey: v.publicKey }; }));
        }
    });
    socket.on("msg-send", (payload) => {
        console.log("message sent");
        const toSocketID = getSocketID(payload.toUsername);
        io.to(toSocketID).emit("msg-recv", payload);
    });
    socket.on('disconnect', () => {
        users = users.filter(u => u.socketID != socket.id);
        io.emit('user-list', users.map(v => { return { username: v.username, publicKey: v.publicKey }; }));
    });
});
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
