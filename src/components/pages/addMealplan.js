import React, { useContext, useState } from 'react'

import GenerateMealplanForm from '../forms/generateMealplanForm'
import MealplanForm from '../forms/mealplanForm'

import { UserContext } from '../app'

import generateMeals from '../../functions/generateMeals'
import titleize from '../../functions/titleize'

export default function AddMealplan(props) {
    const { user, setUser } = useContext(UserContext)
    const [section, setSection] = useState("mealplan-form")
    const [generatedData, setGeneratedData] = useState({})
    const [generatedMeals, setGeneratedMeals] = useState([])
    const [generatedProblem, setGeneratedProblem] = useState(false)

    const handleSaveOutline = async (name, number, rules) => {
        let newData = {}

        let responseData = await fetch("https://whatsforsupperapi.herokuapp.com/mealplanoutline/add", {
            method: "POST",
            headers: { 
                authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                "content-type": "application/json" 
            },
            body: JSON.stringify({
                name,
                number,
                user_id: user.id
            })
        })
        .then(response => response.json())
        .catch(error => {
            return { catchError: error }
        })  

        if (responseData.status === 400) {
            console.log(responseData)
            return false
        }
        else if (responseData.catchError) {
            console.log("Error adding mealplan outline: ", responseData.catchError)
            return false
        }
        else if (responseData.status === 200) {
            newData = responseData.data
        }
        else {
            console.log(responseData)
            return false
        }

        for (let rule of rules) {
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
                    mealplanoutline_id: newData.id
                })
            })
            .then(response => response.json())
            .catch(error => {
                return { catchError: error }
            }) 
                
            if (responseData.status === 400) {
                console.log(responseData)
                return false
            }
            else if (responseData.catchError) {
                console.log("Error adding rule: ", responseData.catchError)
                return false
            }
            else if (responseData.status === 200) {
                newData.rules.push(responseData.data)
            }
            else {
                console.log(responseData)
                return false
            }
        }

        user.mealplanoutlines.push(newData)
        setUser({...user})
    }

    const handleBuildMealplan = (name, number, rules, savedOutline) => {
        setGeneratedData({
            name,
            number,
            rules
        })

        setGeneratedMeals(generateMeals(user, number, rules, setGeneratedProblem))
        setSection("mealplan-view")

        if (savedOutline) {
            handleSaveOutline(name, number, rules)
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
                    <div className="options-wrapper">
                        <div className="spacer-40" />
                        <button onClick={() => props.history.push("/mealplans")}>Cancel</button>
                    </div>
                </div>
            )
        )
    )
}