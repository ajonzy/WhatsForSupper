import React, { useContext, useState } from 'react'

import GenerateMealplanForm from '../forms/generateMealplanForm'
import MealplanForm from '../forms/mealplanForm'

import { UserContext } from '../app'

import generateMeals from '../../functions/generateMeals'

export default function AddMealplan(props) {
    const { user, setUser } = useContext(UserContext)
    const [section, setSection] = useState("mealplan-form")
    const [generatedData, setGeneratedData] = useState({})
    const [generatedMeals, setGeneratedMeals] = useState([])
    const [generatedProblem, setGeneratedProblem] = useState(false)

    const handleBuildMealplan = (name, number, rules, savedOutline) => {
        setGeneratedData({
            name,
            number,
            rules
        })

        setGeneratedMeals(generateMeals(user, number, rules, setGeneratedProblem))
        setSection("mealplan-view")

        if (savedOutline) {
            fetch("https://whatsforsupperapi.herokuapp.com/mealplanoutline/add", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    name,
                    number,
                    user_id: user.id
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 200) {
                    rules.forEach(rule => {
                        fetch("https://whatsforsupperapi.herokuapp.com/rule/add", {
                            method: "POST",
                            headers: { "content-type": "application/json" },
                            body: JSON.stringify({
                                rule_type: rule.type,
                                rule: rule.rule,
                                amount: rule.amount,
                                value: rule.value,
                                mealplanoutline_id: data.data.id
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.status !== 200) {
                                console.log(data)
                            }
                        })
                        .catch(error => {
                            console.log("Error adding rule: ", error)
                        })
                    })
                }
                else {
                    console.log(data)
                }
            })
            .catch(error => {
                console.log("Error adding mealplanoutline: ", error)
            })
        }
    }

    const handleSuccessfulCreateMealplan = data => {
        const newUser = {...user}
        newUser.mealplans.push(data)
        newUser.shoppinglists.push(data.shoppinglist)
        setUser(newUser)
        props.history.push("/mealplans")

    }

    const renderSection = () => {
        switch(section) {
            case "mealplan-form": return <GenerateMealplanForm data={generatedData} handleBuildMealplan={handleBuildMealplan} />
            case "mealplan-view": return <MealplanForm meals={generatedMeals} problem={generatedProblem} data={generatedData} setSection={setSection} handleSuccessfulCreateMealplan={handleSuccessfulCreateMealplan} />
        }
    }

    return (
        (user.meals.length === 0
            ? (
                <div className='page-wrapper add-mealplan-page-wrapper'>
                    <div className="no-content">
                        You don't have any meals yet!
                        <div className="spacer-20" />
                        <button className='fancy-button' onClick={() => props.history.push("/meals/add")}>Create Meal</button>
                    </div>
                </div>
            )
            : (
                <div className='page-wrapper add-mealplan-page-wrapper'>
                    {renderSection()}
                </div>
            )
        )
    )
}