import { useState, type Dispatch, type SetStateAction } from "react"
import arrow_left_plat from "../assets/arrow_left_plat.svg"
import type { AppSocket, Message, User } from "../types/socket"
import { _sendMessage } from "../utils/server-interface"

type NewChatProps = {
    setNewChatScreen: Dispatch<SetStateAction<boolean>>
    users: User[];
    username: string;
    socket:AppSocket | null;
    setChats: Dispatch<SetStateAction<Message[]>>;
}

const NewChatView = ({setNewChatScreen, users, username, socket, setChats}:NewChatProps) => {

    const [newChatUsername, setNewChatUsername] = useState("");
    const [newChatContent, setNewChatContent] = useState("")
    const [newChatSending, setNewChatSending] = useState(false)

    const sendNewChat = () => {
        _sendMessage(
            newChatUsername,
            username,
            newChatContent,
            users,
            socket,
            () => setNewChatSending(true),
            (msg) => {
                setChats(prev => [...prev, {...msg, content:newChatContent}])
                setNewChatScreen(false)
            },
            (err) => alert(err),
            () => setNewChatSending(false)
        )
    }

    return (
        <div className="chat-contain">
            <div className="header-row">
              <img alt="back" src={arrow_left_plat} onClick={() => setNewChatScreen(false)} />
                <h2>New Chat</h2>
            </div>
            <div className="new-chat-contain">
              <input type="text" onChange={(e) => setNewChatUsername(e.target.value)} name="username" placeholder="username" />
              <textarea  name="message" onChange={(e) => setNewChatContent(e.target.value)} placeholder="message" cols={40} rows={5} />
              <button onClick={() => sendNewChat()} disabled={newChatSending || (newChatUsername==username) || !users.map(v=>v.username).includes(newChatUsername)}>{users.map(v=>v.username).includes(newChatUsername) ? ( newChatUsername!=username ? (!newChatSending ? "Send" : "Sending...") : "You cannot send a message to yourself") : "No user with such username"}</button>
            </div>
        </div>
    )
}

export default NewChatView
