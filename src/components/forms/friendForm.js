import React, { useContext, useState } from 'react'

import LoadingError from '../utils/loadingError'

import { UserContext } from '../app'

export default function FriendForm(props) {
    const { user } = useContext(UserContext)
    const [username, setUsername] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = event => {
        event.preventDefault()

        setError("")

        if (username === "") {
            setError("Please fill out all required fields.")
        }
        else if (username === user.username) {
            setError("You can't send a friend request to yourself!")
        }
        else {
            setLoading(true)

            fetch("https://whatsforsupperapi.herokuapp.com/user/friend/request", {
                method: "POST",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify({
                    user_id: user.id,
                    friend_username: username
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
                    props.handleSuccessfulRequest(data.data)
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
        <form className='form-wrapper friend-form-wrapper'
            onSubmit={handleSubmit}
            autoComplete="off"
        >
            <h3>Send Friend Request</h3>
            <input type="text" 
                value={username}
                placeholder="Username"
                onChange={event => setUsername(event.target.value)}
                autoCapitalize="off"
                autoCorrect='off'
                spellCheck="false"
                autoFocus
                required
            />
            <div className='spacer-40' />
            <button type="submit" disabled={loading}>Send</button>
            <LoadingError loading={loading} error={error} />
        </form>
    )
}