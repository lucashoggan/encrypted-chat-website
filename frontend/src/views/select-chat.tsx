import { useEffect, useState, type Dispatch, type SetStateAction } from "react"
import type { Message } from "../types/socket";

type SelectChatProps = {
    setFullChatUsername: Dispatch<SetStateAction<string>>;
    setNewChatScreen: Dispatch<SetStateAction<boolean>>;
    chats:Message[];
    username:string;
}

const SelectChatView = ({setFullChatUsername, setNewChatScreen, chats, username}:SelectChatProps) => {
    
    const [chatUsernames, setChatUsernames] = useState<string[]>([])

    useEffect(() => {
        const tmp:string[] = [];
        chats.forEach(msg => {
            if (!tmp.includes(msg.fromUsername) && msg.fromUsername != username) {
                tmp.push(msg.fromUsername)
            } 
            if (!tmp.includes(msg.toUsername) && msg.toUsername != username) {
                tmp.push(msg.toUsername)
            }
        })
        setChatUsernames(tmp)
    }, [chats, username])

    return (
          <div className="chat-contain">
            <div className="header-row">
              <h2>Chats</h2>
              <button onClick={() => setNewChatScreen(true)}>+</button>
            </div>
              <div className="chat-select-contain">
                {chatUsernames.map(v => (<div onClick={() => setFullChatUsername(v)} key={v}>
                  <h3>@{v}</h3>
                </div>))}
              </div>
            </div>  
            )
}

export default SelectChatView