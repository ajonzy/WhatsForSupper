import React, { useContext, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUpload, faTimesCircle, faCircleXmark } from '@fortawesome/free-solid-svg-icons'
import TextareaAutosize from 'react-textarea-autosize'

import AutosuggestInput from '../utils/autosuggestInput'
import LoadingError from '../utils/loadingError'

import { UserContext } from '../app'

import titleize from '../../functions/titleize'

export default function MealForm(props) {
    const { user } = useContext(UserContext)
    const [name, setName] = useState(props.edit ? props.meal.name : "")
    const [difficulty, setDifficulty] = useState(props.edit ? props.meal.difficulty : 0)
    const [description, setDescription] = useState(props.edit ? props.meal.description : "")
    const [image, setImage] = useState(props.edit ? props.meal.image_url : null)
    const [categories, setCategories] = useState(props.edit ? props.meal.categories.map(category => category.name) : [])
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const initialState = useRef(true)
    useEffect(() => initialState.current = false, [])

    const handleDifficultyChange = newDifficulty => {
        setDifficulty(newDifficulty === difficulty ? 0 : newDifficulty)
    }

    const handleImageUpload = event => {
        if (event.target.files && event.target.files[0]) {
            const file = new FileReader()
            let img = event.target.files[0]
            file.onload = () => setImage(file.result)
            file.readAsDataURL(img)
        }
    }

    const handleImageRemove = event => {
        event.preventDefault()

        setImage(null)
        const target = event.target.parentElement.parentElement.parentElement.children[0]
        target.value = null
    }

    const handleAdd = async event => {
        event.preventDefault()

        setError("")
        
        if (name === "" || categories.filter(category => category === "").length > 0) {
            setError("Please fill out all required fields (including open categories).")
        }
        else {
            setLoading(true)

            let image_url = null
            if (image) {
                const form = new FormData()
                form.append("file", image)
                form.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET)

                let data = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_NAME}/image/upload`, {
                    method: "POST",
                    body: form
                })
                .then(response => response.json())
                .catch(error => {
                    return { catchError: error }
                })
                if (data.error) {
                    console.log(data.error.message)
                    setError("An error occured... Please try again later.")
                    setLoading(false)
                    return false
                }
                else if (data.catchError) {
                    setError("An error occured... Please try again later.")
                    setLoading(false)
                    console.log("Error adding meal image: ", data.catchError)
                    return false
                }
                else {
                    image_url = data.url
                }
            }

            let newData = {}
            let data = await fetch("https://whatsforsupperapi.herokuapp.com/meal/add", {
                method: "POST",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify({
                    name: titleize(name),
                    difficulty,
                    description: titleize(description),
                    image_url,
                    owner_username: user.username,
                    user_id: user.id
                })
            })
            .then(response => response.json())
            .catch(error => {
                return { catchError: error }
            })
            if (data.status === 400) {
                setError("An error occured... Please try again later.")
                console.log(data)
                setLoading(false)
                return false
            }
            else if (data.catchError) {
                setError("An error occured... Please try again later.")
                setLoading(false)
                console.log("Error adding meal: ", data.catchError)
                return false
            }
            else if (data.status === 200) {
                newData = data.data
            }
            else {
                setError("An error occured... Please try again later.")
                console.log(data)
                setLoading(false)
                return false
            }

            const formmattedCategories = categories.map(category => titleize(category))
            const newCategories = formmattedCategories.filter(category => !user.categories.map(category => category.name).includes(category))
            const existingCategories = user.categories.filter(category => formmattedCategories.includes(category.name))
            const categoryData = [...existingCategories]
            if (newCategories.length > 0) {
                data = await fetch("https://whatsforsupperapi.herokuapp.com/category/add/multiple", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(newCategories.map(category => {
                        return {
                            name: titleize(category),
                            user_id: user.id
                        }
                    }))
                })
                .then(response => response.json())
                .catch(error => {
                    return { catchError: error }
                }) 
                if (data.status === 400) {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
                else if (data.catchError) {
                    setError("An error occured... Please try again later.")
                    setLoading(false)
                    console.log("Error adding category: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    user.categories.push(...data.data)
                    categoryData.push(...data.data)
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            if (categoryData.length > 0) {
                data = await fetch("https://whatsforsupperapi.herokuapp.com/category/attach/multiple", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(categoryData.map(category => {
                        return {
                            meal_id: newData.id,
                            category_id: category.id
                        }
                    }))
                })
                .then(response => response.json())
                .catch(error => {
                    return { catchError: error }
                })  
                if (data.status === 400) {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
                else if (data.catchError) {
                    setError("An error occured... Please try again later.")
                    setLoading(false)
                    console.log("Error adding category: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    newData = data.data.meals[0]
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            props.handleSuccessfulSubmit(newData)
        }
    }

    const handleEdit = async event => {
        event.preventDefault()

        setError("")
        
        if (name === "" || categories.filter(category => category === "").length > 0) {
            setError("Please fill out all required fields (including open categories).")
        }
        else {
            setLoading(true)

            let image_url = image
            if (image && image !== props.meal.image_url) {
                const form = new FormData()
                form.append("file", image)
                form.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET)

                let data = await fetch(`https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_NAME}/image/upload`, {
                    method: "POST",
                    body: form
                })
                .then(response => response.json())
                .catch(error => {
                    return { catchError: error }
                })
                if (data.error) {
                    console.log(data.error.message)
                    setError("An error occured... Please try again later.")
                    setLoading(false)
                    return false
                }
                else if (data.catchError) {
                    setError("An error occured... Please try again later.")
                    setLoading(false)
                    console.log("Error adding meal image: ", data.catchError)
                    return false
                }
                else {
                    image_url = data.url
                }
            }

            let newData = {}
            let data = await fetch(`https://whatsforsupperapi.herokuapp.com/meal/update/${props.meal.id}`, {
                method: "PUT",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify({
                    name: titleize(name),
                    difficulty,
                    description: titleize(description),
                    image_url
                })
            })
            .then(response => response.json())
            .catch(error => {
                return { catchError: error }
            })
            if (data.status === 400) {
                setError("An error occured... Please try again later.")
                console.log(data)
                setLoading(false)
                return false
            }
            else if (data.catchError) {
                setError("An error occured... Please try again later.")
                setLoading(false)
                console.log("Error updating meal: ", data.catchError)
                return false
            }
            else if (data.status === 200) {
                newData = data.data
            }
            else {
                setError("An error occured... Please try again later.")
                console.log(data)
                setLoading(false)
                return false
            }

            const attachedCategories = props.meal.categories.map(category => category.name)
            const formmattedCategories = categories.map(category => titleize(category))
            const newCategories = formmattedCategories.filter(category => !user.categories.map(category => category.name).includes(category))
            const existingCategories = user.categories.filter(category => formmattedCategories.includes(category.name)).filter(category => !attachedCategories.includes(category))
            const removedCategories = props.meal.categories.filter(category => !categories.includes(category.name))
            const categoryData = [...existingCategories]
            if (newCategories.length > 0) {
                data = await fetch("https://whatsforsupperapi.herokuapp.com/category/add/multiple", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(newCategories.map(category => {
                        return {
                            name: titleize(category),
                            user_id: user.id
                        }
                    }))
                })
                .then(response => response.json())
                .catch(error => {
                    return { catchError: error }
                }) 
                if (data.status === 400) {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
                else if (data.catchError) {
                    setError("An error occured... Please try again later.")
                    setLoading(false)
                    console.log("Error adding category: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    user.categories.push(...data.data)
                    categoryData.push(...data.data)
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            if (categoryData.length > 0) {
                data = await fetch("https://whatsforsupperapi.herokuapp.com/category/attach/multiple", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(categoryData.map(category => {
                        return {
                            meal_id: newData.id,
                            category_id: category.id
                        }
                    }))
                })
                .then(response => response.json())
                .catch(error => {
                    return { catchError: error }
                })  
                if (data.status === 400) {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
                else if (data.catchError) {
                    setError("An error occured... Please try again later.")
                    setLoading(false)
                    console.log("Error adding category: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    newData = data.data.meals[0]
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            if (removedCategories.length > 0) {
                data = await fetch("https://whatsforsupperapi.herokuapp.com/category/unattach/multiple", {
                    method: "DELETE",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(removedCategories.map(category => {
                        return {
                            meal_id: newData.id,
                            category_id: category.id
                        }
                    }))
                })
                .then(response => response.json())
                .catch(error => {
                    return { catchError: error }
                })  
                if (data.status === 400) {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
                else if (data.catchError) {
                    setError("An error occured... Please try again later.")
                    setLoading(false)
                    console.log("Error adding category: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    newData = data.data.meals[0]
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            props.handleSuccessfulSubmit(newData)
        }
    }

    return (
        <form className='form-wrapper meal-form-wrapper'
            onSubmit={props.edit ? handleEdit : handleAdd}
            autoComplete="off"
        >
            <h3>{props.edit ? `Edit ${props.meal.name}` : "Add a Meal"}</h3>
            <input type="text" 
                value={name}
                placeholder="Meal name"
                onChange={event => setName(event.target.value)}
                autoCapitalize="on"
                spellCheck="false"
                autoFocus
                required
            />
            <TextareaAutosize
                value={description}
                placeholder="Description (optional)"
                onChange={event => setDescription(event.target.value)}
                minRows="6"
                autoCapitalize="on"
                spellCheck="true"
            />
            <div className="difficulty-wrapper">
                <label>Difficuly (optional)</label>
                <div className="difficulty-stars-wrapper">
                    <span className={`difficulty difficulty-${difficulty >= 1 ? "active" : "inactive"}`}
                        onClick={() => handleDifficultyChange(1)}
                    >★</span>
                    <span className={`difficulty difficulty-${difficulty >= 2 ? "active" : "inactive"}`}
                        onClick={() => handleDifficultyChange(2)}
                    >★</span>
                    <span className={`difficulty difficulty-${difficulty >= 3 ? "active" : "inactive"}`}
                        onClick={() => handleDifficultyChange(3)}
                    >★</span>
                    <span className={`difficulty difficulty-${difficulty >= 4 ? "active" : "inactive"}`}
                        onClick={() => handleDifficultyChange(4)}
                    >★</span>
                    <span className={`difficulty difficulty-${difficulty >= 5 ? "active" : "inactive"}`}
                        onClick={() => handleDifficultyChange(5)}
                    >★</span>
                </div>
            </div>
            <div className="image-wrapper">
                <label>
                    Image (optional)
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: "none" }} 
                    />
                    <div className="options-wrapper">
                        {image ? null : <FontAwesomeIcon icon={faUpload} />}
                        {image ? <FontAwesomeIcon icon={faTimesCircle} onClick={handleImageRemove} /> : null}
                    </div>
                </label>
                <img src={image} alt=""/>
            </div>
            <div className="categories-wrapper">
                <label>Categories (optional)</label>
                {categories.map((category, index) => (
                    <div className="category-wrapper" key={`category-${index}`}>
                        <AutosuggestInput
                            input={category}
                            setInput={newValue => setCategories(categories.map((existingCategory, existingIndex) => existingIndex === index ? newValue : existingCategory))}
                            suggestions={user.categories.map(category => category.name)}
                            placeholder="Category name"
                            autoCapitalize="on"
                            spellCheck="false"
                            autoFocus={!initialState.current}
                            required
                        />
                        
                        <button type='button' disabled={loading} className='icon-button' onClick={() => setCategories(categories.filter((_, existingIndex) => existingIndex !== index))}><FontAwesomeIcon icon={faTimesCircle} /></button>
                    </div>
                ))}
                <button type='button' disabled={loading} className='alt-button' onClick={() => setCategories([...categories, ""])}>Add Category</button>
            </div>
            <div className='spacer-40' />
            <button type="submit" disabled={loading}>{props.edit ? "Edit Meal" : "Add Meal"}</button>
            <LoadingError loading={loading} error={error} />
        </form>
    )
}