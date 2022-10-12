import React, { useContext, useState } from 'react'

import { UserContext } from '../app'

import LoadingError from '../utils/loadingError'

import titleize from '../../functions/titleize'

export default function CategoryForm(props) {
    const { user, setUser } = useContext(UserContext)
    const [name, setName] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = event => {
        event.preventDefault()

        setError("")

        if (name === "") {
            setError("Please fill out all required fields.")
        }
        else {
            setLoading(true)

            fetch("https://whatsforsupperapi.herokuapp.com/category/add", {
                method: "POST",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify({
                    name: titleize(name),
                    user_id: user.id
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    props.handleSuccessfulAdd(data.data)
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                }
            })
            .catch(error => {
                setError("An error occured... Please try again later.")
                console.log("Error adding category: ", error)
                setLoading(false)
            })
        }
    }

    return (
        <form className='form-wrapper category-form-wrapper'
            onSubmit={handleSubmit}
            autoComplete="off"
        >
            <h3>Add a Meal Category</h3>
            <input type="text" 
                value={name}
                placeholder="Category name"
                onChange={event => setName(event.target.value)}
                autoCapitalize="on"
                spellCheck="false"
                autoFocus
                required
            />
            <div className='spacer-40' />
            <button type="submit" disabled={loading}>Add Meal Category</button>
            <LoadingError loading={loading} error={error} />
        </form>
    )
}