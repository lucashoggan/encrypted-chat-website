import {Socket} from "socket.io-client"

export interface User {
    username: string;
    publicKey: string;
}

export interface Message {
    fromUsername: string;
    toUsername: string;
    content: string;
    timestamp: number;
}

export interface ServerToClientEvents {
    "user-list": (users: User[]) => void;
    "msg-recv": (msg: Message) => void;
    "error:register->name-already-exists": () => void;
    "register-success": () => void;
}

export interface ClientToServerEvents {
    'register': (payload: User) => void;
    'msg-send': (message: Message) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>