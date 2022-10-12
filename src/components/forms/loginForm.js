import React, { useState } from 'react'

import LoadingError from '../utils/loadingError'

export default function LoginForm(props) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleLogin = event => {
        event.preventDefault()

        setError("")

        if (username === "" || password === "") {
            setError("Please fill out all fields.")
        }
        else {
            setLoading(true)

            fetch("https://whatsforsupperapi.herokuapp.com/user/login", {
                method: "POST",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password: password.trim()
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 400) {
                    if (data.message.startsWith("Error")) {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                    }
                    else {
                        setError(data.message)
                    }
                    setLoading(false)
                }
                else if (data.status === 200) {
                    props.handleSuccessfulAuth(data.data)
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                }
            })
            .catch(error => {
                setError("An error occured... Please try again later.")
                console.log("Error logging in: ", error)
                setLoading(false)
            })
        }
    }

    return (
        <form className='form-wrapper login-form-wrapper'
            onSubmit={handleLogin}
        >
            <h3>Login</h3>
            <input 
                type="text" 
                placeholder='Username'
                value={username}
                onChange={event => setUsername(event.target.value)}
                autoCapitalize="none"
                autoCorrect='off'
                spellCheck="false"
                autoFocus
                required
            />
            <input 
                type="password" 
                placeholder='Password'
                value={password}
                onChange={event => setPassword(event.target.value)}
                required
            />
            <button type="submit" disabled={loading}>Login</button>
            <LoadingError loading={loading} error={error} />
        </form>
    )
}