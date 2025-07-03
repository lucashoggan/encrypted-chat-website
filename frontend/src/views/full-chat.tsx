import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import arrow_left_plat from '../assets/arrow_left_plat.svg'
import paper_airplane_blue from "../assets/paper_plate_blue.svg"
import type { AppSocket, Message, User } from '../types/socket'
import { _sendMessage } from '../utils/server-interface'

type FullChatProps = {
    curChatUsername: string
    setCurChatUsername: Dispatch<SetStateAction<string>>;
    username:string;
    users: User[];
    socket: AppSocket | null;
    setChats: Dispatch<SetStateAction<Message[]>>;
    chats: Message[];
}

const urlRegex = /^(?:(?:https?|ftp):\/\/)?(?:www\.)?(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?(?:\/[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)?$/i;

const FullChatView = ({curChatUsername, setCurChatUsername, username, users, socket, setChats, chats}:FullChatProps) => {

    const [newMessageContent, setNewMessageContent] = useState("")
    const [curChatMessages, setCurChatMessages] = useState<Message[]>([])

    const sendMessage = () => {
        _sendMessage(
            curChatUsername,
            username,
            newMessageContent,
            users,
            socket,
            () => {},
            (msg) => {
                setChats(prev => [...prev, {...msg, content:newMessageContent}])
                setNewMessageContent("")
            },
            (err) => alert(err)
        )
    }

    useEffect(() => {
        setCurChatMessages(chats.filter(msg => msg.fromUsername==curChatUsername || msg.toUsername==curChatUsername).sort((a, b) => a.timestamp-b.timestamp))
    }, [chats, curChatUsername])

    useEffect(() => {
        if (!users.map(v => v.username).includes(curChatUsername)) {
            setCurChatUsername("")
        }
    }, [users, curChatUsername, setCurChatUsername])

    return (
          <div className="full-message-contain">
            <div className="header">
              <img src={arrow_left_plat} alt="back" onClick={() => setCurChatUsername("")} />
              <h2>@{curChatUsername}</h2>
            </div>
            <div className="messages">
              {curChatMessages.map(val =>  {
                const timeLabelValue = new Date(val.timestamp*1000).toLocaleString()
                return <div key={val.fromUsername+":"+timeLabelValue} className={"full-screen-message " + (val.fromUsername!=username ? "sent" : "recv")}>
                <p className="timestamp">{timeLabelValue}</p>
                <p className="content">{val.content.replace("\n", "\n ").split(' ').map(word => (
                  urlRegex.test(word.trim()) ? <a href={word.startsWith("https://") ? word : "https://"+word} target="_blank" rel="noopener norefer">
                    {word + " "}
                  </a> : word + " "
              ))}</p>
              </div>})}
            </div>
            <div className="send-message-contain">
              <textarea value={newMessageContent} onChange={(e) => setNewMessageContent(e.target.value)} name="send-message-ta" rows={1} cols={40} placeholder="message" />
              <button className="send-button" onClick={() => sendMessage()}>
                <img src={paper_airplane_blue} alt="send" />
              </button>
            </div>
          </div>
        )
}


export default FullChatView