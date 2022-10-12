import React, { useContext, useEffect, useRef, useState } from 'react'
import TextareaAutosize from 'react-textarea-autosize'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons'

import AutosuggestInput from '../utils/autosuggestInput'
import LoadingError from '../utils/loadingError'

import titleize from '../../functions/titleize'

import { UserContext } from '../app'

export default function RecipeForm(props) {
    if (props.edit) {
        props.meal.recipe.steps.sort((stepA, stepB) => stepA.id - stepB.id)
        props.meal.recipe.stepsections.sort((stepsectionA, stepsectionB) => stepsectionA.id - stepsectionB.id)
        props.meal.recipe.ingredients.sort((ingredientA, ingredientB) => ingredientA.id - ingredientB.id)
        props.meal.recipe.ingredientsections.sort((ingredientsectionA, ingredientsectionB) => ingredientsectionA.id - ingredientsectionB.id)
    }

    const { user } = useContext(UserContext)
    const [steps, setSteps] = useState(props.edit ? props.meal.recipe.steps.map(step => ({...step, stepsection: step.stepsection_id ? props.meal.recipe.stepsections.findIndex(stepsection => stepsection.id === step.stepsection_id) : undefined })) : [])
    const [stepsections, setStepsections] = useState(props.edit ? props.meal.recipe.stepsections.map(stepsection => ({...stepsection})) : [])
    const [ingredients, setIngredients] = useState(props.edit ? props.meal.recipe.ingredients.map(ingredient => ({...ingredient, ingredientsection: ingredient.ingredientsection_id ? props.meal.recipe.ingredientsections.findIndex(ingredientsection => ingredientsection.id === ingredient.ingredientsection_id) : undefined })) : [])
    const [ingredientsections, setIngredientsections] = useState(props.edit ? props.meal.recipe.ingredientsections.map(ingredientsection => ({...ingredientsection})) : [])
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const initialState = useRef(true)
    useEffect(() => initialState.current = false, [])

    const handleStepChange = (event, step) => {
        step.text = event.target.value
        setSteps([...steps])
    }

    const handleStepDelete = step => {
        const index = steps.indexOf(step)
        steps.splice(index, 1)
        setSteps([...steps])
    }

    const handleStepsectionChange = (event, stepsection) => {
        stepsection.title = event.target.value
        setStepsections([...stepsections])
    }

    const handleStepsectionDelete = index => {
        stepsections.splice(index, 1)
        setStepsections([...stepsections])
        setSteps(steps.filter(step => step.stepsection !== index))
    }

    const handleIngredientChangeAmount = (event, ingredient) => {
        ingredient = ingredients[ingredient.index]
        ingredient.amount = event.target.value
        setIngredients([...ingredients])
    }

    const handleIngredientChangeUnit = (event, ingredient) => {
        ingredient = ingredients[ingredient.index]
        ingredient.unit = event.target.value
        setIngredients([...ingredients])
    }

    const handleIngredientChangeName = (event, ingredient) => {
        ingredient = ingredients[ingredient.index]
        ingredient.name = event.target.value
        setIngredients([...ingredients])
    }

    const handleIngredientChangeCategory = (newValue, ingredient) => {
        ingredient = ingredients[ingredient.index]
        ingredient.category = newValue
        setIngredients([...ingredients])
    }

    const handleIngredientDelete = index => {
        ingredients.splice(index, 1)
        setIngredients([...ingredients])
    }

    const handleIngredientsectionChange = (event, ingredientsection) => {
        ingredientsection.title = event.target.value
        setIngredientsections([...ingredientsections])
    }

    const handleIngredientsectionDelete = index => {
        ingredientsections.splice(index, 1)
        setIngredientsections([...ingredientsections])

        const remainingIngredients = ingredients.filter(ingredient => ingredient.ingredientsection !== index)
        remainingIngredients.filter(ingredient => ingredient.ingredientsection > index).forEach(ingredient => ingredient.ingredientsection--)
        setIngredients([...remainingIngredients])
    }

    const handleAdd = async event => {
        event.preventDefault()

        setError("")

        if (
            !stepsections.every(stepsectionA => stepsections.filter(stepsectionB => stepsectionA.title === stepsectionB.title).length === 1) ||
            !ingredientsections.every(ingredientsectionA => ingredientsections.filter(ingredientsectionB => ingredientsectionA.title === ingredientsectionB.title).length === 1) 
        ) {
            setError("Each section must have a unique title.")
        }
        else if (!ingredients.every(ingredient => ingredient.amount.trim().match(/^((\d+)|(\d+([./])\d+)|(\d+[ ]\d+[/]\d+)|((\d+)|(\d+([./])\d+)|(\d+[ ]\d+[/]\d+))[-]((\d+)|(\d+([./])\d+)|(\d+[ ]\d+[/]\d+)))$/))) { // Regular expression to check for: (a single number) | (a decimal number or simple fraction) | (a complex fraction) | (a range between any of the first 3 options)
            setError("Ingredient amounts can only be a number, a fraction, or a range.")
        }
        else {
            setLoading(true)

            const capitalize = string => string.length > 0 ? string[0].toUpperCase() + string.slice(1) : ""

            let stepsectionsData = []
            if (stepsections.length > 0) {
                const data = await fetch("https://whatsforsupperapi.herokuapp.com/stepsection/add/multiple", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(stepsections.map(stepsection => {
                        return {
                            title: titleize(stepsection.title),
                            recipe_id: props.meal.recipe.id
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
                    console.log("Error adding stepsection: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    stepsectionsData = data.data
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            let stepsData = []
            if (steps.length > 0) {
                let count = 0
                let formattedSteps = steps.filter(step => step.stepsection === undefined).map(step => {
                    count++
                    return { ...step, number: count }
                })

                stepsections.forEach((stepsection, index) => {
                    const stepsectionData = stepsectionsData.filter(stepsectionData => stepsectionData.title === titleize(stepsection.title))[0]
                    let count = 0
                    formattedSteps = formattedSteps.concat(steps.filter(step => step.stepsection === index).map(step => {
                        count++
                        return { ...step, number: count, stepsection_id: stepsectionData.id }
                    }))
                })

                const data = await fetch("https://whatsforsupperapi.herokuapp.com/step/add/multiple", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(formattedSteps.map(step => {
                        return {
                            number: step.number,
                            text: capitalize(step.text).trim(),
                            stepsection_id: step.stepsection_id,
                            recipe_id: props.meal.recipe.id
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
                    console.log("Error adding step: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    stepsData = data.data
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            let ingredientsectionsData = []
            if (ingredientsections.length > 0) {
                const data = await fetch("https://whatsforsupperapi.herokuapp.com/ingredientsection/add/multiple", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(ingredientsections.map(ingredientsection => {
                        return {
                            title: titleize(ingredientsection.title),
                            recipe_id: props.meal.recipe.id
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
                    console.log("Error adding ingredientsection: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    ingredientsectionsData = data.data
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            let ingredientsData = []
            if (ingredients.length > 0) {
                const formmattedIngredients = [...ingredients.filter(ingredient => ingredient.ingredientsection === undefined)]

                ingredientsections.forEach((ingredientsection, index) => {
                    const ingredientsectionData = ingredientsectionsData.filter(ingredientsectionData => ingredientsectionData.title === titleize(ingredientsection.title))[0]
                    formmattedIngredients.push(...ingredients.filter(ingredient => ingredient.ingredientsection === index).map(ingredient => ({ ...ingredient, ingredientsection_id: ingredientsectionData.id })))
                })

                const data = await fetch("https://whatsforsupperapi.herokuapp.com/ingredient/add/multiple", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(formmattedIngredients.map(ingredient => {
                        return {
                            name: titleize(ingredient.name),
                            amount: ingredient.amount,
                            unit: ingredient.unit.trim(),
                            category: titleize(ingredient.category),
                            ingredientsection_id: ingredient.ingredientsection_id,
                            recipe_id: props.meal.recipe.id
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
                    ingredientsData = data.data
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            const meal = props.meal
            stepsData.forEach(step => {
                if (step.stepsection_id) {
                    stepsectionsData.filter(stepsection => stepsection.id === step.stepsection_id)[0].steps.push(step)
                }
            })
            ingredientsData.forEach(ingredient => {
                if (ingredient.ingredientsection_id) {
                    ingredientsectionsData.filter(ingredientsection => ingredientsection.id === ingredient.ingredientsection_id)[0].ingredients.push(ingredient)
                }
            })
            meal.recipe.stepsections = stepsectionsData
            meal.recipe.steps = stepsData
            meal.recipe.ingredientsections = ingredientsectionsData
            meal.recipe.ingredients = ingredientsData
            
            props.handleSuccessfulSubmit(meal)
        } 
    }

    const handleEdit = async event => {
        event.preventDefault()

        setError("")

        if (
            !stepsections.every(stepsectionA => stepsections.filter(stepsectionB => stepsectionA.title === stepsectionB.title).length === 1) ||
            !ingredientsections.every(ingredientsectionA => ingredientsections.filter(ingredientsectionB => ingredientsectionA.title === ingredientsectionB.title).length === 1)
        ) {
            setError("Each section must have a unique title.")
        }
        else if (!ingredients.every(ingredient => ingredient.amount.trim().match(/^((\d+)|(\d+([./])\d+)|(\d+[ ]\d+[/]\d+)|((\d+)|(\d+([./])\d+)|(\d+[ ]\d+[/]\d+))[-]((\d+)|(\d+([./])\d+)|(\d+[ ]\d+[/]\d+)))$/))) {
            setError("Ingredient amounts can only be a number, a fraction, or a range.")
        }
        else {
            setLoading(true)

            const capitalize = string => string.length > 0 ? string[0].toUpperCase() + string.slice(1) : ""

            const newStepsections = stepsections.filter(stepsection => !stepsection.id)
            const existingStepsections = stepsections.filter(stepsection => props.meal.recipe.stepsections.filter(existingStepsection => existingStepsection.id === stepsection.id).length > 0)
            const updatedStepsections = existingStepsections.filter(existingStepsection => existingStepsection.title !== props.meal.recipe.stepsections.filter(stepsection => stepsection.id === existingStepsection.id)[0].title)
            const nonUpdatedStepsections = existingStepsections.filter(existingStepsection => existingStepsection.title === props.meal.recipe.stepsections.filter(stepsection => stepsection.id === existingStepsection.id)[0].title)
            const deletedStepsections = props.meal.recipe.stepsections.filter(existingStepsection => stepsections.filter(stepsection => stepsection.id === existingStepsection.id).length === 0)
            let stepsectionsData = [...nonUpdatedStepsections]
            if (newStepsections.length > 0) {
                const data = await fetch("https://whatsforsupperapi.herokuapp.com/stepsection/add/multiple", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(newStepsections.map(stepsection => {
                        return {
                            title: titleize(stepsection.title),
                            recipe_id: props.meal.recipe.id
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
                    console.log("Error adding stepsection: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    stepsectionsData = stepsectionsData.concat(data.data)
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            if (updatedStepsections.length > 0) {
                for (let stepsection of updatedStepsections) {
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/stepsection/update/${stepsection.id}`, {
                        method: "PUT",
                        headers: { 
                            authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                            "content-type": "application/json" 
                        },
                        body: JSON.stringify({
                            title: titleize(stepsection.title)
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
                        console.log("Error updating stepsection: ", data.catchError)
                        return false
                    }
                    else if (data.status === 200) {
                        stepsectionsData.push(data.data)
                    }
                    else {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                        setLoading(false)
                        return false
                    }
                }
            }

            if (deletedStepsections.length > 0) {
                for (let stepsection of deletedStepsections) {
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/stepsection/delete/${stepsection.id}`, {
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
                        console.log("Error deleting stepsection: ", data.catchError)
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

            let count = 0
            let formattedSteps = steps.filter(step => step.stepsection === undefined).map(step => {
                count++
                return { ...step, number: count }
            })

            stepsections.forEach((stepsection, index) => {
                const stepsectionData = stepsectionsData.filter(stepsectionData => stepsectionData.title === titleize(stepsection.title))[0]
                let count = 0
                formattedSteps = formattedSteps.concat(steps.filter(step => step.stepsection === index).map(step => {
                    count++
                    return { ...step, number: count, stepsection_id: stepsectionData.id }
                }))
            })

            const newSteps = formattedSteps.filter(step => !step.id)
            const existingSteps = formattedSteps.filter(step => props.meal.recipe.steps.filter(existingStep => existingStep.id === step.id).length > 0)
            const updatedSteps = existingSteps.filter(existingStep => existingStep.text !== props.meal.recipe.steps.filter(step => step.id === existingStep.id)[0].text || existingStep.number !== props.meal.recipe.steps.filter(step => step.id === existingStep.id)[0].number)
            const nonUpdatedSteps = existingSteps.filter(existingStep => existingStep.text === props.meal.recipe.steps.filter(step => step.id === existingStep.id)[0].text && existingStep.number === props.meal.recipe.steps.filter(step => step.id === existingStep.id)[0].number)
            const deletedSteps = props.meal.recipe.steps.filter(existingStep => formattedSteps.filter(step => step.id === existingStep.id).length === 0).filter(step => !deletedStepsections.map(stepsection => stepsection.id).includes(step.stepsection_id))
            let stepsData = [...nonUpdatedSteps]
            if (newSteps.length > 0) {
                let count = existingSteps.filter(step => step.stepsection === undefined).length
                let formattedSteps = newSteps.filter(step => step.stepsection === undefined).map(step => {
                    count++
                    return { ...step, number: count }
                })

                stepsections.forEach((stepsection, index) => {
                    const stepsectionData = stepsectionsData.filter(stepsectionData => stepsectionData.title === titleize(stepsection.title))[0]
                    let count = existingSteps.filter(step => step.stepsection === index).length
                    formattedSteps = formattedSteps.concat(newSteps.filter(step => step.stepsection === index).map(step => {
                        count++
                        return { ...step, number: count, stepsection_id: stepsectionData.id }
                    }))
                })

                const data = await fetch("https://whatsforsupperapi.herokuapp.com/step/add/multiple", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(formattedSteps.map(step => {
                        return {
                            number: step.number,
                            text: capitalize(step.text).trim(),
                            stepsection_id: step.stepsection_id,
                            recipe_id: props.meal.recipe.id
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
                    console.log("Error adding step: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    stepsData = stepsData.concat(data.data)
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            if (updatedSteps.length > 0) {
                for (let step of updatedSteps) {
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/step/update/${step.id}`, {
                        method: "PUT",
                        headers: { 
                            authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                            "content-type": "application/json" 
                        },
                        body: JSON.stringify({
                            number: step.number,
                            text: capitalize(step.text).trim()
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
                        console.log("Error updating step: ", data.catchError)
                        return false
                    }
                    else if (data.status === 200) {
                        stepsData.push(data.data)
                    }
                    else {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                        setLoading(false)
                        return false
                    }
                }
            }

            if (deletedSteps.length > 0) {
                for (let step of deletedSteps) {
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/step/delete/${step.id}`, {
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
                        console.log("Error deleting step: ", data.catchError)
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

            const newIngredientsections = ingredientsections.filter(ingredientsection => !ingredientsection.id)
            const existingIngredientsections = ingredientsections.filter(ingredientsection => props.meal.recipe.ingredientsections.filter(existingIngredientsection => existingIngredientsection.id === ingredientsection.id).length > 0)
            const updatedIngredientsections = existingIngredientsections.filter(existingIngredientsection => existingIngredientsection.title !== props.meal.recipe.ingredientsections.filter(ingredientsection => ingredientsection.id === existingIngredientsection.id)[0].title)
            const nonUpdatedIngredientsections = existingIngredientsections.filter(existingIngredientsection => existingIngredientsection.title === props.meal.recipe.ingredientsections.filter(ingredientsection => ingredientsection.id === existingIngredientsection.id)[0].title)
            const deletedIngredientsections = props.meal.recipe.ingredientsections.filter(existingIngredientsection => ingredientsections.filter(ingredientsection => ingredientsection.id === existingIngredientsection.id).length === 0)
            let ingredientsectionsData = [...nonUpdatedIngredientsections]
            if (newIngredientsections.length > 0) {
                const data = await fetch("https://whatsforsupperapi.herokuapp.com/ingredientsection/add/multiple", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify(newIngredientsections.map(ingredientsection => {
                        return {
                            title: titleize(ingredientsection.title),
                            recipe_id: props.meal.recipe.id
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
                    console.log("Error adding ingredientsection: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    ingredientsectionsData = ingredientsectionsData.concat(data.data)
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            if (updatedIngredientsections.length > 0) {
                for (let ingredientsection of updatedIngredientsections) {
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/ingredientsection/update/${ingredientsection.id}`, {
                        method: "PUT",
                        headers: { 
                            authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                            "content-type": "application/json" 
                        },
                        body: JSON.stringify({
                            title: titleize(ingredientsection.title)
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
                        console.log("Error updating ingredientsection: ", data.catchError)
                        return false
                    }
                    else if (data.status === 200) {
                        ingredientsectionsData.push(data.data)
                    }
                    else {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                        setLoading(false)
                        return false
                    }
                }
            }

            if (deletedIngredientsections.length > 0) {
                for (let ingredientsection of deletedIngredientsections) {
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/ingredientsection/delete/${ingredientsection.id}`, {
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
                        console.log("Error deleting ingredientsection: ", data.catchError)
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

            const formmattedIngredients = [...ingredients.filter(ingredient => ingredient.ingredientsection === undefined)]

            ingredientsections.forEach((ingredientsection, index) => {
                const ingredientsectionData = ingredientsectionsData.filter(ingredientsectionData => ingredientsectionData.title === titleize(ingredientsection.title))[0]
                formmattedIngredients.push(...ingredients.filter(ingredient => ingredient.ingredientsection === index).map(ingredient => ({ ...ingredient, ingredientsection_id: ingredientsectionData.id })))
            })

            const newIngredients = formmattedIngredients.filter(ingredient => !ingredient.id)
            const existingIngredients = formmattedIngredients.filter(ingredient => props.meal.recipe.ingredients.filter(existingIngredient => existingIngredient.id === ingredient.id).length > 0)
            const updatedIngredients = existingIngredients.filter(existingIngredient => existingIngredient.amount !== props.meal.recipe.ingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].amount || existingIngredient.unit !== props.meal.recipe.ingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].unit || existingIngredient.name !== props.meal.recipe.ingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].name || existingIngredient.category !== props.meal.recipe.ingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].category)
            const nonUpdatedIngredients = existingIngredients.filter(existingIngredient => existingIngredient.amount === props.meal.recipe.ingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].amount && existingIngredient.unit === props.meal.recipe.ingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].unit && existingIngredient.name === props.meal.recipe.ingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].name && existingIngredient.category === props.meal.recipe.ingredients.filter(ingredient => ingredient.id === existingIngredient.id)[0].category)
            const deletedIngredients = props.meal.recipe.ingredients.filter(existingIngredient => formmattedIngredients.filter(ingredient => ingredient.id === existingIngredient.id).length === 0).filter(ingredient => !deletedIngredientsections.map(ingredientsection => ingredientsection.id).includes(ingredient.ingredientsection_id))
            let ingredientsData = [...nonUpdatedIngredients]
            if (newIngredients.length > 0) {
                const data = await fetch("https://whatsforsupperapi.herokuapp.com/ingredient/add/multiple", {
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
                            ingredientsection_id: ingredient.ingredientsection_id,
                            recipe_id: props.meal.recipe.id
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
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/ingredient/update/${ingredient.id}`, {
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
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/ingredient/delete/${ingredient.id}`, {
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

            const meal = props.meal
            stepsectionsData.forEach(stepsection => {
                stepsection.steps = []
            })
            stepsData.forEach(step => {
                if (step.stepsection_id) {
                    stepsectionsData.filter(stepsection => stepsection.id === step.stepsection_id)[0].steps.push(step)
                }
            })
            ingredientsectionsData.forEach(ingredientsection => {
                ingredientsection.ingredients = []
            })
            ingredientsData.forEach(ingredient => {
                if (ingredient.ingredientsection_id) {
                    ingredientsectionsData.filter(ingredientsection => ingredientsection.id === ingredient.ingredientsection_id)[0].ingredients.push(ingredient)
                }
            })
            meal.recipe.stepsections = stepsectionsData
            meal.recipe.steps = stepsData
            meal.recipe.ingredientsections = ingredientsectionsData
            meal.recipe.ingredients = ingredientsData

            props.handleSuccessfulSubmit(meal)
        }
    }

    return (
        <form className='form-wrapper recipe-form-wrapper'
            onSubmit={props.edit ? handleEdit : handleAdd}
            autoComplete="off"
        >
            <h3>{props.edit ? `Edit ${props.meal.name} Recipe` : "Add a Recipe"}</h3>
            <h4>Ingredients</h4>
            {ingredients.map((ingredient, index) => ({...ingredient, index})).filter(ingredient => ingredient.ingredientsection === undefined).map((ingredient, index) => (
                <div className="ingredient-wrapper" key={`ingredient-${index}`}>
                    <button type='button' disabled={loading} className='icon-button' onClick={() => handleIngredientDelete(ingredient.index)}><FontAwesomeIcon icon={faTimesCircle} /></button>
                    <input type="text" 
                        value={ingredient.amount}
                        placeholder="Amount: 1, 1/2, 1.5, 1 1/2, 1-2, etc."
                        onChange={event => handleIngredientChangeAmount(event, ingredient)}
                        spellCheck="false"
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
                        placeholder="Ingredient"
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
            <button type='button' disabled={loading} className='alt-button' onClick={() => setIngredients([...ingredients, { amount: "", unit: "", name: "", category: "" }])}>Add Ingredient</button>
            <div className='spacer-40' />
            {ingredientsections.map((ingredientsection, index) => (
                <div className="ingredientsection-wrapper" key={`ingredientsection-${index}`}>
                    <button type='button' disabled={loading} className='icon-button' onClick={() => handleIngredientsectionDelete(index)}><FontAwesomeIcon icon={faTimesCircle} /></button>
                    <input type="text" 
                        value = {ingredientsection.title}
                        placeholder = "Section Title"
                        onChange={event => handleIngredientsectionChange(event, ingredientsection)}
                        autoCapitalize="on"
                        spellCheck="false"
                        autoFocus={!initialState.current}
                        required
                    />
                    {ingredients.map((ingredient, index) => ({...ingredient, index})).filter(ingredient => ingredient.ingredientsection === index).map((ingredient, ingredientIndex) => (
                        <div className="ingredient-wrapper" key={`ingredient-${index}-${ingredientIndex}`}>
                            <button type='button' disabled={loading} className='icon-button' onClick={() => handleIngredientDelete(ingredient.index)}><FontAwesomeIcon icon={faTimesCircle} /></button>
                            <input type="text" 
                                value={ingredient.amount}
                                placeholder="Amount: 1, 1/2, 1.5, 1 1/2, 1-2, etc."
                                onChange={event => handleIngredientChangeAmount(event, ingredient)}
                                spellCheck="false"
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
                                placeholder="Ingredient"
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
                    <button type='button' disabled={loading} className='alt-button' onClick={() => setIngredients([...ingredients, { amount: "", unit: "", name: "", category: "", ingredientsection: index }])}>Add Ingredient</button>
                </div>
            ))}
            <button type='button' disabled={loading} className='alt-button' onClick={() => setIngredientsections([...ingredientsections, { title: "" }])}>Add Section</button>

            <h4>Steps</h4>
            {steps.filter(step => step.stepsection === undefined).map((step, index) => (
                <div className="step-wrapper" key={`step-${index}`}>
                    <TextareaAutosize 
                        value={step.text}
                        placeholder="Step"
                        onChange={event => handleStepChange(event, step)}
                        minRows="6"
                        autoCapitalize="on"
                        spellCheck="true"
                        autoFocus={!initialState.current}
                        required
                    />
                    <button type='button' disabled={loading} className='icon-button' onClick={() => handleStepDelete(step)}><FontAwesomeIcon icon={faTimesCircle} /></button>
                </div>
            ))}
            <button type='button' disabled={loading} className='alt-button' onClick={() => setSteps([...steps, { text: "" }])}>Add Step</button>
            <div className='spacer-40' />
            {stepsections.map((stepsection, index) => (
                <div className="stepsection-wrapper" key={`stepsection-${index}`}>
                    <button type='button' disabled={loading} className='icon-button' onClick={() => handleStepsectionDelete(index)}><FontAwesomeIcon icon={faTimesCircle} /></button>
                    <input type="text" 
                        value = {stepsection.title}
                        placeholder = "Section Title"
                        onChange={event => handleStepsectionChange(event, stepsection)}
                        autoCapitalize="on"
                        spellCheck="false"
                        autoFocus={!initialState.current}
                        required
                    />
                    {steps.filter(step => step.stepsection === index).map((step, stepIndex) => (
                        <div className="step-wrapper" key={`step-${index}-${stepIndex}`}>
                            <TextareaAutosize 
                                value={step.text}
                                placeholder="Step"
                                onChange={event => handleStepChange(event, step)}
                                minRows="6"
                                autoCapitalize="on"
                                spellCheck="true"
                                autoFocus={!initialState.current}
                                required
                            />
                            <button type='button' disabled={loading} className='icon-button' onClick={() => handleStepDelete(step)}><FontAwesomeIcon icon={faTimesCircle} /></button>
                        </div>
                    ))}
                    <button type='button' disabled={loading} className='alt-button' onClick={() => setSteps([...steps, { text: "", stepsection: index }])}>Add Step</button>
                </div>
            ))}
            <button type='button' disabled={loading} className='alt-button' onClick={() => setStepsections([...stepsections, { title: "" }])}>Add Section</button>
            <div className='spacer-40' />
            <button type="submit" disabled={loading}>{props.edit ? "Edit Recipe" : "Add Recipe"}</button>
            <LoadingError loading={loading} error={error} />
        </form>
    )
}