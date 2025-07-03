import express, {Request, Response} from 'express';
import { createServer } from "node:http";
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import path from 'node:path';

// Use CommonJS globals for compatibility
declare const __dirname: string;

interface User {
    username: string;
    publicKey: string;
    socketID: string;
}

interface Message {
    fromUsername: string;
    toUsername: string;
    content: string;
    timestamp: number;
}

let users: User[] = []; // socket id -> User

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)
const getUsernames = (): string[] => users.map(v => v.username)
const getSocketID = (username: string): string => users.filter(v => v.username===username)[0].socketID

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 8080
const io = new Server(server, {
    cors: {
        origin: [
            "http://localhost:8080",
            "http://localhost:5173",
            "https://stonemire.lucashoggan.co.uk",
            "https://chatapp.lucashoggan.co.uk",
            "https://encrypted-chat-website.onrender.com",
        ],
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname, '..', 'public'), {
    maxAge:"1y",
    immutable: true
}))

const SPA_ROUTES = ["/"]
SPA_ROUTES.forEach(route => {
    app.get(route, (req:Request, res:Response) => {
        res.sendFile(path.join(__dirname, '..', 'public', 'index.html'))
    })
})


io.on('connection', (socket) => {
    console.log("a user connected")

    socket.on('register', (payload: {username:string; publicKey:string}) => {
        if (getUsernames().includes(payload.username)) {
            socket.emit("error:register->name-already-exists")
        } else {
            users.push({
                username:payload.username,
                publicKey:payload.publicKey,
                socketID:socket.id
            })
            socket.emit("register-success")
            io.emit('user-list', users.map(v => {return {username:v.username, publicKey:v.publicKey}}))
        }
    })
    
    socket.on("msg-send", (payload: Message) => {
        console.log("message sent")
        const toSocketID = getSocketID(payload.toUsername)
        io.to(toSocketID).emit("msg-recv", payload)
    })


    socket.on('disconnect', () => {
        users = users.filter(u => u.socketID != socket.id)
        io.emit('user-list', users.map(v => {return {username:v.username, publicKey:v.publicKey}}))
    })
})


server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})