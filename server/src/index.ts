import express, {Request, Response} from 'express';
import { createServer } from "node:http";
import { Server } from 'socket.io';
import fs from 'fs'

interface User {
    username: string;
    publicKey: string;
    socketID: string;
}

interface NoSocketUser {
    username: string;
    publicKey: string;
}

interface Message {
    fromUsername: string;
    toUsername: string;
    content: string;
    timestamp: number;
}

let users: User[] = []; // socket id -> User

const getUsernames = (): string[] => users.map(v => v.username)
const getSocketID = (username: string): string => users.filter(v => v.username===username)[0].socketID

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 8080
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.get("/", (req: Request, res: Response) => {
    res.send("<h1>Hello world</h1>")
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
            console.log("user registered", {username:payload.username, publicKey:payload.publicKey})
            socket.emit("register-success")
            io.emit('user-list', users.map(v => {return {username:v.username, publicKey:v.publicKey}}))
        }
    })
    
    socket.on("msg-send", (payload: Message) => {
        //console.log("message sent", payload)
        const toSocketID = getSocketID(payload.toUsername)
        //console.log(users, toSocketID)
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