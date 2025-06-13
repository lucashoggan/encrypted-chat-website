import { encryptWithPublicKey, exportPublicKey, importPublicKey } from "./crypto-functions";
import { type User, type AppSocket, type Message } from "../types/socket"


export const _sendMessage = (
    toUsername:string, 
    fromUsername:string,
    msgContent:string, 
    users:User[],
    socket:AppSocket|null,
    onStart: () => void = () => {},
    onSuccess: ((msg: Message) => void | (() => void)) = () => {},
    onError: ((err: string) => void | (() => void)) = () => {},
    onFinish: () => void = () => {}, ) => {
        onStart()
        const selcUser = users.filter(v => v.username==toUsername)[0];
        importPublicKey(selcUser.publicKey).then((pubk) => {
            encryptWithPublicKey(msgContent, pubk).then((encrMessage) => {
                const msg:Message = {
                    fromUsername,
                    toUsername,
                    content:encrMessage,
                    timestamp: Math.floor(Date.now()/1000),
                }
                socket?.emit("msg-send", msg)
                onSuccess(msg)
            }, (err) => {onError("Error with encrypting message, please try again");console.log(err)})
        }, (err) => {onError("Error with importing public key, please try again");console.log(err)}).finally(onFinish)
}

export const _attemptRegister = (
    socket: AppSocket | null,
    keyPair: CryptoKeyPair | undefined,
    username: string,
    onStart: () => void = () => {},
    onError: (err:string) => void | (() => void) = () => {},
    onFinish: () => void = () => {},
) => {
    onStart();
    if (!socket) {
      onFinish()
    } else if (!keyPair) {
      onError("Issue generating key pair, please try and reload website")
      onFinish()
    } else if (username==="") {
      onError("Please enter a username")
      onFinish()
    } else {
      exportPublicKey(keyPair.publicKey).then((val) => {
        socket.emit("register", {
          username, publicKey:val
        })
      })
    }
  }


