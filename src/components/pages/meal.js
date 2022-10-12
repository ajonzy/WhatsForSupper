import React, { useContext, useState } from 'react'

import ConfirmLoadingError from '../utils/confirmLoadingError'
import LoadingError from '../utils/loadingError'

import { UserContext } from '../app'

export default function Meal(props) {
    const { user, setUser } = useContext(UserContext)
    const [personal_meal] = useState(user.meals.filter(meal => meal.id === parseInt(props.match.params.id))[0])
    const [shared_meal] = useState(user.shared_meals.filter(meal => meal.id === parseInt(props.match.params.id))[0])
    const [shared_mealplan_meal] = useState(user.shared_mealplans.reduce((meals, mealplan) => meals.concat(mealplan.meals), []).filter(meal => meal.id === parseInt(props.match.params.id))[0])
    const [meal] = useState(personal_meal || shared_meal || shared_mealplan_meal)
    const [confirm, setConfirm] = useState(false)
    const [copyLoading, setCopyLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteError, setDeleteError] = useState("")
    const [copyError, setCopyError] = useState("")

    const renderSteps = () => {
        const stepElements = []

        const basicSteps = meal.recipe.steps.filter(step => !step.stepsection_id)
        basicSteps.sort((stepA, stepB) => stepA.number - stepB.number)
        basicSteps.forEach(step => stepElements.push(
            <div className="step-wrapper" key={`step-${step.id}`}>
                <p className='step-number'>{step.number}.</p>
                <p>{step.text}</p>
            </div>
        ))

        stepElements.push(<div className='spacer-40'key={`spacer`} />)

        meal.recipe.stepsections.sort((stepsectionA, stepsectionB) => stepsectionA.id - stepsectionB.id).forEach(stepsection => {
            stepsection.steps.sort((stepA, stepB) => stepA.number - stepB.number)
            stepElements.push(
                <div className="stepsection-wrapper" key={`stepsection-${stepsection.id}`}>
                    <p className='stepsection-title'>{stepsection.title}</p>
                    {stepsection.steps.map(step => (
                        <div className="step-wrapper" key={`step-${step.id}`}>
                            <p className='step-number'>{step.number}.</p>
                            <p>{step.text}</p>
                        </div>
                    ))}
                </div>
            )
        })

        return stepElements
    }

    const renderIngredients = () => {
        const ingredientElements = []

        const basicIngredients = meal.recipe.ingredients.filter(ingredient => !ingredient.ingredientsection_id)
        basicIngredients.sort((ingredientA, ingredientB) => ingredientA.id - ingredientB.id)
        basicIngredients.forEach(ingredient => ingredientElements.push(
            <div className="ingredient-wrapper" key={`ingredient-${ingredient.id}`}>
                <p className='ingredient-amount'>{ingredient.amount}{ingredient.unit ? ` ${ingredient.unit}` : null}</p>
                <p>{ingredient.name}</p>
            </div>
        ))

        ingredientElements.push(<div className='spacer-40'key={`spacer`} />)

        meal.recipe.ingredientsections.sort((ingredientsectionA, ingredientsectionB) => ingredientsectionA.id - ingredientsectionB.id).forEach(ingredientsection => {
            ingredientsection.ingredients.sort((ingredientA, ingredientB) => ingredientA.id - ingredientB.id)
            ingredientElements.push(
                <div className="ingredientsection-wrapper" key={`ingredientsection-${ingredientsection.id}`}>
                    <p className='ingredientsection-title'>{ingredientsection.title}</p>
                    {ingredientsection.ingredients.map(ingredient => (
                        <div className="ingredient-wrapper" key={`ingredient-${ingredient.id}`}>
                            <p className='ingredient-amount'>{ingredient.amount}{ingredient.unit ? ` ${ingredient.unit}` : null}</p>
                            <p>{ingredient.name}</p>
                        </div>
                    ))}
                </div>
            )
        })

        return ingredientElements
    }

    const handleDelete = () => {
        setDeleteError("")

        if (confirm) {
            setDeleteLoading(true)
            fetch(`https://whatsforsupperapi.herokuapp.com/meal/delete/${meal.id}`, { 
                method: "DELETE",
                headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    user.meals = user.meals.filter(meal => meal.id !== data.data.id)
                    user.mealplans.forEach(mealplan => {
                        mealplan.meals = mealplan.meals.filter(meal => meal.id !== data.data.id)
                        mealplan.shoppinglist.shoppingingredients = mealplan.shoppinglist.shoppingingredients.filter(shoppingingredient => !data.data.recipe.ingredients.map(ingredient => ingredient.id).includes(shoppingingredient.ingredient_id))
                    })
                    user.shoppinglists.filter(shoppinglist => !shoppinglist.is_sublist).forEach(shoppinglist => shoppinglist.shoppingingredients = shoppinglist.shoppingingredients.filter(shoppingingredient => !data.data.recipe.ingredients.map(ingredient => ingredient.id).includes(shoppingingredient.ingredient_id)))
                    setUser({...user})                                                                                                             
                    props.history.push("/meals")
                }
                else {
                    setDeleteError("An error occured... Please try again later.")
                    console.log(data)
                    setDeleteLoading(false)
                }
            })
            .catch(error => {
                setDeleteError("An error occured... Please try again later.")
                setDeleteLoading(false)
                console.log("Error deleting meal: ", error)
            })
        }
        else {
            setConfirm(true)
        }
    }

    const handleCopy = async () => {
        setCopyError("")
        setCopyLoading(true)

        let newData = {}
        let data = await fetch("https://whatsforsupperapi.herokuapp.com/meal/add", {
            method: "POST",
            headers: { 
                authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                "content-type": "application/json" 
            },
            body: JSON.stringify({
                name: meal.name,
                difficulty: meal.difficulty,
                description: meal.description,
                image_url: meal.image_url,
                owner_username: meal.owner_username,
                user_id: user.id
            })
        })
        .then(response => response.json())
        .catch(error => {
            return { catchError: error }
        })
        if (data.status === 400) {
            setCopyError("An error occured... Please try again later.")
            console.log(data)
            setCopyLoading(false)
            return false
        }
        else if (data.catchError) {
            setCopyError("An error occured... Please try again later.")
            setCopyLoading(false)
            console.log("Error adding meal: ", data.catchError)
            return false
        }
        else if (data.status === 200) {
            newData = data.data
        }
        else {
            setCopyError("An error occured... Please try again later.")
            console.log(data)
            setCopyLoading(false)
            return false
        }

        if (meal.recipe.stepsections.length > 0) {
            const data = await fetch("https://whatsforsupperapi.herokuapp.com/stepsection/add/multiple", {
                method: "POST",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify(meal.recipe.stepsections.map(stepsection => {
                    return {
                        title: stepsection.title,
                        recipe_id: newData.recipe.id
                    }
                }))
            })
            .then(response => response.json())
            .catch(error => {
                return { catchError: error }
            })  
            if (data.status === 400) {
                setCopyError("An error occured... Please try again later.")
                console.log(data)
                setCopyLoading(false)
                return false
            }
            else if (data.catchError) {
                setCopyError("An error occured... Please try again later.")
                setCopyLoading(false)
                console.log("Error adding stepsection: ", data.catchError)
                return false
            }
            else if (data.status === 200) {
                newData.recipe.stepsections = data.data
            }
            else {
                setCopyError("An error occured... Please try again later.")
                console.log(data)
                setCopyLoading(false)
                return false
            }
        }

        if (meal.recipe.steps.length > 0) {
            const data = await fetch("https://whatsforsupperapi.herokuapp.com/step/add/multiple", {
                method: "POST",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify(meal.recipe.steps.map(step => {
                    return {
                        number: step.number,
                        text: step.text,
                        stepsection_id: step.stepsection_id,
                        recipe_id: newData.recipe.id
                    }
                }))
            })
            .then(response => response.json())
            .catch(error => {
                return { catchError: error }
            })  
            if (data.status === 400) {
                setCopyError("An error occured... Please try again later.")
                console.log(data)
                setCopyLoading(false)
                return false
            }
            else if (data.catchError) {
                setCopyError("An error occured... Please try again later.")
                setCopyLoading(false)
                console.log("Error adding step: ", data.catchError)
                return false
            }
            else if (data.status === 200) {
                newData.recipe.steps = data.data
            }
            else {
                setCopyError("An error occured... Please try again later.")
                console.log(data)
                setCopyLoading(false)
                return false
            }
        }

        let ingredientsectionsData = []
        if (meal.recipe.ingredientsections.length > 0) {
            const data = await fetch("https://whatsforsupperapi.herokuapp.com/ingredientsection/add/multiple", {
                method: "POST",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify(meal.recipe.ingredientsections.map(ingredientsection => {
                    return {
                        title: ingredientsection.title,
                        recipe_id: newData.recipe.id
                    }
                }))
            })
            .then(response => response.json())
            .catch(error => {
                return { catchError: error }
            })  
            if (data.status === 400) {
                setCopyError("An error occured... Please try again later.")
                console.log(data)
                setCopyLoading(false)
                return false
            }
            else if (data.catchError) {
                setCopyError("An error occured... Please try again later.")
                setCopyLoading(false)
                console.log("Error adding ingredientsection: ", data.catchError)
                return false
            }
            else if (data.status === 200) {
                newData.recipe.ingredientsections = data.data
                ingredientsectionsData = data.data
            }
            else {
                setCopyError("An error occured... Please try again later.")
                console.log(data)
                setCopyLoading(false)
                return false
            }
        }

        if (meal.recipe.ingredients.length > 0) {
            const formmattedIngredients = [...meal.recipe.ingredients.filter(ingredient => !ingredient.ingredientsection_id)]

            meal.recipe.ingredientsections.forEach(ingredientsection => {
                const ingredientsectionData = ingredientsectionsData.filter(ingredientsectionData => ingredientsectionData.title === ingredientsection.title)[0]
                formmattedIngredients.push(...meal.recipe.ingredients.filter(ingredient => ingredient.ingredientsection_id === ingredientsection.id).map(ingredient => ({ ...ingredient, ingredientsection_id: ingredientsectionData.id })))
            })

            const data = await fetch("https://whatsforsupperapi.herokuapp.com/ingredient/add/multiple", {
                method: "POST",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify(formmattedIngredients.map(ingredient => {
                    return {
                        name: ingredient.name,
                        amount: ingredient.amount,
                        unit: ingredient.unit,
                        category: ingredient.category,
                        ingredientsection_id: ingredient.ingredientsection_id,
                        recipe_id: newData.recipe.id
                    }
                }))
            })
            .then(response => response.json())
            .catch(error => {
                return { catchError: error }
            })  
            if (data.status === 400) {
                setCopyError("An error occured... Please try again later.")
                console.log(data)
                setCopyLoading(false)
                return false
            }
            else if (data.catchError) {
                setCopyError("An error occured... Please try again later.")
                setCopyLoading(false)
                console.log("Error adding ingredient: ", data.catchError)
                return false
            }
            else if (data.status === 200) {
                newData.recipe.ingredients = data.data
                newData.recipe.ingredientsections.forEach(section => section.ingredients.push(...data.data.filter(ingredient => ingredient.ingredientsection_id === section.id)))
            }
            else {
                setCopyError("An error occured... Please try again later.")
                console.log(data)
                setCopyLoading(false)
                return false
            }
        }

        let unshareData = {}
        if (shared_meal) {
            data = await fetch(`https://whatsforsupperapi.herokuapp.com/meal/unshare/${meal.id}/${user.id}`, { 
                method: "DELETE",
                headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
            })
            .then(response => response.json())
            .catch(error => {
                return { catchError: error }
            }) 
            if (data.catchError) {
                setCopyError("An error occured... Please try again later.")
                setCopyLoading(false)
                console.log("Error unsharing meal: ", data.catchError)
                return false
            }
            else if (data.status === 200) {
                unshareData = data.data
            }
            else {
                setCopyError("An error occured... Please try again later.")
                console.log(data)
                setCopyLoading(false)
                return false
            }
        }

        user.meals.push(newData)
        if (shared_meal) {
            user.shared_meals = user.shared_meals.filter(meal => meal.id !== unshareData.meal.id)
        }
        setUser({...user})
        props.history.push("/meals")
    }

    const handleShareDelete = () => {
        setDeleteError("")

        if (confirm) {
            setDeleteLoading(true)
            fetch(`https://whatsforsupperapi.herokuapp.com/meal/unshare/${meal.id}/${user.id}`, { 
                method: "DELETE",
                headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    user.shared_meals = user.shared_meals.filter(meal => meal.id !== data.data.meal.id)
                    setUser({...user})
                    props.history.push("/meals")
                }
                else {
                    setDeleteError("An error occured... Please try again later.")
                    console.log(data)
                    setDeleteLoading(false)
                }
            })
            .catch(error => {
                setDeleteError("An error occured... Please try again later.")
                setDeleteLoading(false)
                console.log("Error unsharing meal: ", error)
            })
        }
        else {
            setConfirm(true)
        }
    }

    return (
        (meal 
            ? (
                <div className='page-wrapper meal-page-wrapper'>
                    <h2 className='name'>{meal.name}</h2>
                    {shared_meal ? <p className='shared-by'>Shared by: {meal.user_username}</p> : null}
                    {shared_mealplan_meal && !shared_meal ? <p className='shared-by'>Owned by: {meal.user_username}</p> : null}
                    {meal.owner_username !== meal.user_username ? <p className='shared-by'>Created by: {meal.owner_username}</p> : null}
                    {meal.difficulty > 0 ? <p className='difficulty'>Difficulty: <span>{"★".repeat(meal.difficulty)}</span></p> : null}
                    {meal.image_url ? <img src={meal.image_url} alt="" /> : null}
                    {meal.description ? <p className='description'>{meal.description}</p> : null}
                    {personal_meal && meal.categories.length > 0 
                        ? (
                            <div className="meal-categories-wrapper">
                                {"Category: " +
                                meal.categories.map((category, index) => (
                                    `${category.name}${index === meal.categories.length - 1 ? "" : ", "}`
                                )).join("")}
                            </div>
                        )
                        : null
                    }

                    {meal.recipe.steps.length > 0 || meal.recipe.ingredients.length > 0
                        ? (
                            <div className="meal-recipe-wrapper">
                                <h3>Recipe</h3>
                                {meal.recipe.ingredients.length > 0
                                    ? (
                                        <div className="recipe-ingredients-wrapper">
                                            <h4>Ingredients</h4>
                                            {renderIngredients()}
                                        </div>
                                    )
                                    : null
                                }
                                {meal.recipe.steps.length > 0
                                    ? (
                                        <div className="recipe-steps-wrapper">
                                            <h4>Steps</h4>
                                            {renderSteps()}
                                        </div>
                                    )
                                    : null
                                }
                                {personal_meal ? <button className='alt-button' onClick={() => props.history.push(`/meals/recipe/edit/${meal.id}`)}>Edit Recipe</button> : null}
                                <div className='spacer-30' />
                            </div>
                        )
                        : (personal_meal
                            ? (
                                <div className="meal-recipe-wrapper">
                                    <h3>Recipe</h3>
                                    <button className='alt-button' onClick={() => props.history.push(`/meals/recipe/add/${meal.id}`)}>Add Recipe</button>
                                    <div className='spacer-30' />
                                </div>
                            )
                            : null
                        )
                    }
                    <div className="options-wrapper">
                        <h3>Meal Options</h3>
                        {personal_meal
                            ? (
                                <div className="edit-option-wrapper">
                                    <button className='alt-button' onClick={() => props.history.push(`/meals/edit/${meal.id}`)}>Edit Meal</button>
                                    <div className='spacer-30' />
                                </div>
                            )
                            : null
                        }
                        {personal_meal
                            ? (
                                <div className="share-option-wrapper">
                                    <button className='alt-button' onClick={() => props.history.push(`/share/meal/${meal.id}`)}>Share Meal</button>
                                    <div className='spacer-30' />
                                </div>
                            )
                            : null
                        }
                        {personal_meal
                            ? (
                                <div className="delete-option-wrapper">
                                    <button className='dangerous-button' onClick={handleDelete}>Delete Meal</button>
                                    <ConfirmLoadingError confirm={confirm} loading={deleteLoading} error={deleteError} item={meal.name} />
                                    <div className='spacer-30' />
                                </div>
                            )
                            : null
                        }
                        {shared_meal || shared_mealplan_meal
                            ? (
                                <div className="add-option-wrapper">
                                    <button className='alt-button' onClick={handleCopy}>Copy Meal</button>
                                    <LoadingError loading={copyLoading} error={copyError} />
                                    <div className='spacer-30' />
                                </div>
                            )
                            : null
                        }
                        {shared_meal
                            ? (
                                <div className="delete-option-wrapper">
                                    <button className='dangerous-button' onClick={handleShareDelete}>Delete Meal</button>
                                    <ConfirmLoadingError confirm={confirm} loading={deleteLoading} error={deleteError} item={meal.name} />
                                    <div className='spacer-30' />
                                </div>
                            )
                            : null
                        }
                        <button onClick={() => props.history.push("/meals")}>Back to Meals</button>
                    </div>
                </div>
            )
            : (
                <div className='page-wrapper meal-page-wrapper'>
                    <p className="not-found">Sorry, this meal does not exist...</p>
                    <div className="spacer-30" />
                    <div className="options-wrapper">
                        <button onClick={() => props.history.push("/meals")}>Back to Meals</button>
                    </div>
                </div>
            )
        )
    )
}