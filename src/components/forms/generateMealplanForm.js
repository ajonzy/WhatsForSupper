import React, { useContext, useEffect, useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquare, faSquareCheck } from '@fortawesome/free-regular-svg-icons'
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons'

import LoadingError from '../utils/loadingError'

import titleize from '../../functions/titleize'

import { UserContext } from '../app'

export default function GenerateMealplanForm(props) {
    const { user } = useContext(UserContext)

    const initialData = () => {
        return user.mealplanoutlines.map(outline => ({...outline, number: parseInt(outline.number)})).filter(outline => outline.id === user.settings.default_mealplan_outline)[0] || { name: "", number: "", rules: [] }
    }

    const [outline, setOutline] = useState(initialData().name)
    const [name, setName] = useState(props.edit ? props.mealplan.name : props.data ? props.data.name || initialData().name : initialData().name)
    const [number, setNumber] = useState(props.data ? props.data.number || initialData().number : initialData().number)
    const [rules, setRules] = useState(props.data ? props.data.rules ? props.data.rules.map(rule => ({...rule, type: rule.rule_type})) : initialData().rules : initialData().rules)
    const [saveOutline, setSaveOutline] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const initialState = useRef(true)
    useEffect(() => initialState.current = false, [])

    const handleGenerate = () => {
        setError("")
        setLoading(true)

        if (name === "") {
            setError("Please fill out all required fields.")
            setLoading(false)
        }
        else if (saveOutline && user.mealplanoutlines.map(mealplanoutline => mealplanoutline.name).includes(titleize(name))) {
            setError("Sorry, each saved mealplan outline can not have the same name as a previously saved mealplan outline.")
            setLoading(false)
        }
        else {
            props.handleBuildMealplan(titleize(name), number, rules, saveOutline)
        }
    }

    const handleEdit = () => {
        setError("")

        if (name === "") {
            setError("Please fill out all required fields.")
        }
        else if (name !== props.mealplan.name) {
            setLoading(true)

            fetch(`https://whatsforsupperapi.herokuapp.com/mealplan/update/${props.mealplan.id}`, {
                method: "PUT",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify({
                    name: titleize(name)
                })
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 400) {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                }
                else if (data.status === 200) {
                    props.handleSuccessfulEdit(data.data)
                }
                else {
                    setError("An error occured... Please try again later.")
                    console.log(data)
                    setLoading(false)
                }
            })
            .catch(error => {
                setError("An error occured... Please try again later.")
                console.log("Error updating mealplan: ", error)
                setLoading(false)
            })
        }
    }

    const handleOutlineAdd = async () => {
        setError("")

        if (name === "") {
            setError("Please fill out all required fields.")
            setLoading(false)
        }
        else if (user.mealplanoutlines.map(mealplanoutline => mealplanoutline.name).includes(titleize(name))) {
            setError("Sorry, mealplan outlines can not have the same name as another mealplan outline.")
            setLoading(false)
        }
        else {
            setLoading(true)

            let newData = {}

            let responseData = await fetch("https://whatsforsupperapi.herokuapp.com/mealplanoutline/add", {
                method: "POST",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify({
                    name: titleize(name),
                    number,
                    user_id: user.id
                })
            })
            .then(response => response.json())
            .catch(error => {
                return { catchError: error }
            })  
    
            if (responseData.status === 400) {
                setError("An error occured... Please try again later.")
                console.log(responseData)
                return false
            }
            else if (responseData.catchError) {
                setError("An error occured... Please try again later.")
                console.log("Error adding mealplan outline: ", responseData.catchError)
                return false
            }
            else if (responseData.status === 200) {
                newData = responseData.data
            }
            else {
                setError("An error occured... Please try again later.")
                setLoading(false)
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
                    setError("An error occured... Please try again later.")
                    setLoading(false)
                    return false
                }
                else if (responseData.catchError) {
                    setError("An error occured... Please try again later.")
                    console.log("Error adding rule: ", responseData.catchError)
                    return false
                }
                else if (responseData.status === 200) {
                    newData.rules.push(responseData.data)
                }
                else {
                    setError("An error occured... Please try again later.")
                    setLoading(false)
                    return false
                }
            }
    
            props.handleBuildMealplan(newData)
        }
    }

    const handleOutlineEdit = async () => {
        setError("")

        if (name === "") {
            setError("Please fill out all required fields.")
            setLoading(false)
        }
        else if (name !== props.data.name && user.mealplanoutlines.map(mealplanoutline => mealplanoutline.name).includes(titleize(name))) {
            setError("Sorry, each saved mealplan outline can not have the same name as a previously saved mealplan outline.")
            setLoading(false)
        }
        else {
            setLoading(true)
            let newData = {...props.data}

            const data = await fetch(`https://whatsforsupperapi.herokuapp.com/mealplanoutline/update/${props.data.id}`, {
                method: "PUT",
                headers: { 
                    authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                    "content-type": "application/json" 
                },
                body: JSON.stringify({
                    name: titleize(name),
                    number
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
                console.log("Error updating mealplan outline: ", data.catchError)
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

            const newRules = rules.filter(rule => rule.id === undefined)
            const updatedRules = rules.filter(rule => rule.id !== undefined).filter(rule => {
                const originalRule = newData.rules.filter(newDataRule => newDataRule.id === rule.id)[0]
                if (
                    rule.type !== originalRule.rule_type ||
                    rule.rule !== originalRule.rule ||
                    rule.amount !== originalRule.amount ||
                    titleize(rule.value) !== originalRule.value 
                ) {
                    return rule
                }
            })
            const deletedRules = newData.rules.filter(existingRule => !rules.map(rule => rule.id).includes(existingRule.id))
            if (newRules.length > 0) {
                for (let rule of newRules) {
                    const data = await fetch("https://whatsforsupperapi.herokuapp.com/rule/add", {
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
                     
                    if (data.status === 400) {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                        setLoading(false)
                        return false
                    }
                    else if (data.catchError) {
                        setError("An error occured... Please try again later.")
                        setLoading(false)
                        console.log("Error adding rule: ", data.catchError)
                        return false
                    }
                    else if (data.status === 200) {
                        newData.rules.push(data.data)
                    }
                    else {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                        setLoading(false)
                        return false
                    }
                }
            }

            if (updatedRules.length > 0) {
                for (let rule of updatedRules) {
                    console.log(rule)
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/rule/update/${rule.id}`, {
                        method: "PUT",
                        headers: { 
                            authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                            "content-type": "application/json" 
                        },
                        body: JSON.stringify({
                            rule_type: rule.type,
                            rule: rule.rule,
                            amount: rule.amount || 0,
                            value: titleize(rule.value)
                        })
                    })
                    .then(response => response.json())
                    .catch(error => {
                        return { catchError: error }
                    }) 
                     console.log(data)
                    if (data.status === 400) {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                        setLoading(false)
                        return false
                    }
                    else if (data.catchError) {
                        setError("An error occured... Please try again later.")
                        setLoading(false)
                        console.log("Error adding rule: ", data.catchError)
                        return false
                    }
                    else if (data.status === 200) {
                        newData.rules.splice(newData.rules.findIndex(rule => rule.id === data.data.id), 1, data.data)
                    }
                    else {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                        setLoading(false)
                        return false
                    }
                }
            }

            if (deletedRules.length > 0) {
                for (let rule of deletedRules) {
                    const data = await fetch(`https://whatsforsupperapi.herokuapp.com/rule/delete/${rule.id}`, { 
                        method: "DELETE" ,
                        headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
                    })
                    .then(response => response.json())
                    .catch(error => {
                        return { catchError: error }
                    })  
                    if (data.catchError) {
                        setError("An error occured... Please try again later.")
                        setLoading(false)
                        console.log("Error deleting rule: ", data.catchError)
                        return false
                    }
                    else if (data.status === 200) {
                        newData.rules.splice(newData.rules.findIndex(rule => rule.id === data.data.id), 1)
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

    const handleRulesEdit = () => {
        const newRules = rules.filter(rule => !props.data.rules.map(existingRule => existingRule.id).includes(rule.id))
        const updatedRules = rules.filter(rule => props.data.rules.map(existingRule => existingRule.id).includes(rule.id)).filter(rule => {
            const existingRule = props.data.rules.filter(existingRule => existingRule.id === rule.id)[0]
            return rule.type !== existingRule.rule_type || rule.rule !== existingRule.rule || rule.amount !== existingRule.amount || titleize(rule.value) !== existingRule.value
        })
        const deletedRules = props.data.rules.filter(rule => !rules.map(existingRule => existingRule.id).includes(rule.id))

        if (newRules.length > 0) {
            newRules.forEach(rule => {
                fetch("https://whatsforsupperapi.herokuapp.com/rule/add", {
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
                        mealplan_id: props.data.id
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

        if (updatedRules.length > 0) {
            updatedRules.forEach(rule => {
                fetch(`https://whatsforsupperapi.herokuapp.com/rule/update/${rule.id}`, {
                    method: "PUT",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify({
                        rule_type: rule.type,
                        rule: rule.rule,
                        amount: rule.amount || 0,
                        value: titleize(rule.value)
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status !== 200) {
                        console.log(data)
                    }
                })
                .catch(error => {
                    console.log("Error updating rule: ", error)
                })
            })
        }

        if (deletedRules.length > 0) {
            deletedRules.forEach(rule => {
                fetch(`https://whatsforsupperapi.herokuapp.com/rule/delete/${rule.id}`, { 
                    method: "DELETE" ,
                    headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status !== 200) {
                        console.log(data)
                    }
                })
                .catch(error => {
                    console.log("Error deleting rule: ", error)
                })
            })
        }

        props.handleRulesChange(rules)
    }

    const handleMealplanoutlineSelect = mealplanoutline => {
        if (mealplanoutline === "") {
            setName("")
            setNumber("")
            setRules([])
        }
        else {
            mealplanoutline = user.mealplanoutlines.filter(outline => outline.name === mealplanoutline)[0]
            setName(mealplanoutline.name)
            setNumber(mealplanoutline.number)
            setRules(mealplanoutline.rules.map(rule => ({...rule, type: rule.rule_type})))
        }
    }

    const handleSubmit = event => {
        event.preventDefault()

        if (props.edit) {
            handleEdit()
        }
        else if (props.editRules) {
            handleRulesEdit()
        }
        else if (props.outlineAdd) {
            handleOutlineAdd()
        }
        else if (props.outlineEdit) {
            handleOutlineEdit()
        }
        else {
            handleGenerate()
        }
    }

    const renderHeaderText = () => {
        if (props.edit) {
            return `Edit ${props.mealplan.name}`
        }
        else if (props.editRules) {
            return `Edit ${props.data.name} Rules`
        }
        else if (props.outlineAdd) {
            return "Add a Mealplan Outline"
        }
        else if (props.outlineEdit) {
            return `Edit ${props.data.name} Outline`
        }
        else {
            return "Create a Mealplan"
        }
    }

    const renderSubmitButtonText = () => {
        if (props.edit) {
            return "Edit Mealplan"
        }
        else if (props.editRules) {
            return "Edit Mealplan Rules"
        }
        else if (props.outlineAdd) {
            return "Add Mealplan Outline"
        }
        else if (props.outlineEdit) {
            return "Edit Mealplan Outline"
        }
        else {
            return "Generate Mealplan"
        }
    }

    return (
        <form className='form-wrapper generate-mealplan-form-wrapper'
            onSubmit={handleSubmit}
            autoComplete="off"
        >
            <h3>{renderHeaderText()}</h3>
            {user.mealplanoutlines.length > 0 && !props.editRules && !props.outlineAdd && !props.outlineEdit ? <label>Mealplan Outline</label> : null}
            {user.mealplanoutlines.length > 0 && !props.editRules && !props.outlineAdd && !props.outlineEdit
                ? (
                    <select 
                        value={outline}
                        onChange={event => {
                            handleMealplanoutlineSelect(event.target.value)
                            setOutline(event.target.value)
                        }}
                    >
                        <option value="">None</option>
                        {user.mealplanoutlines.map(mealplanoutline => (
                            <option key={`mealplanoutline-${mealplanoutline.id}`} value={mealplanoutline.name}>{mealplanoutline.name}</option>
                        ))}
                    </select>
                ) 
                : null
            }
            {!props.editRules ? <label>Name</label> : null}
            {!props.editRules
                ? (
                    <input type="text"
                        value = {name}
                        placeholder = "Mealplan Name"
                        onChange={event => {
                            setName(event.target.value)
                            setOutline("")
                        }}
                        autoCapitalize="on"
                        autoCorrect='off'
                        spellCheck="false"
                        autoFocus
                        required
                    />
                )
                : null
            }
            {props.edit || props.editRules ? null : <label>Number of Meals</label>}
            {props.edit || props.editRules
                ? null
                : (
                    <input type="number" 
                        value={number}
                        placeholder="Amount"
                        onChange={event => {
                            setNumber(isNaN(event.target.valueAsNumber) ? "" : event.target.valueAsNumber)
                            setOutline("")
                        }}
                        min="1"
                        required
                    />
                )
            }
            {props.edit ? null : <label>Rules</label>}
            {props.edit
                ? null
                : (
                    <div className="rules-wrapper">
                        {rules.map((rule, index) => (
                            <div className="rule-wrapper" key={`rule-${index}`}>
                                <button type='button' disabled={loading} className='icon-button' onClick={() => {
                                    rules.splice(index, 1)
                                    setRules([...rules])
                                    setOutline("")
                                }}><FontAwesomeIcon icon={faTimesCircle} /></button>
                                <select 
                                    value={rule.type}
                                    onChange={event => {
                                        rule.type = event.target.value
                                        setRules([...rules])
                                        setOutline("")
                                    }}
                                >
                                    <option value="Category">Category</option>
                                    <option value="Name">Name</option>
                                    <option value="Difficulty">Difficulty</option>
                                </select>
                                <select 
                                    value={rule.rule}
                                    onChange={event => {
                                        rule.rule = event.target.value
                                        setRules([...rules])
                                        setOutline("")
                                    }}
                                >
                                    <option value="At least">At least</option>
                                    <option value="No more than">No more than</option>
                                    <option value="Exactly">Exactly</option>
                                    <option value="None">None</option>
                                </select>
                                {rule.rule === "None"
                                    ? null
                                    : (
                                        <input type="number" 
                                            value={rule.amount}
                                            placeholder="Amount"
                                            onChange={event => {
                                                rule.amount = isNaN(event.target.valueAsNumber) ? "" : event.target.valueAsNumber
                                                setRules([...rules])
                                                setOutline("")
                                            }}
                                            min="1"
                                            autoFocus={!initialState.current}
                                            required
                                        />
                                    )
                                }
                                <input type="text" 
                                    value={rule.value}
                                    placeholder="Value"
                                    onChange={event => {
                                        rule.value = event.target.value
                                        setRules([...rules])
                                        setOutline("")
                                    }}
                                    spellCheck="false"
                                    required
                                />
                            </div>
                        ))}
                        <button type='button' disabled={loading} className='alt-button' onClick={() => {
                            rules.push({
                                type: "Category",
                                rule: "At least",
                                amount: "",
                                value: ""
                            })
                            setRules([...rules])
                            setOutline("")
                        }}>Add Rule</button>
                        {outline === "" && !props.editRules && !props.outlineAdd && !props.outlineEdit ? <div className="spacer-30" /> : null}
                        {outline === "" && !props.editRules && !props.outlineAdd && !props.outlineEdit
                            ? (
                                <label className='checkbox'>
                                    Save Mealplan Outline
                                    <input type="checkbox" 
                                        checked={saveOutline}
                                        onChange={event => setSaveOutline(event.target.checked)} 
                                    />
                                    <span>{saveOutline ? <FontAwesomeIcon icon={faSquareCheck} /> : <FontAwesomeIcon icon={faSquare} />}</span>
                                </label>
                            )
                            : null
                        }
                    </div>
                )
            }
            <div className="spacer-40" />
            <button type='submit' disabled={loading}>{renderSubmitButtonText()}</button>
            <LoadingError loading={loading} error={error} />
        </form>
    )
}