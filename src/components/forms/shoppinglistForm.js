import React, { useContext, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquare, faSquareCheck } from '@fortawesome/free-regular-svg-icons'
import { faTimesCircle, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons'

import AutosuggestInput from '../utils/autosuggestInput'
import LoadingError from '../utils/loadingError'

import { UserContext } from '../app'

import titleize from '../../functions/titleize'

export default function ShoppinglistForm(props) {
    const { user } = useContext(UserContext)
    const [name, setName] = useState(props.edit ? props.shoppinglist.name : "")
    const [updatesHidden, setUpdatesHidden] = useState(props.editShoppinglist ? props.shoppinglist.updates_hidden : false)
    const [mealplan] = useState(props.editShoppingingredients && props.shoppinglist.mealplan_id ? user.mealplans.filter(mealplan => mealplan.id === props.shoppinglist.mealplan_id)[0] : {})
    const [subshoppinglist] = useState(props.editShoppingingredients && props.shoppinglist.mealplan_id && Object.keys(mealplan.sub_shoppinglist).length > 0 ? mealplan.sub_shoppinglist : { shoppingingredients: [] })
    const [existingMealplanIngredients] = useState(props.editShoppingingredients ? props.shoppinglist.shoppingingredients.filter(ingredient => ingredient.ingredient_id).sort((ingredientA, ingredientB) => ingredientA.id - ingredientB.id).map(ingredient => ({...ingredient})) : [])
    const [ingredients, setIngredients] = useState(props.editShoppingingredients ? props.shoppinglist.shoppingingredients.filter(ingredient => !ingredient.ingredient_id).concat(subshoppinglist.shoppingingredients).sort((ingredientA, ingredientB) => ingredientA.id - ingredientB.id).map(ingredient => ({...ingredient})) : [])
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const initialState = useRef(true)
    useEffect(() => initialState.current = false, [])

    const handleIngredientChangeAmount = (event, ingredient) => {
        ingredient.amount = event.target.value
        setIngredients([...ingredients])
    }

    const handleIngredientChangeUnit = (event, ingredient) => {
        ingredient.unit = event.target.value
        setIngredients([...ingredients])
    }

    const handleIngredientChangeName = (event, ingredient) => {
        ingredient.name = event.target.value
        setIngredients([...ingredients])
    }

    const handleIngredientChangeCategory = (newValue, ingredient) => {
        ingredient.category = newValue
        setIngredients([...ingredients])
    }

    const handleIngredientDelete = index => {
        ingredients.splice(index, 1)
        setIngredients([...ingredients])
    }

    const handleMultiplierChange = (ingredient, change) => {
        ingredient.multiplier = ingredient.multiplier + change
        setIngredients([...ingredients])
    }

    const handleAdd = async event => {
        event.preventDefault()

        setError("")

        if (name === "") {
            setError("Please fill out all required fields.")
        }
        else if (!ingredients.every(ingredient => ingredient.amount.trim().match(/^((\d+)|(\d+([./])\d+)|(\d+[ ]\d+[/]\d+)|((\d+)|(\d+([./])\d+)|(\d+[ ]\d+[/]\d+))[-]((\d+)|(\d+([./])\d+)|(\d+[ ]\d+[/]\d+)))$/))) {
            setError("Ingredient amounts can only be a number, a fraction, or a range.")
        }
        else {
            setLoading(true)

            let newData = []
            let data = await fetch("https://whatsforsupperapi.herokuapp.com/shoppinglist/add", {
                method: "POST",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify({
                    name: titleize(name),
                    updates_hidden: updatesHidden,
                    created_on: new Date().toLocaleDateString(),
                    user_username: user.username,
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
                console.log("Error adding shoppinglist: ", data.catchError)
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

            let ingredientsData = []
            if (ingredients.length > 0) {
                const data = await fetch("https://whatsforsupperapi.herokuapp.com/shoppingingredient/add/multiple", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(ingredients.map(ingredient => {
                        return {
                            name: titleize(ingredient.name),
                            amount: ingredient.amount,
                            unit: ingredient.unit.trim(),
                            category: titleize(ingredient.category),
                            shoppinglist_id: newData.id
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
                    console.log("Error adding shopping ingredient: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    ingredientsData = data.data
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            newData.shoppingingredients = ingredientsData
            props.handleSuccessfulAddShoppinglist(newData)
        }
    }

    const handleEdit = async event => {
        event.preventDefault()

        setError("")

        if (name === "") {
            setError("Please fill out all required fields.")
        }
        else {
            setLoading(true)

            let newData = []
            let data = await fetch(`https://whatsforsupperapi.herokuapp.com/shoppinglist/update/${props.shoppinglist.id}`, {
                method: "PUT",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify({
                    name: titleize(name),
                    updates_hidden: updatesHidden
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
                console.log("Error adding shoppinglist: ", data.catchError)
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

            props.handleSuccessfulSubmit(newData)
        }
    }

    const handleEditIngredients = async event => {
        event.preventDefault()

        setError("")

        if (name === "") {
            setError("Please fill out all required fields.")
        }
        else if (!ingredients.every(ingredient => ingredient.amount.trim().match(/^((\d+)|(\d+([./])\d+)|(\d+[ ]\d+[/]\d+)|((\d+)|(\d+([./])\d+)|(\d+[ ]\d+[/]\d+))[-]((\d+)|(\d+([./])\d+)|(\d+[ ]\d+[/]\d+)))$/))) {
            setError("Ingredient amounts can only be a number, a fraction, or a range.")
        }
        else {
            setLoading(true)

            const updatedMealplanIngredients = existingMealplanIngredients.filter(ingredient => props.shoppinglist.shoppingingredients.filter(ingredient => ingredient.ingredient_id).filter(existingIngredient => existingIngredient.id === ingredient.id)[0].multiplier !== ingredient.multiplier)
            if (updatedMealplanIngredients.length > 0) {
                for (let ingredient of updatedMealplanIngredients) {
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/shoppingingredient/update/${ingredient.id}`, {
                        method: "PUT",
                        headers: { 
                            authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                            "content-type": "application/json" 
                        },
                        body: JSON.stringify({
                            multiplier: ingredient.multiplier
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
                        console.log("Error updating ingredient: ", data.catchError)
                        return false
                    }
                    else if (data.status === 200) {
                        const mealIngredient = user.mealplans.map(mealplan => mealplan.meals.map(meal => meal.recipe.ingredients.map(mealIngredient => mealIngredient))).flat(2).filter(mealIngredient => mealIngredient.id === ingredient.ingredient_id)[0]
                        mealIngredient.shoppingingredients.filter(shoppingingredient => shoppingingredient.id === ingredient.id)[0].multiplier = data.data.multiplier
                        props.shoppinglist.shoppingingredients.splice(props.shoppinglist.shoppingingredients.findIndex(existingIngredient => existingIngredient.id === ingredient.id), 1, data.data)
                    }
                    else {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                        setLoading(false)
                        return false
                    }
                }
            }

            let shoppinglist = props.shoppinglist.mealplan_id ? user.mealplans.filter(mealplan => mealplan.id === props.shoppinglist.mealplan_id)[0].sub_shoppinglist : props.shoppinglist
            if (Object.keys(shoppinglist).length === 0) {
                const data = await fetch("https://whatsforsupperapi.herokuapp.com/shoppinglist/add", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify({
                        name: `${user.mealplans.filter(mealplan => mealplan.id === props.shoppinglist.mealplan_id)[0].name} Mealplan`, 
                        created_on: user.mealplans.filter(mealplan => mealplan.id === props.shoppinglist.mealplan_id)[0].created_on, 
                        updates_hidden: false, 
                        is_sublist: true, 
                        user_username: user.username, 
                        user_id: user.id, 
                        mealplan_id: user.mealplans.filter(mealplan => mealplan.id === props.shoppinglist.mealplan_id)[0].id
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
                    console.log("Error adding sub shoppinglist: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    shoppinglist = data.data
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            const newIngredients = ingredients.filter(ingredient => !ingredient.id)
            const existingIngredients = ingredients.filter(ingredient => shoppinglist.shoppingingredients.filter(existingIngredient => existingIngredient.id === ingredient.id).length > 0)
            const updatedIngredients = existingIngredients.filter(existingIngredient => existingIngredient.amount !== shoppinglist.shoppingingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].amount || existingIngredient.unit !== shoppinglist.shoppingingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].unit || existingIngredient.name !== shoppinglist.shoppingingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].name || existingIngredient.category !== shoppinglist.shoppingingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].category)
            const nonUpdatedIngredients = existingIngredients.filter(existingIngredient => existingIngredient.amount === shoppinglist.shoppingingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].amount && existingIngredient.unit === shoppinglist.shoppingingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].unit && existingIngredient.name === shoppinglist.shoppingingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].name && existingIngredient.category === shoppinglist.shoppingingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].category)
            const deletedIngredients = shoppinglist.shoppingingredients.filter(existingIngredient => ingredients.filter(ingredient => ingredient.id === existingIngredient.id).length === 0)
            let ingredientsData = [...nonUpdatedIngredients]
            if (newIngredients.length > 0) {
                const data = await fetch("https://whatsforsupperapi.herokuapp.com/shoppingingredient/add/multiple", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(newIngredients.map(ingredient => {
                        return {
                            name: titleize(ingredient.name),
                            amount: ingredient.amount,
                            unit: ingredient.unit.trim(),
                            category: titleize(ingredient.category),
                            shoppinglist_id: shoppinglist.id
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
                    console.log("Error adding ingredient: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    ingredientsData = ingredientsData.concat(data.data)
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            if (updatedIngredients.length > 0) {
                for (let ingredient of updatedIngredients) {
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/shoppingingredient/update/${ingredient.id}`, {
                        method: "PUT",
                        headers: { 
                            authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                            "content-type": "application/json" 
                        },
                        body: JSON.stringify({
                            name: titleize(ingredient.name),
                            amount: ingredient.amount,
                            unit: ingredient.unit.trim(),
                            category: titleize(ingredient.category),
                            obtained: false
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
                        console.log("Error updating ingredient: ", data.catchError)
                        return false
                    }
                    else if (data.status === 200) {
                        ingredientsData.push(data.data)
                    }
                    else {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                        setLoading(false)
                        return false
                    }
                }
            }

            if (deletedIngredients.length > 0) {
                for (let ingredient of deletedIngredients) {
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/shoppingingredient/delete/${ingredient.id}`, {
                        method: "DELETE",
                        headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
                    })
                    .then(response => response.json())
                    .catch(error => {
                        return { catchError: error }
                    })  
                    if (data.catchError) {
                        setError("An error occured... Please try again later.")
                        setLoading(false)
                        console.log("Error deleting ingredient: ", data.catchError)
                        return false
                    }
                    else if (data.status !== 200) {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                        setLoading(false)
                        return false
                    }
                }
            }

            shoppinglist.shoppingingredients = ingredientsData
            if (shoppinglist.is_sublist && ingredientsData.length === 0) {
                const data = await fetch(`https://whatsforsupperapi.herokuapp.com/shoppinglist/delete/${shoppinglist.id}`, {
                    method: "DELETE",
                    headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
                })
                .then(response => response.json())
                .catch(error => {
                    return { catchError: error }
                })  
                if (data.catchError) {
                    setError("An error occured... Please try again later.")
                    setLoading(false)
                    console.log("Error deleting shoppinglist: ", data.catchError)
                    return false
                }
                else if (data.status !== 200) {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            props.handleSuccessfulSubmit(shoppinglist)
        }
    }

    const renderExistingMealplanIngredients = () => {
        return (
            <div className="existing-ingredients-wrapper">
                <h5>Mealplan Items</h5>
                {
                    existingMealplanIngredients.map(ingredient => (
                        <div className="existing-ingredient-wrapper" key={`ingredient-${ingredient.id}`}>
                            <p className='ingredient-amount'>{ingredient.amount}{ingredient.unit ? ` ${ingredient.unit}` : null}</p>
                            <p className='ingredient-name'>{ingredient.name}</p>
                            <div className="multiplier-wrapper">
                                <button type='button' className='icon-button' disabled={loading || ingredient.multiplier <= 1} onClick={() => handleMultiplierChange(ingredient, -1)}><FontAwesomeIcon icon={faCaretLeft} /></button>
                                <p className={`multiplier ${loading ? "disabled" : null}`}>x{ingredient.multiplier}</p>
                                <button type='button' className='icon-button' disabled={loading || ingredient.multiplier >=9} onClick={() => handleMultiplierChange(ingredient, 1)}><FontAwesomeIcon icon={faCaretRight} /></button>
                            </div>
                        </div>
                    ))
                }
            </div>
        )
    }

    return (
        <form className='form-wrapper shoppinglist-form-wrapper'
            onSubmit={props.editShoppinglist ? handleEdit : props.editShoppingingredients ? handleEditIngredients : handleAdd}
            autoComplete="off"
        >
            <h3>{props.editShoppinglist ? "Edit Shopping List" : props.editShoppingingredients ? props.shoppinglist.name : "Add a Shopping List"}</h3>
            {!props.editShoppingingredients
                ? (
                    <input type="text" 
                        value={name}
                        placeholder="Shopping list name"
                        onChange={event => setName(event.target.value)}
                        autoCapitalize="on"
                        spellCheck="false"
                        autoFocus
                        required
                    />
                )
                : null
            }
            {!props.editShoppingingredients
                ? (
                    <label className='checkbox'>
                        Contains Gifts
                        <input type="checkbox" 
                            checked={updatesHidden}
                            onChange={event => setUpdatesHidden(event.target.checked)} 
                        />
                        <span>{updatesHidden ? <FontAwesomeIcon icon={faSquareCheck} /> : <FontAwesomeIcon icon={faSquare} />}</span>
                    </label>
                )
                : null
            }
            {!props.editShoppinglist ? <h4>Shopping Items</h4> : null}
            {!props.editShoppinglist
                ? (
                    <div className="ingredients-wrapper">
                        {props.editShoppingingredients && props.shoppinglist.mealplan_id ? renderExistingMealplanIngredients() : null}
                        {props.editShoppingingredients && props.shoppinglist.mealplan_id ? <h5>Added Items</h5> : null}
                        {ingredients.map((ingredient, index) => (
                            <div className="ingredient-wrapper" key={`ingredient-${index}`}>
                                <button type='button' disabled={loading} className='icon-button' onClick={() => handleIngredientDelete(index)}><FontAwesomeIcon icon={faTimesCircle} /></button>
                                <input type="text" 
                                    value={ingredient.amount}
                                    placeholder="Amount"
                                    onChange={event => handleIngredientChangeAmount(event, ingredient)}
                                    autoFocus={!initialState.current}
                                    required
                                />
                                <input type="text" 
                                    value={ingredient.unit}
                                    placeholder="Unit of Measurement (optional)"
                                    onChange={event => handleIngredientChangeUnit(event, ingredient)}
                                    autoCapitalize="off"
                                    spellCheck="false"
                                />
                                <input type="text"
                                    value={ingredient.name}
                                    placeholder="Name"
                                    onChange={event => handleIngredientChangeName(event, ingredient)}
                                    autoCapitalize="on"
                                    spellCheck="false"
                                    required
                                />
                                <AutosuggestInput
                                    input={ingredient.category}
                                    setInput={newValue => handleIngredientChangeCategory(newValue, ingredient)}
                                    suggestions={[...user.meals.map(meal => meal.recipe.ingredients.map(ingredient => ingredient.category)).flat(), ...user.shoppinglists.map(shoppinglist => shoppinglist.shoppingingredients.map(ingredient => ingredient.category)).flat()].filter((ingredient, index, self) => self.indexOf(ingredient) === index && ingredient !== "")}
                                    placeholder="Category: produce, dairy, etc. (Optional)"
                                    autoCapitalize="on"
                                    spellCheck="false"
                                />
                            </div>
                        ))}
                        <button type='button' disabled={loading} className='alt-button' onClick={() => setIngredients([...ingredients, { amount: "", unit: "", name: "", category: "" }])}>Add Item</button>
                    </div>
                )
                : null
            }
            <div className='spacer-40' />
            <button type="submit" disabled={loading}>{props.editShoppinglist ? "Edit Shopping List" : props.editShoppingingredients ? "Edit Items" : "Add Shopping List"}</button>
            <LoadingError loading={loading} error={error} />
        </form>
    )
}