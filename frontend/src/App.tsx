import { useSocket } from "./context/socket"
import { useState, useEffect } from "react";
import { type User, type Message } from "./types/socket";
import {decryptWithPrivateKey, encryptWithPublicKey, exportPublicKey, generateKeyPair, importPublicKey} from "./crypto-functions"
import arrow_left_plat from "./assets/arrow_left_plat.svg"
import paper_airplane_blue from "./assets/paper_plate_blue.svg"

function App() {
  const {socket, isConnected} = useSocket();
  const [users, setUsers] = useState<User[]>([]);
  const [keyPair, setKeyPair] = useState<CryptoKeyPair>()
  const [username, setUsername] = useState("")
  const [registered, setRegistered] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [decryptedChats, setDecryptedChats] = useState<Message[]>([])
  const [newChatScreen, setNewChatScreen] = useState(false);
  const [newChatSending, setNewChatSending] = useState(false);
  const [newChatContent, setNewChatContent] = useState("")
  const [newChatUsername, setNewChatUsername] = useState("")
  const [chatUsernames, setChatUsernames] = useState<string[]>([]);
  const [fullChatUsername, setFullChatUsername] = useState("")
  const [fullChatNewMessageContent, setFullChatNewMessageContent] = useState("")
  const [sentMessages, setSentMessages] = useState<Message[]>([]);
  const [combinedFullScreenChatMessages, setCombinedFullScreenChatMessages] = useState<Message[]>([]);
  

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


  useEffect(() => {
    const tmpUsernames:string[] = []
    decryptedChats.forEach(val => {
      if (!tmpUsernames.includes(val.fromUsername) && users.map(v => v.username).includes(val.fromUsername)) {
        tmpUsernames.push(val.fromUsername)
      }
    })
    sentMessages.forEach(val => {
      if (!tmpUsernames.includes(val.toUsername) && users.map(v => v.username).includes(val.toUsername)) {
        tmpUsernames.push(val.toUsername)
      }
    })
    if (!tmpUsernames.includes(fullChatUsername)) {
      setFullChatUsername("")
    }
    setChatUsernames(tmpUsernames)
  }, [decryptedChats, sentMessages, users, fullChatUsername])

  useEffect(() => {
    if (fullChatUsername != "") {
      const tmp: Message[] = [];
      decryptedChats.forEach(val => {
        if (val.fromUsername == fullChatUsername) {
          tmp.push(val)
        }
      }
      )
      sentMessages.forEach(val => {
        if (val.toUsername == fullChatUsername) {
          tmp.push(val)
        }
      })
      setCombinedFullScreenChatMessages(tmp.sort((a, b) => a.timestamp-b.timestamp))
    } 
  }, [fullChatUsername, sentMessages, decryptedChats])
  
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
      //setMessages(prev => {
        //console.log("Previous messages:", prev);
        //const newMessages = [...prev, msg];
        //console.log("New messages:", newMessages);
        //return newMessages;
      //});

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
        <h1 onClick={() => console.log(chatUsernames)}>Encrypted Chat App</h1>
        {username != "" && registered ? <h3>@{username}</h3>: null}
      </nav>
      <main>
        {!registered ? (
          <div className="register-contain">
            <div>
              <h2>Register</h2>
              <input type="text" name="username" placeholder="username" onChange={(e) => setUsername(e.target.value)} id="" />
              <button onClick={attemptRegister} disabled={registerLoading || !keyPair || !isConnected}>{!keyPair ? "Wait for encryption key generation" : (!isConnected ? "Waiting on server connection..." : (!registerLoading ? "Submit": "Loading..."))}</button>
            </div>
          </div>
        ) : ( fullChatUsername === "" ? (
          <div className="chat-contain">
            <div className="header-row">
              {newChatScreen ? <img alt="back" src={arrow_left_plat} onClick={() => setNewChatScreen(false)} />: null}
             {!newChatScreen ? (<><h2>Chats</h2><button onClick={() => setNewChatScreen(true)}>+</button></>): <h2>New Chat</h2>}
            </div>
            {newChatScreen ? (<div className="new-chat-contain">
              <input type="text" onChange={(e) => setNewChatUsername(e.target.value)} name="username" placeholder="username" />
              <textarea  name="message" onChange={(e) => setNewChatContent(e.target.value)} placeholder="message" cols={40} rows={5} />
              <button onClick={() => sendMessage(newChatUsername, newChatContent)} disabled={newChatSending}>{users.map(v=>v.username).includes(newChatUsername) ? (!newChatSending ? "Send" : "Sending...") : "No user with such username"}</button>
            </div>) : (
              <div className="chat-select-contain">
                {chatUsernames.map(v => (<div onClick={() => setFullChatUsername(v)} key={v}>
                  <h3>@{v}</h3>
                </div>))}
              </div>
            ) }
          </div>
        ) : (
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
        ))}
      </main>
    </>
  )
}

export default App

