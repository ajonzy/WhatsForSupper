import React, { useContext, useState } from 'react'

import LoadingError from '../utils/loadingError'

import { UserContext } from '../app'

export default function RegisterForm(props) {
    const { user } = useContext(UserContext)
    const [username, setUsername] = useState(props.edit ? user.username : "")
    const [password, setPassword] = useState("")
    const [passwordConfirm, setPasswordConfirm] = useState("")
    const [email, setEmail] = useState(props.edit ? user.email : "")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleRegister = event => {
        event.preventDefault()

        setError("")

        if (password !== passwordConfirm) {
            setError("Password confirmation does not match.")
        }
        else if (username === "" || password === "" || passwordConfirm === "" || email === "") {
            setError("Please fill out all fields.")
        }
        else if (password.length < 8) {
            setError("Passwords must be at least 8 characters long.")
        }
        else {
            setLoading(true)

            fetch("https://whatsforsupperapi.herokuapp.com/user/add", {
                method: "POST",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password: password.trim(),
                    email: email.trim()
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

    const handleChange = event => {
        event.preventDefault()

        setError("")

        if (props.password && password !== passwordConfirm) {
            setError("Password confirmation does not match.")
        }
        else if ((props.username && username === "") || (props.password && (password === "" || passwordConfirm === "")) || (props.email && email === "")) {
            setError("Please fill out all fields.")
        }
        else if (props.password && password.length < 8) {
            setError("Passwords must be at least 8 characters long.")
        }
        else {
            setLoading(true)

            const generateBody = () => {
                if (props.username) {
                    return { username: username.trim() }
                }
                if (props.password) {
                    return { password: password.trim() }
                }
                if (props.email) {
                    return { email: email.trim() }
                }
            }

            fetch(`https://whatsforsupperapi.herokuapp.com/user/update/${user.id}`, {
                method: "PUT",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify(generateBody())
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
                    props.handleSuccessfulChange(data.data)
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
            onSubmit={props.edit ? handleChange : handleRegister}
        >
            {!props.edit ? <h3>Register</h3> : null}
            {
                !props.edit || props.username
                ? (
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
                )
                : null
            }
            {
                !props.edit || props.password
                ? (
                    <input 
                        type="password" 
                        placeholder='Password'
                        value={password}
                        onChange={event => setPassword(event.target.value)}
                        required
                    />
                )
                : null
            }
            {
                !props.edit || props.password
                ? (
                    <input 
                        type="password" 
                        placeholder='Confirm Password'
                        value={passwordConfirm}
                        onChange={event => setPasswordConfirm(event.target.value)}
                        required
                    />
                )
                : null
            }
            {
                !props.edit || props.email
                ? (
                    <input 
                        type="email" 
                        placeholder='Email'
                        value={email}
                        onChange={event => setEmail(event.target.value)}
                        autoCapitalize="none"
                        autoCorrect='off'
                        spellCheck="false"
                        required
                    />
                )
                : null
            }
            <button type="submit" disabled={loading}>{props.edit ? "Change" : "Register"}</button>
            <LoadingError loading={loading} error={error} />
        </form>
    )
}