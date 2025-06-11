import { useSocket } from "./context/socket"
import { useState, useEffect } from "react";
import { type User, type Message } from "./types/socket";
import {decryptWithPrivateKey, encryptWithPublicKey, exportPublicKey, generateKeyPair, importPublicKey} from "./crypto-functions"

function App() {
  const {socket, isConnected} = useSocket();
  const [users, setUsers] = useState<User[]>([]);
  const [keyPair, setKeyPair] = useState<CryptoKeyPair>()
  const [username, setUsername] = useState("lucashoggan")
  const [messages, setMessages] = useState<Message[]>([])
  const [registered, setRegistered] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [decryptedChats, setDecryptedChats] = useState<Message[]>([])
  const [newChatScreen, setNewChatScreen] = useState(false);
  const [newChatSending, setNewChatSending] = useState(false);
  const [newChatContent, setNewChatContent] = useState("")
  const [newChatUsername, setNewChatUsername] = useState("")
  const [refreshKeyPair, setRefreshKeyPair] = useState(false)

  const attemptRegister = () => {
    setRegisterLoading(true);
    if (!socket) {
      setRegisterLoading(false);
    } else if (!keyPair) {
      alert("Issue generating key pair, please try and reload website")
      setRegisterLoading(false)
    } else if (username==="") {
      alert("Please enter a username")
    } else {
      exportPublicKey(keyPair.publicKey).then((val) => {
        socket.emit("register", {
          username, publicKey:val
        })
      })
    }
  }

  const attemptSendNewMessage = () => {
    setNewChatSending(true);
    const selcUser = users.filter(v => v.username==newChatUsername)[0];
    importPublicKey(selcUser.publicKey).then((pubk) => {
      encryptWithPublicKey(newChatContent, pubk).then((encrMessage) => {
        socket?.emit("msg-send", {
          fromUsername:username,
          toUsername:newChatUsername,
          content: encrMessage,
          timestamp: Math.floor(Date.now()/1000)
        })
        setMessages(prev => [...prev, {fromUsername:username, toUsername:newChatContent, content:newChatContent, timestamp:Math.floor(Date.now()/1000)}])
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


  
  // Generate key pair on mount
  useEffect(() => {
    generateKeyPair().then(setKeyPair);
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleUserList = (newUsers: User[]) => setUsers(newUsers);
    
    const handleNewMessage = (msg: Message) => {
      //console.log("Received message:", msg);
      setMessages(prev => {
        //console.log("Previous messages:", prev);
        const newMessages = [...prev, msg];
        //console.log("New messages:", newMessages);
        return newMessages;
      });

      if (keyPair) {
        decryptWithPrivateKey(msg.content, keyPair.privateKey)
          .then(val => {
            setDecryptedChats(prev => [...prev, {...msg, content: val}]);
          })
          .catch(console.error);
      }
    };

    const handleRegisterSuccess = () => {
      setRegisterLoading(false);
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

  return (
    <>
      <nav>
        <h1 onClick={() => console.log(decryptedChats)}>Encrypted Chat App</h1>
        {username != "" && registered ? <h3>@{username}</h3>: null}
      </nav>
      <main>
        {!registered ? (
          <div className="register-contain">
            <div>
              <h2>Register</h2>
              <input type="text" name="username" placeholder="username" onChange={(e) => setUsername(e.target.value)} id="" />
              <button onClick={attemptRegister} disabled={registerLoading || !keyPair}>{!keyPair ? "Wait for encryption key generation" : (!socket ? "Wait for server connection" : (!registerLoading ? "Submit": "Loading..."))}</button>
            </div>
          </div>
        ) : (
          <div className="chat-contain">
            <div className="header-row">
              {!newChatScreen ? (<><h2>Chats</h2><button onClick={() => setNewChatScreen(true)}>+</button></>): <h2>New Chat</h2>}
            </div>
            {newChatScreen ? (<div className="new-chat-contain">
              <input type="text" onChange={(e) => setNewChatUsername(e.target.value)} name="username" placeholder="username" />
              <textarea  name="message" onChange={(e) => setNewChatContent(e.target.value)} placeholder="message" cols={40} rows={5} />
              <button onClick={attemptSendNewMessage} disabled={newChatSending}>{users.map(v=>v.username).includes(newChatUsername) ? (!newChatSending ? "Send" : "Sending...") : "No user with such username"}</button>
            </div>) : null }
          </div>
        )}
      </main>
    </>
  )
}

export default App

