import { useSocket } from "./context/socket"
import { useState, useEffect, type JSX } from "react";
import { type User, type Message } from "./types/socket";
import {decryptWithPrivateKey, generateKeyPair} from "./utils/crypto-functions"
import RegisterView from "./views/register";
//import NewChatView from "./views/new-chat";
//import SelectChatView from "./views/select-chat";
//import FullChatView from "./views/full-chat";
import HomeView from "./views/home";

function App() {
  const {socket, isConnected} = useSocket();
  const [users, setUsers] = useState<User[]>([]);
  const [keyPair, setKeyPair] = useState<CryptoKeyPair>()
  const [username, setUsername] = useState("")
  const [registered, setRegistered] = useState(false);
  const [curChatUsername, setCurChatUsername] = useState("")
  const [chats, setChats] = useState<Message[]>([])
  
  // Generate key pair on mount
  useEffect(() => {
    generateKeyPair().then(setKeyPair);
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleUserList = (newUsers: User[]) => setUsers(newUsers);
    
    const handleNewMessage = (msg: Message) => {
      if (keyPair) {
        decryptWithPrivateKey(msg.content, keyPair.privateKey)
          .then(val => {
            setChats(prev => [...prev, {...msg, content: val}]);
          })
          .catch(console.error);
      }
    };

    const handleRegisterSuccess = () => {
      setRegistered(true);
    };

    socket.on("user-list", handleUserList);
    socket.on("msg-recv", handleNewMessage);
    socket.on("register-success", handleRegisterSuccess);

    return () => {
      socket.off("user-list", handleUserList);
      socket.off("msg-recv", handleNewMessage);
      socket.off("register-success", handleRegisterSuccess);
    };
  }, [socket, keyPair]);

  const getContent = ():JSX.Element|null => {
    if (!registered) {
      return <RegisterView 
        keyPair={keyPair}
        isConnected={isConnected}
        socket={socket}
        username={username}
        setUsername={setUsername}
      />
    } else {
      return <HomeView
        curChatUsername={curChatUsername}
        setCurChatUsername={setCurChatUsername}
        users={users}
        username={username}
        socket={socket}
        setChats={setChats}
        chats={chats}
      />
    }
    return null
  }

  return (
    <>
      <nav>
        <h1>StoneMire</h1>
        {username != "" && registered ? <h3>@{username}</h3>: null}
      </nav>
      <main>
        {getContent()} 
      </main>
    </>
  )
}

export default App

