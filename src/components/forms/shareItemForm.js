import React, { useContext, useState } from 'react'

import AutosuggestInput from '../utils/autosuggestInput'
import LoadingError from '../utils/loadingError'

import { UserContext } from '../app'

import titleize from '../../functions/titleize'

export default function ShareItemForm(props) {
    const { user } = useContext(UserContext)
    const [friend, setFriend] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleShare = event => {
        event.preventDefault()

        setError("")

        if (friend === "") {
            setError("Please fill out all required fields.")
        }
        else if (friend === user.username) {
            setError("You can't share items with yourself!")
        }
        else {
            setLoading(true)

            fetch(`https://whatsforsupperapi.herokuapp.com/${props.itemType}/share`, {
                method: "POST",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify({
                    [`${props.itemType}_id`]: props.itemId,
                    username: friend.trim()
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
                    props.handleSuccessfulShare(data.data)
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                }
            })
            .catch(error => {
                setError("An error occured... Please try again later.")
                console.log(`Error sharing ${props.itemType}: `, error)
                setLoading(false)
            })
        }
    }

    return (
        <form className='form-wrapper share-item-form-wrapper'
            onSubmit={handleShare}
            autoComplete="off"
        >
            <h3>Share {titleize(props.itemType === "shoppinglist" ? "shopping list" : props.itemType)}</h3>
            <p className='name'>{props.item.name}</p>
            <h4>Share With</h4>
            <AutosuggestInput
                input={friend}
                setInput={setFriend}
                suggestions={user.friends.map(friend => friend.username)}
                placeholder="Username"
                autoCapitalize="none"
                autoCorrect='off'
                spellCheck="false"
                autoFocus
                required
            />
            <div className="spacer-40" />
            <button type="submit" disabled={loading}>Share</button>
            <LoadingError loading={loading} error={error} />
        </form>
    )
}