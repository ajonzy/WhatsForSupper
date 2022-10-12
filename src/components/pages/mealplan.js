import React, { useContext, useState } from 'react'

import ConfirmLoadingError from '../utils/confirmLoadingError'

import { UserContext } from '../app'

export default function Mealplan(props) {
    const { user, setUser } = useContext(UserContext)
    const [personal_mealplan] = useState(user.mealplans.filter(mealplan => mealplan.id === parseInt(props.match.params.id))[0])
    const [shared_mealplan] = useState(user.shared_mealplans.filter(mealplan => mealplan.id === parseInt(props.match.params.id))[0])
    const [mealplan] = useState(personal_mealplan || shared_mealplan)
    const [confirm, setConfirm] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteError, setDeleteError] = useState("")

    const handleDelete = async () => {
        setDeleteError("")

        if (confirm) {
            setDeleteLoading(true)

            if (mealplan.sub_shoppinglist.id) {
                let newData = {}
                const data = await fetch("https://whatsforsupperapi.herokuapp.com/shoppinglist/add", { 
                    method: "POST" ,
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify({
                        name: `${mealplan.name} Mealplan (Deleted)`, 
                        created_on: mealplan.created_on, 
                        updates_hidden: false, 
                        is_sublist: false, 
                        user_username: user.username, 
                        user_id: user.id
                    })
                })
                .then(response => response.json())
                .catch(error => {
                    return { catchError: error }
                })  
                if (data.catchError) {
                    setDeleteError("An error occured... Please try again later.")
                    setDeleteLoading(false)
                    console.log("Error adding shoppinglist: ", data.catchError)
                    return false
                }
                else if (data.status === 200) {
                    newData = data.data
                }
                else {
                    setDeleteError("An error occured... Please try again later.")
                    console.log(data)
                    setDeleteLoading(false)
                    return false
                }

                let shoppingingredientsData = []
                if (mealplan.sub_shoppinglist.shoppingingredients.length > 0) {
                    const data = await fetch("https://whatsforsupperapi.herokuapp.com/shoppingingredient/add/multiple", {
                        method: "POST",
                        headers: { 
                            authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                            "content-type": "application/json" 
                        },
                        body: JSON.stringify(mealplan.sub_shoppinglist.shoppingingredients.map(ingredient => {
                            return {
                                name: ingredient.name,
                                amount: ingredient.amount,
                                unit: ingredient.unit,
                                category: ingredient.category,
                                shoppinglist_id: newData.id
                            }
                        }))
                    })
                    .then(response => response.json())
                    .catch(error => {
                        return { catchError: error }
                    })  
                    if (data.catchError) {
                        setDeleteError("An error occured... Please try again later.")
                        setDeleteLoading(false)
                        console.log("Error adding shopping ingredient: ", data.catchError)
                        return false
                    }
                    else if (data.status === 200) {
                        shoppingingredientsData = data.data
                    }
                    else {
                        setDeleteError("An error occured... Please try again later.")
                        console.log(data)
                        setDeleteLoading(false)
                        return false
                    }
                }

                newData.shoppingingredients = shoppingingredientsData
                user.shoppinglists.push(newData)
            }

            const data = await fetch(`https://whatsforsupperapi.herokuapp.com/mealplan/delete/${mealplan.id}`, { 
                method: "DELETE",
                headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
            })
            .then(response => response.json())
            .catch(error => {
                return { catchError: error }
            })  
            if (data.catchError) {
                setDeleteError("An error occured... Please try again later.")
                setDeleteLoading(false)
                console.log("Error deleting mealplan: ", data.catchError)
                return false
            }
            else if (data.status !== 200) {
                setDeleteError("An error occured... Please try again later.")
                console.log(data)
                setDeleteLoading(false)
                return false
            }
            
            user.mealplans = user.mealplans.filter(mealplan => mealplan.id !== data.data.id)
            user.shoppinglists = user.shoppinglists.filter(shoppinglist => shoppinglist.mealplan_id !== data.data.id)
            setUser({...user})
            props.history.push("/mealplans")
        }
        else {
            setConfirm(true)
        }
    }

    const handleShareDelete = () => {
        setDeleteError("")

        if (confirm) {
            setDeleteLoading(true)
            fetch(`https://whatsforsupperapi.herokuapp.com/mealplan/unshare/${mealplan.id}/${user.id}`, { 
                method: "DELETE",
                headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    user.shared_mealplans = user.shared_mealplans.filter(mealplan => mealplan.id !== data.data.mealplan.id)
                    user.shared_shoppinglists = user.shared_shoppinglists.filter(shoppinglist => shoppinglist.mealplan_id !== data.data.mealplan.id)
                    setUser({...user})
                    props.history.push("/mealplans")
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
                console.log("Error unsharing mealplan: ", error)
            })
        }
        else {
            setConfirm(true)
        }
    }

    return (
        (mealplan 
            ? (
                <div className='page-wrapper mealplan-page-wrapper'>
                    <h2 className='name'>{mealplan.name}</h2>
                    <p className='created-on'>{mealplan.created_on}</p>
                    {shared_mealplan ? <p className='shared-by'>Shared by: {mealplan.user_username}</p> : null}
                    <h3>Meals</h3>
                    <div className="mealplan-meals-wrapper">
                        {mealplan.meals.map(meal => (
                            <div className="meal-wrapper" key={`meal-${meal.id}`} onClick={() => props.history.push(`/meals/view/${meal.id}`)}>
                                <p className='meal-name'>{meal.name}</p>
                                {meal.difficulty > 0 ? <p className='meal-difficulty'><span>{"★".repeat(meal.difficulty)}</span></p> : null}
                            </div>
                        ))}
                        <div className="spacer-30" />
                        {personal_mealplan ? <button className='alt-button' onClick={() => props.history.push(`/mealplans/meals/edit/${mealplan.id}`)}>Edit Meals</button> : null}
                    </div>
                    
                    <div className="options-wrapper">
                        <h3>Mealplan Options</h3>
                        {personal_mealplan
                            ? (
                                <div className="edit-option-wrapper">
                                    <button className='alt-button' onClick={() => props.history.push(`/mealplans/edit/${mealplan.id}`)}>Edit Mealplan</button>
                                    <div className='spacer-30' />
                                </div>
                            )
                            : null
                        }
                        <div className="view-option-wrapper">
                            <button className='alt-button' onClick={() => props.history.push(`/shoppinglists/view/${mealplan.shoppinglist.id}`)}>View Shopping List</button>
                            <div className='spacer-30' />
                        </div>
                        {personal_mealplan
                            ? (
                                <div className="share-option-wrapper">
                                    <button className='alt-button' onClick={() => props.history.push(`/share/mealplan/${mealplan.id}`)}>Share Mealplan</button>
                                    <div className='spacer-30' />
                                </div>
                            )
                            : null
                        }
                        {personal_mealplan
                            ? (
                                <div className="delete-option-wrapper">
                                    <button className='dangerous-button' onClick={handleDelete}>Delete Mealplan</button>
                                    <ConfirmLoadingError confirm={confirm} loading={deleteLoading} error={deleteError} item={mealplan.name} />
                                    <div className='spacer-30' />
                                </div>
                            )
                            : null
                        }
                        {shared_mealplan
                            ? (
                                <div className="delete-option-wrapper">
                                    <button className='dangerous-button' onClick={handleShareDelete}>Delete Mealplan</button>
                                    <ConfirmLoadingError confirm={confirm} loading={deleteLoading} error={deleteError} item={mealplan.name} />
                                    <div className='spacer-30' />
                                </div>
                            )
                            : null
                        }
                        <button onClick={() => props.history.push("/mealplans")}>Back to Mealplans</button>
                    </div>
                </div>
            )
            : (
                <div className='page-wrapper mealplan-page-wrapper'>
                    <p className="not-found">Sorry, this mealplan does not exist...</p>
                    <div className="options-wrapper">
                        <div className="spacer-30" />
                        <button onClick={() => props.history.push("/mealplans")}>Back to Mealplans</button>
                    </div>
                </div>
            )
        )
    )
}