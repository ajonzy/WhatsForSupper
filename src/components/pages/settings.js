import React, { useContext, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquare, faSquareCheck } from '@fortawesome/free-regular-svg-icons'

import RegisterForm from '../forms/registerForm'

import { UserContext } from '../app'

export default function Settings(props) {
    const { user, setUser, logoutUser } = useContext(UserContext)
    const [changeUsername, setChangeUsername] = useState(false)
    const [changePassword, setChangePassword] = useState(false)
    const [changeEmail, setChangeEmail] = useState(false)
    const [defaultMealplanOutline, setDefaultMealplanOutline] = useState(user.settings.default_mealplan_outline || "None")
    const [autodeleteMealplans, setAutodeleteMealplans] = useState(user.settings.autodelete_mealplans)
    const [autodeleteMealplansScheduleNumber, setAutodeleteMealplansScheduleNumber] = useState(user.settings.autodelete_mealplans_schedule_number)
    const [autodeleteMealplansScheduleUnit, setAutodeleteMealplansScheduleUnit] = useState(user.settings.autodelete_mealplans_schedule_unit)
    const [pluralMealplan, setPluralMealplan] = useState(user.settings.autodelete_mealplans_schedule_number !== 1 ? "s" : "")
    const [defaultShoppinglistSort, setDefaultShoppinglistSort] = useState(user.settings.default_shoppinglist_sort)
    const [autodeleteShoppinglists, setAutodeleteShoppinglists] = useState(user.settings.autodelete_shoppinglists)
    const [autodeleteShoppinglistsScheduleNumber, setAutodeleteShoppinglistsScheduleNumber] = useState(user.settings.autodelete_shoppinglists_schedule_number)
    const [autodeleteShoppinglistsScheduleUnit, setAutodeleteShoppinglistsScheduleUnit] = useState(user.settings.autodelete_shoppinglists_schedule_unit)
    const [pluralShoppinglist, setPluralShoppinglist] = useState(user.settings.autodelete_shoppinglists_schedule_number > 1 ? "s" : "")
    const [allowNotifications, setAllowNotifications] = useState(user.settings.allow_notifications)
    const [allowNonfriendSharing, setAllowNonfriendSharing] = useState(user.settings.allow_nonfriend_sharing)

    const handleSettingsChange = (setting, newValue) => {
        fetch(`https://whatsforsupperapi.herokuapp.com/settings/update/${user.settings.id}`, { 
            method: "PUT",
            headers: { 
                authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                "content-type": "application/json" 
            },
            body: JSON.stringify({
                [setting]: newValue
            }) 
        })
        .then(response => response.json())
        .then(data => {
            if (data.status !== 200) {
                console.log(data)
            }
        })
        .catch(error => {
            console.log("Error updating settings: ", error)
        })

        user.settings[setting] = newValue
        setUser({...user})
    }

    const handleNumberChange = (event, setter, pluralSetter) => {
            setter(isNaN(event.target.valueAsNumber) ? "" : event.target.valueAsNumber)
            if (!isNaN(event.target.valueAsNumber) && event.target.valueAsNumber !== 1) {
                pluralSetter("s")
            }
            else if (!isNaN(event.target.valueAsNumber) && event.target.valueAsNumber === 1) {
                pluralSetter("")
            }
    }

    const checkForEnter = event => {
        if (event.key === "Enter") {
            event.target.blur()
        }
    }

    const handleLogoutAll = () => {
        fetch(`https://whatsforsupperapi.herokuapp.com/user/logout/all/${user.id}`, { 
            method: "DELETE",
            headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status !== 200) {
                console.log(data)
            }
        })
        .catch(error => {
            console.log("Error logging out: ", error)
        })

        logoutUser("all")
    }

    const clearUserInfoChange = () => {
        setChangeUsername(false)
        setChangePassword(false)
        setChangeEmail(false)
    }

    const handleUserInfoChange = setter => {
        clearUserInfoChange()
        setter(true)
    }

    const handleSuccessfulChange = data => {
        setUser(data)
        clearUserInfoChange()
    }

    return (
        <div className='page-wrapper settings-page-wrapper'>
            <h3>Settings</h3>
            <div className="user-info-wrapper">
                <p className="username">Username: <span>{user.username}</span></p>
                <p className="email">Email: <span>{user.email}</span></p>
                <div className="user-info-options-wrapper">
                    {!changeUsername && !changePassword && !changeEmail ? <button onClick={() => handleUserInfoChange(setChangeUsername)}>Change Username</button> : null}
                    {changeUsername ? <RegisterForm edit username handleSuccessfulChange={handleSuccessfulChange} /> : null}
                    {!changeUsername && !changePassword && !changeEmail ? <button onClick={() => handleUserInfoChange(setChangePassword)}>Change Password</button> : null}
                    {changePassword ? <RegisterForm edit password handleSuccessfulChange={handleSuccessfulChange} /> : null}
                    {!changeUsername && !changePassword && !changeEmail ? <button onClick={() => handleUserInfoChange(setChangeEmail)}>Change Email</button> : null}
                    {changeEmail ? <RegisterForm edit email handleSuccessfulChange={handleSuccessfulChange} /> : null}
                    {changeUsername || changePassword || changeEmail ? <button onClick={clearUserInfoChange}>Cancel</button> : null}
                </div>
            </div>
            <div className="settings-options-wrapper">
                <label>
                    Default Mealplan Outline
                    <select 
                        value={defaultMealplanOutline}
                        onChange={event => {
                            if (event.target.value !== defaultMealplanOutline) {
                                handleSettingsChange("default_mealplan_outline", event.target.value === "None" ? null : parseInt(event.target.value))
                            }
                            setDefaultMealplanOutline(event.target.value)
                        }}
                    >
                        <option value="None">None</option>
                        {user.mealplanoutlines.map(outline => <option key={outline.id} value={outline.id}>{outline.name}</option>)}
                    </select>
                </label>

                <label className='checkbox'>
                    Autodelete Mealplans
                    <input type="checkbox" 
                        checked={autodeleteMealplans}
                        onChange={event => {
                            handleSettingsChange("autodelete_mealplans", event.target.checked)
                            setAutodeleteMealplans(event.target.checked)
                        }} 
                    />
                    <span>{autodeleteMealplans ? <FontAwesomeIcon icon={faSquareCheck} /> : <FontAwesomeIcon icon={faSquare} />}</span>
                </label>

                <div className={`autodelete-wrapper ${!autodeleteMealplans ? "disabled" : null}`}>
                    <p>Autodelete Mealplans After: </p>
                    <input type="number"
                        disabled={!autodeleteMealplans}
                        value={autodeleteMealplansScheduleNumber}
                        placeholder="Amount"
                        onKeyUp={checkForEnter}
                        onChange={event => handleNumberChange(event, setAutodeleteMealplansScheduleNumber, setPluralMealplan)}
                        onBlur={() => {
                            if (autodeleteMealplansScheduleNumber !== "") {
                                handleSettingsChange("autodelete_mealplans_schedule_number", autodeleteMealplansScheduleNumber)
                            }
                        }}
                    />
                    <select 
                        disabled={!autodeleteMealplans}
                        value={autodeleteMealplansScheduleUnit}
                        onChange={event => {
                            if (event.target.value !== autodeleteMealplansScheduleUnit) {
                                handleSettingsChange("autodelete_mealplans_schedule_unit", event.target.value)
                            }
                            setAutodeleteMealplansScheduleUnit(event.target.value)
                        }}
                    >
                        <option value="day">Day{pluralMealplan}</option>
                        <option value="week">Week{pluralMealplan}</option>
                        <option value="month">Month{pluralMealplan}</option>
                    </select>
                </div>

                <label>
                    Default Shopping List Sort
                    <select 
                        value={defaultShoppinglistSort}
                        onChange={event => {
                            if (event.target.value !== defaultShoppinglistSort) {
                                handleSettingsChange("default_shoppinglist_sort", event.target.value)
                            }
                            setDefaultShoppinglistSort(event.target.value)
                        }}
                    >
                        <option value="arbitrary">Arbitrary</option>
                        <option value="alphabetical">Alphabetical</option>
                        <option value="category">Category</option>
                        <option value="remaining">Remaining</option>
                    </select>
                </label>

                <label className='checkbox'>
                    Autodelete Shoppinglists
                    <input type="checkbox" 
                        checked={autodeleteShoppinglists}
                        onChange={event => {
                            handleSettingsChange("autodelete_shoppinglists", event.target.checked)
                            setAutodeleteShoppinglists(event.target.checked)
                        }} 
                    />
                    <span>{autodeleteShoppinglists ? <FontAwesomeIcon icon={faSquareCheck} /> : <FontAwesomeIcon icon={faSquare} />}</span>
                </label>

                <div className={`autodelete-wrapper ${!autodeleteShoppinglists ? "disabled" : null}`}>
                    <p>Autodelete Shopping Lists After: </p>
                    <input type="number"
                        disabled={!autodeleteShoppinglists}
                        value={autodeleteShoppinglistsScheduleNumber}
                        placeholder="Amount"
                        onKeyUp={checkForEnter}
                        onChange={event => handleNumberChange(event, setAutodeleteShoppinglistsScheduleNumber, setPluralShoppinglist)}
                        onBlur={() => {
                            if (autodeleteShoppinglistsScheduleNumber !== "") {
                                handleSettingsChange("autodelete_shoppinglists_schedule_number", autodeleteShoppinglistsScheduleNumber)
                            }
                        }}
                    />
                    <select 
                        disabled={!autodeleteShoppinglists}
                        value={autodeleteShoppinglistsScheduleUnit}
                        onChange={event => {
                            if (event.target.value !== autodeleteShoppinglistsScheduleUnit) {
                                handleSettingsChange("autodelete_shoppinglists_schedule_unit", event.target.value)
                            }
                            setAutodeleteShoppinglistsScheduleUnit(event.target.value)
                        }}
                    >
                        <option value="day">Day{pluralShoppinglist}</option>
                        <option value="week">Week{pluralShoppinglist}</option>
                        <option value="month">Month{pluralShoppinglist}</option>
                    </select>
                </div>

                <label className='checkbox'>
                    Allow Notifications
                    <input type="checkbox" 
                        checked={allowNotifications}
                        onChange={event => {
                            handleSettingsChange("allow_notifications", event.target.checked)
                            setAllowNotifications(event.target.checked)
                        }} 
                    />
                    <span>{allowNotifications ? <FontAwesomeIcon icon={faSquareCheck} /> : <FontAwesomeIcon icon={faSquare} />}</span>
                </label>

                <label className='checkbox'>
                    Allow Non-friend Sharing
                    <input type="checkbox" 
                        checked={allowNonfriendSharing}
                        onChange={event => {
                            handleSettingsChange("allow_nonfriend_sharing", event.target.checked)
                            setAllowNonfriendSharing(event.target.checked)
                        }} 
                    />
                    <span>{allowNonfriendSharing ? <FontAwesomeIcon icon={faSquareCheck} /> : <FontAwesomeIcon icon={faSquare} />}</span>
                </label>
            </div>
            <div className="settings-actions-wrapper">
                <button onClick={handleLogoutAll}>Logout from All Devices</button>
            </div>
        </div>
    )
}