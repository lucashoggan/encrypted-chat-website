import { useSocket } from "./context/socket"
import { useState, useEffect, type JSX } from "react";
import { type User, type Message } from "./types/socket";
import {decryptWithPrivateKey, generateKeyPair} from "./utils/crypto-functions"
import RegisterView from "./views/register";
import NewChatView from "./views/new-chat";
import SelectChatView from "./views/select-chat";
import FullChatView from "./views/full-chat";

function App() {
  const {socket, isConnected} = useSocket();
  const [users, setUsers] = useState<User[]>([]);
  const [keyPair, setKeyPair] = useState<CryptoKeyPair>()
  const [username, setUsername] = useState("")
  const [registered, setRegistered] = useState(false);
  const [newChatScreen, setNewChatScreen] = useState(false);
  const [curChatUsername, setCurChatUsername] = useState("")
  const [chats, setChats] = useState<Message[]>([])
  
  /*
  const attemptRegister = () => {
    setRegisterLoading(true);
    if (!socket) {
      setRegisterLoading(false);
    } else if (!keyPair) {
      alert("Issue generating key pair, please try and reload website")
      setRegisterLoading(false)
    } else if (username==="") {
      alert("Please enter a username")
      setRegisterLoading(false)
    } else {
      exportPublicKey(keyPair.publicKey).then((val) => {
        socket.emit("register", {
          username, publicKey:val
        })
      })
    }
  }
  */
  
  /*
  const sendMessage = ( toUsername:string, msgContent:string) => {
    setNewChatSending(true);
    const selcUser = users.filter(v => v.username==toUsername)[0];
    importPublicKey(selcUser.publicKey).then((pubk) => {
      encryptWithPublicKey(msgContent, pubk).then((encrMessage) => {
        const msg: Message = {
          fromUsername:username,
          toUsername:toUsername,
          content: encrMessage,
          timestamp: Math.floor(Date.now()/1000)
        }
        socket?.emit("msg-send", msg)
        setSentMessages(prev => [...prev, {...msg, content:msgContent}])
        setNewChatScreen(false)
      }, (err) => {
        console.log(err)
        alert("Error with encrypting message, please try again")
      })
    }, (err) => {
      console.log(err)
      alert("Error with importing public key, please try again")
    }).finally(() => {
      setNewChatSending(false)
    })
  }
  */

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
    } else if (curChatUsername === "" && newChatScreen) {
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
    }

    return null
  }

  return (
    <>
      <nav>
        <h1>Encrypted Chat App</h1>
        {username != "" && registered ? <h3>@{username}</h3>: null}
      </nav>
      <main>
        {getContent()}
        {/*
        {!registered ? (
          <RegisterView 
            keyPair={keyPair}
            isConnected={isConnected}
            socket={socket}
            username={username}
            setUsername={setUsername}
          />
        ) : ( fullChatUsername === "" ?  
          <NewChatScreen 

          />  : (
          <div className="full-message-contain">
            <div className="header">
              <img src={arrow_left_plat} alt="back" onClick={() => setFullChatUsername("")} />
              <h2>@{fullChatUsername}</h2>
            </div>
            <div className="messages">
              {combinedFullScreenChatMessages.map(val =>  {
                const timeLabelValue = new Date(val.timestamp*1000).toLocaleString()
                return <div key={val.fromUsername+":"+timeLabelValue} className={"full-screen-message " + (val.fromUsername!=username ? "sent" : "recv")}>
                <p className="timestamp">{timeLabelValue}</p>
                <p className="content">{val.content}</p>
              </div>})}
            </div>
            <div className="send-message-contain">
              <textarea value={fullChatNewMessageContent} onChange={(e) => setFullChatNewMessageContent(e.target.value)} name="send-message-ta" rows={1} cols={40} placeholder="message" />
              <button className="send-button" onClick={() => {
                sendMessage(fullChatUsername, fullChatNewMessageContent)
                setFullChatNewMessageContent("")
              }}>
                <img src={paper_airplane_blue} alt="send" />
              </button>
            </div>
          </div>
        ))}*/}
      </main>
    </>
  )
}

export default App

