import React, { useContext, useState } from 'react'

import ConfirmLoadingError from '../utils/confirmLoadingError'

import { UserContext } from '../app'

export default function Friend(props) {
    const { user, setUser } = useContext(UserContext)
    const [friend] = useState(user.friends.filter(friend => friend.username === props.match.params.username)[0])
    const [confirm, setConfirm] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)
    const [deleteError, setDeleteError] = useState("")

    const handleDelete = () => {
        setDeleteError("")

        if (confirm) {
            setDeleteLoading(true)
            fetch(`https://whatsforsupperapi.herokuapp.com/user/friend/delete/${user.id}/${friend.user_id}`, { 
                method: "DELETE",
                headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    user.friends = user.friends.filter(friend => friend.user_id !== data.data.friend.id)
                    setUser({...user})
                    props.history.push("/friends")
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

    const renderSharedItems = () => {
        const sharedMeals = user.shared_meals.filter(meal => meal.user_username === friend.username)
        const sharedMealplans = user.shared_mealplans.filter(mealplan => mealplan.user_username === friend.username)
        const sharedShoppinglists = user.shared_shoppinglists.filter(shoppinglist => shoppinglist.user_username === friend.username)

        return (
            <div className="shared-items-wrapper">
                <h3>Shared Meals</h3>
                {sharedMeals.length > 0
                    ? (
                        <div className="shared-meals-wrapper">
                            {sharedMeals.map(meal => (
                                <div className="meal-wrapper" key={`meal-${meal.id}`} onClick={() => props.history.push(`/meals/view/${meal.id}`)}>
                                    <p className='meal-name'>{meal.name}</p>
                                    {meal.difficulty > 0 ? <p className='difficulty'>Difficulty: <span>{"★".repeat(meal.difficulty)}</span></p> : null}
                                    {meal.image_url ? <img src={meal.image_url} alt="" /> : null}
                                    {meal.description ? <p className='description'>{meal.description}</p> : null}
                                </div>
                            ))}
                        </div>
                    )
                    : <p className="no-content">None</p>
                }

                <h3>Shared Mealplans</h3>
                {sharedMealplans.length > 0
                    ? (
                        <div className="shared-mealplans-wrapper">
                            {sharedMealplans.map(mealplan => (
                                <div className="mealplan-wrapper" key={`mealplan-${mealplan.id}`} onClick={() => props.history.push(`/mealplans/view/${mealplan.id}`)}>
                                    <p className='mealplan-name'>{mealplan.name}</p>
                                    <p className='created-on'>{mealplan.created_on}</p>
                                    <div className="mealplan-meals-wrapper">
                                        {mealplan.meals.map(meal => (
                                            <div className="meal-wrapper" key={`meal-${meal.id}`}>
                                                <p className='meal-name'>{meal.name}</p>
                                                {meal.difficulty > 0 ? <p className='difficulty'><span>{"★".repeat(meal.difficulty)}</span></p> : null}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                    : <p className="no-content">None</p>
                }

                <h3>Shared Shopping Lists</h3>
                {sharedShoppinglists.length > 0
                    ? (
                        <div className="shared-shoppinglists-wrapper">
                            {sharedShoppinglists.map(shoppinglist => (
                                <div className="shoppinglist-wrapper" key={`shoppinglist-${shoppinglist.id}`} onClick={() => props.history.push(`/shoppinglists/view/${shoppinglist.id}`)}>
                                    <p className='shoppinglist-name'>{shoppinglist.name}</p>
                                    <p className='created-on'>{shoppinglist.created_on}</p>
                                </div>
                            ))}
                        </div>
                    )
                    : <p className="no-content">None</p>
                }

                <div className="spacer-30" />
            </div>
        )
    }

    return (
        (friend 
            ? (
                <div className='page-wrapper friend-page-wrapper'>
                    <h2 className='name'>{friend.username}</h2>
                    {renderSharedItems()}
                    <div className="options-wrapper">
                        <div className="delete-option-wrapper">
                            <button className='dangerous-button' onClick={handleDelete}>Delete Friend</button>
                            <ConfirmLoadingError confirm={confirm} loading={deleteLoading} error={deleteError} item={friend.username} />
                            <div className='spacer-30' />
                        </div>
                        <button onClick={() => props.history.push("/friends")}>Back to Friends List</button>
                    </div>
                </div>
            )
            : (
                <div className='page-wrapper friend-page-wrapper'>
                    <p className="not-found">Sorry, this friend does not exist...</p>
                    <div className="options-wrapper">
                        <div className="spacer-30" />
                        <button onClick={() => props.history.push("/friends")}>Back to Friends List</button>
                    </div>
                </div>
            )
        )
    )
}