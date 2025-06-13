import { type Dispatch, type SetStateAction, useState } from "react"
import type { AppSocket } from "../types/socket"
import { _attemptRegister } from "../utils/server-interface"

type RegisterViewProps = {
    keyPair: CryptoKeyPair | undefined,
    isConnected: boolean,
    socket: AppSocket| null,
    username:string,
    setUsername:Dispatch<SetStateAction<string>>
}

const RegisterView = ({ keyPair, isConnected, socket, username, setUsername }: RegisterViewProps) => {
    const [registerLoading, setRegisterLoading] = useState(false)

    const attemptRegister = () => {
        _attemptRegister(
            socket, keyPair, username,
            () => setRegisterLoading(true),
            (err) => alert(err) ,
            () => setRegisterLoading(false)
        )
    }

    return (
        <div className="register-contain">
            <div>
                <h2>Register</h2>
                <input type="text" name="username" placeholder="username" onChange={(e) => setUsername(e.target.value.trim())} id="" />
                <button onClick={attemptRegister} disabled={registerLoading || !keyPair || !isConnected}>{!keyPair ? "Wait for encryption key generation" : (!isConnected ? "Waiting on server connection..." : (!registerLoading ? "Submit": "Loading..."))}</button>
            </div>
        </div>
    )

}

export default RegisterView