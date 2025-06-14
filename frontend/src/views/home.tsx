import { useState, type Dispatch, type SetStateAction } from "react";
import type { AppSocket, Message, User } from "../types/socket";
import NewChatView from "./new-chat";
import SelectChatView from "./select-chat";
import FullChatView from "./full-chat";

type HomeProps = {
    curChatUsername:string;
    setCurChatUsername: Dispatch<SetStateAction<string>>;
    users: User[];
    username:string;
    socket: AppSocket | null;
    setChats: Dispatch<SetStateAction<Message[]>>
    chats: Message[]
}

const HomeView = ({curChatUsername, setCurChatUsername, users, username, socket, setChats, chats}:HomeProps) => {

    const [newChatScreen, setNewChatScreen] = useState(false);
    
    if (curChatUsername === "" && newChatScreen) {
      return <NewChatView 
        setNewChatScreen={setNewChatScreen}
        users={users}
        username={username}
        socket={socket}
        setChats={setChats}
      />
    } else if (curChatUsername === "" && !newChatScreen) {
      return <SelectChatView
        setFullChatUsername={setCurChatUsername}
        setNewChatScreen={setNewChatScreen}
        chats={chats}
        username={username}
      />
    } else if (curChatUsername != "") {
      return <FullChatView 
        curChatUsername={curChatUsername}
        setCurChatUsername={setCurChatUsername}
        username={username}
        users={users}
        socket={socket}
        setChats={setChats}
        chats={chats}
      />
    } else {
        return null;
    }
}

export default HomeView