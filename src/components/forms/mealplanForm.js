import React, { useContext, useEffect, useState } from 'react'
import Modal from 'react-modal'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleXmark, faHandPointer, faLock, faRotate, faUnlock, faCheck, faCaretLeft, faCaretRight } from '@fortawesome/free-solid-svg-icons'

import generateMeals from '../../functions/generateMeals'
import titleize from '../../functions/titleize'

import LoadingError from '../utils/loadingError'

import { UserContext } from '../app'

export default function MealplanForm(props) {
    const { user } = useContext(UserContext)

    const getMealMultiplier = meal => {
        if (props.edit && props.data.meals.map(mealplanMeal => mealplanMeal.id).includes(meal.id)) {
            const ingredients = meal.recipe.ingredients

            if (ingredients.length > 0) {
                const shoppingingredients = ingredients.map(ingredient => ingredient.shoppingingredients.filter(shoppingingredient => shoppingingredient.shoppinglist_id === props.data.shoppinglist.id)[0])

                if (shoppingingredients.length > 0) {
                    const multipliers = shoppingingredients.map(shoppingingredient => shoppingingredient.multiplier).sort()
                    const lowest = multipliers[0]
                    const highest = multipliers[multipliers.length - 1]
                    const multiplier = lowest === highest ? lowest : "-"
                    return { lowest, highest, multiplier }
                }
            }
        }
        
        return { lowest: 1, highest: 1, multiplier: 1 }
    }

    const [meals, setMeals] = useState(props.meals.map(meal => ({...meal, locked: false, multiplier: getMealMultiplier(meal) })))
    const [problem, setProblem] = useState(props.problem || false)
    const [data, setData] = useState(props.edit ? { name: props.data.name, number: props.meals.length, rules: props.data.rules.map(rule => ({ ...rule, type: rule.rule_type || rule.type })) } : props.data)
    const [modalIsOpen, setIsOpen] = useState(false)
    const [mealsList, setMealsList] = useState(user.meals)
    const [overidenMeal, setOveridenMeal] = useState({})
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (props.recheckRules) {
            generateMeals(user, data.number, data.rules, setProblem, meals)
        }
    }, [])

    const handleFilter = event => {
        setMealsList(user.meals.filter(meal => (
            meal.name.toLowerCase().includes(event.target.value.toLowerCase()) ||
            meal.categories.map(category => category.name.toLowerCase()).filter(category => category.includes(event.target.value.toLowerCase())).length > 0 ||
            (meal.difficulty > 0 ? meal.difficulty === parseInt(event.target.value) : false)
        )))
    }

    const handleLock = lockedMeal => {
        const meal = meals.filter(meal => meal.id === lockedMeal.id)[0]
        meal.locked = !meal.locked
        setMeals([...meals])
    }

    const handleMealplanRefresh = (lockedMeals, number=data.number) => {
        return generateMeals(user, number, data.rules, setProblem, lockedMeals)
    }

    const generateNewMeals = (lockedMeals, newMeals) => {
        lockedMeals.forEach(lockedMeal => newMeals.splice(lockedMeal.position, 0, lockedMeal))
        newMeals.forEach(meal => delete meal.position)
        newMeals.forEach((meal, index) => newMeals.splice(index, 1, {...meal, multiplier: { lowest: 1, highest: 1, multiplier: 1 }}))
        setMeals(newMeals)
    }

    const handleRefresh = refreshedMeal => {
        const lockedMeals = refreshedMeal ? meals.map((meal, index) => ({...meal, position: index})).filter(meal => meal.id != refreshedMeal.id) : meals.map((meal, index) => ({...meal, position: index})).filter(meal => meal.locked)
        const newMeals = handleMealplanRefresh(lockedMeals).filter(meal => !lockedMeals.map(lockedMeal => lockedMeal.id).includes(meal.id))
        generateNewMeals(lockedMeals, newMeals)
    }

    const handleMealAdd = () => {
        setData({...data, number: data.number + 1})
        const lockedMeals = meals.map((meal, index) => ({...meal, position: index}))
        const newMeals = handleMealplanRefresh(lockedMeals, data.number + 1).filter(meal => !lockedMeals.map(lockedMeal => lockedMeal.id).includes(meal.id))
        generateNewMeals(lockedMeals, newMeals)
    }

    const handleMealOveride = overidingMeal => {
        meals.splice(meals.findIndex(meal => meal.id === overidenMeal.id), 1, overidingMeal)
        const lockedMeals = meals.map((meal, index) => ({...meal, position: index}))
        const newMeals = handleMealplanRefresh(lockedMeals).filter(meal => !lockedMeals.map(lockedMeal => lockedMeal.id).includes(meal.id))
        generateNewMeals(lockedMeals, newMeals)
        handleModalClose()
    }

    const handleMealDelete = deletedMeal => {
        setData({...data, number: data.number - 1})
        const lockedMeals = meals.filter(meal => meal.id !== deletedMeal.id).map((meal, index) => ({...meal, position: index}))
        const newMeals = handleMealplanRefresh(lockedMeals, data.number - 1).filter(meal => !lockedMeals.map(lockedMeal => lockedMeal.id).includes(meal.id))
        generateNewMeals(lockedMeals, newMeals)
    }

    const handleMultiplierChange = (meal, change) => {
        const newMultiplier = (
            meal.multiplier.multiplier === "-" 
                ? change === -1 
                    ? meal.multiplier.lowest
                    : meal.multiplier.highest
                : meal.multiplier.multiplier + change
        )
        meals.splice(meals.findIndex(existingMeal => existingMeal.id === meal.id), 1, {...meal, multiplier: { highest: newMultiplier, lowest: newMultiplier, multiplier: newMultiplier }})
        setMeals([...meals])
    }

    const handleMealplanAdd = async event => {
        event.preventDefault()

        setError("")

        if (true) {
            setLoading(true)
            let newData = {}

            const getMultipliers = () => {
                const multipliers = {}
                meals.forEach(meal => multipliers[meal.id] = meal.multiplier.multiplier)
                return multipliers
            }

            let responseData = await fetch("https://whatsforsupperapi.herokuapp.com/mealplan/add", {
                method: "POST",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify({
                    name: data.name,
                    created_on: new Date().toLocaleDateString(),
                    user_username: user.username,
                    user_id: user.id,
                    meals: meals.map(meal => meal.id),
                    multipliers: getMultipliers()
                })
            })
            .then(response => response.json())
            .catch(error => {
                return { catchError: error }
            })  

            if (responseData.status === 400) {
                setError("An error occured... Please try again later.")
                console.log(responseData)
                setLoading(false)
                return false
            }
            else if (responseData.catchError) {
                setError("An error occured... Please try again later.")
                setLoading(false)
                console.log("Error adding mealplan: ", responseData.catchError)
                return false
            }
            else if (responseData.status === 200) {
                newData = responseData.data
            }
            else {
                setError("An error occured... Please try again later.")
                console.log(data)
                setLoading(false)
                return false
            }

            for (let rule of data.rules) {
                responseData = await fetch("https://whatsforsupperapi.herokuapp.com/rule/add", {
                    method: "POST",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify({
                        rule_type: rule.type,
                        rule: rule.rule,
                        amount: rule.amount || 0,
                        value: titleize(rule.value),
                        mealplan_id: newData.id
                    })
                })
                .then(response => response.json())
                .catch(error => {
                    return { catchError: error }
                }) 
                 
                if (responseData.status === 400) {
                    setError("An error occured... Please try again later.")
                    console.log(responseData)
                    setLoading(false)
                    return false
                }
                else if (responseData.catchError) {
                    setError("An error occured... Please try again later.")
                    setLoading(false)
                    console.log("Error adding rule: ", responseData.catchError)
                    return false
                }
                else if (responseData.status === 200) {
                    newData.rules.push(responseData.data)
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                    return false
                }
            }

            props.handleSuccessfulCreateMealplan(newData)
        }
    }

    const handleEdit = async event => {
        event.preventDefault()

        if (true) {
            setLoading(true)

            const newMeals = meals.filter(meal => !props.meals.map(existingMeal => existingMeal.id).includes(meal.id))
            const existingMeals = meals.filter(meal => props.meals.map(existingMeal => existingMeal.id).includes(meal.id))
            const updatedMeals = existingMeals.filter(existingMeal => props.meals.map(meal => ({...meal, multiplier: getMealMultiplier(meal)})).filter(meal => meal.id === existingMeal.id)[0].multiplier.multiplier !== existingMeal.multiplier.multiplier)
            const deletedMeals = props.meals.filter(existingMeal => !meals.map(meal => meal.id).includes(existingMeal.id))
            let newData = {...props.data}
            if (newMeals.length > 0) {
                for (let meal of newMeals) {
                    const data = await fetch("https://whatsforsupperapi.herokuapp.com/mealplan/meal/add", {
                        method: "POST",
                        headers: { 
                            authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                            "content-type": "application/json" 
                        },
                        body: JSON.stringify({
                            mealplan_id: props.data.id,
                            meal_id: meal.id,
                            multiplier: meal.multiplier.multiplier
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
                        newData = data.data.mealplan
                    }
                    else {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                        setLoading(false)
                        return false
                    }
                }
            }

            if (updatedMeals.length > 0) {
                for (let meal of updatedMeals) {
                    for (let ingredient of meal.recipe.ingredients) {
                        for (let shoppingingredient of ingredient.shoppingingredients.filter(shoppingingredient => shoppingingredient.shoppinglist_id === props.data.shoppinglist.id)) {
                            const data = await fetch(`https://whatsforsupperapi.herokuapp.com/shoppingingredient/update/${shoppingingredient.id}`, {
                                method: "PUT",
                                headers: { 
                                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                                    "content-type": "application/json" 
                                },
                                body: JSON.stringify({
                                    multiplier: meal.multiplier.multiplier
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
                                shoppingingredient.multiplier = meal.multiplier.multiplier
                                newData.shoppinglist.shoppingingredients.splice(newData.shoppinglist.shoppingingredients.findIndex(existingShoppingingredient => existingShoppingingredient.id === shoppingingredient.id), 1, data.data)
                            }
                            else {
                                setError("An error occured... Please try again later.")
                                console.log(data)
                                setLoading(false)
                                return false
                            }
                        }
                    }
                }
            }

            if (deletedMeals.length > 0) {
                for (let meal of deletedMeals) {
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/mealplan/meal/delete`, {
                        method: "DELETE",
                        headers: { 
                            authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                            "content-type": "application/json" 
                        },
                        body: JSON.stringify({
                            mealplan_id: props.data.id,
                            meal_id: meal.id
                        })
                    })
                    .then(response => response.json())
                    .catch(error => {
                        return { catchError: error }
                    })  
                    if (data.catchError) {
                        setError("An error occured... Please try again later.")
                        setLoading(false)
                        console.log("Error deleting meal: ", data.catchError)
                        return false
                    }
                    else if (data.status === 200) {
                        newData = data.data.mealplan
                    }
                    else {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                        setLoading(false)
                        return false
                    }
                }
            }

            props.handleSuccessfulEdit(newData)
        }
    }

    const modalStyles = {
        overlay: {
            zIndex: "1",
            backgroundColor: "rgba(255, 255, 255, 0.45)"
        },
        content: {
            top: '52.6px',
            left: '50%',
            right: 'auto',
            marginRight: '-50%',
            transform: 'translateX(-50%)',
            height: "calc(100% - 83.6px)",
            height: "calc((var(--vh, 1vh) * 100) - 83.6px)",
            width: "calc(100% - 62px)",
            maxWidth: "778px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center"
        }
    }
      
    Modal.setAppElement(document.querySelector(".app-wrapper"));

    const handleModalOpen = overidenMeal => {
        setOveridenMeal(overidenMeal)
        setIsOpen(true)
    }

    const handleModalClose = () => {
        setOveridenMeal({})
        setIsOpen(false)
    }

    const renderModal = () => {
        return (
            <Modal
                isOpen={modalIsOpen}
                style={modalStyles}
                onRequestClose={handleModalClose}
                contentLabel="Example Modal"
            >
                <div className="mealplan-modal-wrapper">
                    <div className="options-wrapper">
                        <button type="button" onClick={() => setIsOpen(false)}>Close</button>
                        <input type="text"
                            placeholder='Search: meal names, category, difficulty'
                            onChange={handleFilter}
                        />
                    </div>
                    {mealsList.filter(userMeal => !meals.map(meal => meal.id).includes(userMeal.id)).map(userMeal => (
                        <div key={`modal-meal-${userMeal.id}`} className="modal-meal-wrapper">
                            <p className='name'>{userMeal.name}</p>
                            <button type='button' className='icon-button' onClick={() => handleMealOveride(userMeal)}><FontAwesomeIcon icon={faCheck} /></button>
                        </div>
                    ))}
                </div>
            </Modal>
        )
    }

    return (
        <form className='form-wrapper mealplan-form-wrapper'
            onSubmit={props.edit ? handleEdit : handleMealplanAdd}
            autoComplete="off"
        >
            <h2 className='name'>{data.name}</h2>
            {renderModal()}
            {problem ? <p className='problem'>Unfortunately, not all rules were able to be fulfilled.</p> : null}
            {meals.map(meal => (
                <div className="generated-meal-wrapper" key={`generated-meal-${meal.id}`}>
                    <div className="name-difficulty-wrapper">
                        <p className='meal-name'>{meal.name}</p>
                        {meal.difficulty > 0 ? <p className='meal-difficulty'>Difficulty: <span>{"★".repeat(meal.difficulty)}</span></p> : null}
                    </div>
                    {meal.categories.length > 0 
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
                    <div className="options-wrapper">
                        {meal.locked ? <button type='button' className='icon-button' onClick={() => handleLock(meal)} disabled={loading}><FontAwesomeIcon icon={faUnlock} /></button> : <button type='button' className='icon-button' onClick={() => handleLock(meal)} disabled={loading}><FontAwesomeIcon icon={faLock} /></button>}
                        <button type='button' className='icon-button' disabled={meal.locked || loading} onClick={() => handleRefresh(meal)}><FontAwesomeIcon icon={faRotate} /></button>
                        <button type='button' className='icon-button' disabled={meal.locked || loading} onClick={() => handleModalOpen(meal)}><FontAwesomeIcon icon={faHandPointer} /></button>
                        <button type='button' className='icon-button' disabled={meal.locked || loading} onClick={() => handleMealDelete(meal)}><FontAwesomeIcon icon={faCircleXmark} /></button>
                        <div className="multiplier-wrapper">
                            <button type='button' className='icon-button' disabled={meal.locked || loading || meal.multiplier.multiplier <= 1} onClick={() => handleMultiplierChange(meal, -1)}><FontAwesomeIcon icon={faCaretLeft} /></button>
                            <p className={`multiplier ${meal.locked  || loading ? "disabled" : null}`}>x{meal.multiplier.multiplier}</p>
                            <button type='button' className='icon-button' disabled={meal.locked || loading || meal.multiplier.multiplier >=9} onClick={() => handleMultiplierChange(meal, 1)}><FontAwesomeIcon icon={faCaretRight} /></button>
                        </div>
                    </div>
                </div>
            ))}
            <div className="options-wrapper">
                <button type='button' className='alt-button' disabled={loading} onClick={() => handleRefresh()}>Refresh Meals</button>
                <button type='button' className='alt-button' disabled={loading} onClick={() => handleMealAdd()}>Add Meal</button>
                <button type='button' className='alt-button' disabled={loading} onClick={() => props.setSection("mealplan-form")}>Edit Rules</button>
            </div>
            <div className="spacer-40" />
            <button type="submit" disabled={loading}>{props.edit ? "Edit Meals" : "Create Mealplan"}</button>
            <LoadingError loading={loading} error={error} />
        </form>
    )
}