import React, { useContext, useState } from 'react'

import MealForm from '../forms/mealForm'

import { UserContext } from '../app'

export default function EditMeal(props) {
    const { user, setUser } = useContext(UserContext)
    const [meal] = useState(user.meals.filter(meal => meal.id === parseInt(props.match.params.id))[0])

    const handleSuccessfulSubmit = data => {
        user.meals.splice(user.meals.findIndex(meal => meal.id === data.id), 1, data)
        user.mealplans.forEach(mealplan => mealplan.meals.forEach(mealplanMeal => {
            if (mealplanMeal.id === data.id) {
                mealplan.meals.splice(findIndex(meal => meal.id === mealplanMeal.id), 1, data)
            }
        }))
        setUser({...user})
        props.history.push(`/meals/view/${data.id}`)
    }

    return (
        (meal 
            ? (
                <div className='page-wrapper edit-meal-page-wrapper'>
                    <MealForm meal={meal} edit handleSuccessfulSubmit={handleSuccessfulSubmit} />
                    <div className="options-wrapper">
                        <div className="spacer-40" />
                        <button onClick={() => props.history.push(`/meals/view/${meal.id}`)}>Cancel</button>
                    </div>
                </div>
            )
            : (
                <div className='page-wrapper edit-meal-page-wrapper'>
                    <p className="not-found">Sorry, this meal does not exist...</p>
                    <div className="options-wrapper">
                        <div className="spacer-30" />
                        <button onClick={() => props.history.push("/meals")}>Back to Meals</button>
                    </div>
                </div>
            )
        )
    )
}