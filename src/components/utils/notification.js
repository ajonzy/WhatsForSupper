import React, { useContext, useEffect, useState } from 'react'
import { useSpring, animated, easings } from 'react-spring'

import { UserContext } from '../app'

export default function Notification(props) {
    const { user, setUser } = useContext(UserContext)
    const [notification] = useState(props.notification)
    const styleProps = useSpring({ to: { opacity: user.settings.allow_notifications ? 1 : 0, transform: "translateY(-0%)" }, from: { opacity: 0, transform: "translateY(-100%)" }, config: { duration: 200, easing: easings.easeInOutBounce }})

    const handleNotification = (notification, path) => {
        fetch(`https://whatsforsupperapi.herokuapp.com/notification/delete/single/${notification.id}`, { 
            method: "DELETE",
            headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
        })
        const notifications = user.notifications
        notifications.splice(notifications.findIndex(existingNotification => existingNotification.id === notification.id), 1)
        setUser({...user})
        if (path) {
            props.history.push(path)
        }
    }

    const handleNotifications = () => {
        fetch(`https://whatsforsupperapi.herokuapp.com/notification/delete/all/${user.id}`, { 
            method: "DELETE",
            headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
        })
        user.notifications = []
        setUser({...user})
    }

    useEffect(() => {
        if (!user.settings.allow_notifications) {
            handleNotifications()
        }
    })

    switch(notification.category) {
        case "friendrequest": {
            return (
                <animated.div style={styleProps} className="notification-wrapper" key={`notification-${notification.id}`}>
                    <div className="text-wrapper">
                        <span className="username">{notification.username} </span>
                        <span className="text">has sent you a friend request!</span>
                    </div>
                    <div className="options-wrapper">
                        <span className="option" onClick={() => handleNotification(notification, "/friends/requests")}>View</span>
                        <span>|</span>
                        <span className="option" onClick={() => handleNotification(notification)}>Dismiss</span>
                        {user.notifications.length > 1 ? <span>|</span> : null}
                        {user.notifications.length > 1 ? <span className="option" onClick={handleNotifications}>Dismiss&nbsp;All</span> : null}
                    </div>
                    {user.notifications.length > 1 ? <span className='additional'>+{user.notifications.length - 1} more</span> : null}
                </animated.div>
            )
        }
        case "friend": {
            return (
                <animated.div style={styleProps} className="notification-wrapper" key={`notification-${notification.id}`}>
                    <div className="text-wrapper">
                        <span className="username">{notification.username} </span>
                        <span className="text">has accepted your friend request!</span>
                    </div>
                    <div className="options-wrapper">
                        <span className="option" onClick={() => handleNotification(notification, `/friends/view/${notification.username}`)}>View</span>
                        <span>|</span>
                        <span className="option" onClick={() => handleNotification(notification)}>Dismiss</span>
                        {user.notifications.length > 1 ? <span>|</span> : null}
                        {user.notifications.length > 1 ? <span className="option" onClick={handleNotifications}>Dismiss&nbsp;All</span> : null}
                    </div>
                    {user.notifications.length > 1 ? <span className='additional'>+{user.notifications.length - 1} more</span> : null}
                </animated.div>
            )
        }
        case "meal": {
            const item = user.shared_meals.filter(meal => meal.name === notification.name && meal.user_username === notification.username)[0]
            return (
                <animated.div style={styleProps} className="notification-wrapper" key={`notification-${notification.id}`}>
                    <div className="text-wrapper">
                        <span className="username">{notification.username} </span>
                        <span className="text">has shared a meal with you: </span>
                        <span className="name">{notification.name}</span>
                        <span className="text">!</span>
                    </div>
                    <div className="options-wrapper">
                        <span className="option" onClick={() => handleNotification(notification, `/meals/view/${item.id}`)}>View</span>
                        <span>|</span>
                        <span className="option" onClick={() => handleNotification(notification)}>Dismiss</span>
                        {user.notifications.length > 1 ? <span>|</span> : null}
                        {user.notifications.length > 1 ? <span className="option" onClick={handleNotifications}>Dismiss&nbsp;All</span> : null}
                    </div>
                    {user.notifications.length > 1 ? <span className='additional'>+{user.notifications.length - 1} more</span> : null}
                </animated.div>
            )
        }
        case "mealplan": {
            const item = user.shared_mealplans.filter(mealplan => mealplan.name === notification.name && mealplan.user_username === notification.username)[0]
            return (
                <animated.div style={styleProps} className="notification-wrapper" key={`notification-${notification.id}`}>
                    <div className="text-wrapper">
                        <span className="username">{notification.username} </span>
                        <span className="text">has shared a mealplan with you: </span>
                        <span className="name">{notification.name}</span>
                        <span className="text">!</span>
                    </div>
                    <div className="options-wrapper">
                        <span className="option" onClick={() => handleNotification(notification, `/mealplans/view/${item.id}`)}>View</span>
                        <span>|</span>
                        <span className="option" onClick={() => handleNotification(notification)}>Dismiss</span>
                        {user.notifications.length > 1 ? <span>|</span> : null}
                        {user.notifications.length > 1 ? <span className="option" onClick={handleNotifications}>Dismiss&nbsp;All</span> : null}
                    </div>
                    {user.notifications.length > 1 ? <span className='additional'>+{user.notifications.length - 1} more</span> : null}
                </animated.div>
            )
        }
        case "shoppinglist": {
            const item = user.shared_shoppinglists.filter(shoppinglist => shoppinglist.name === notification.name && shoppinglist.user_username === notification.username)[0]
            return (
                <animated.div style={styleProps} className="notification-wrapper" key={`notification-${notification.id}`}>
                    <div className="text-wrapper">
                        <span className="username">{notification.username} </span>
                        <span className="text">has shared a shopping list with you: </span>
                        <span className="name">{notification.name}</span>
                        <span className="text">!</span>
                    </div>
                    <div className="options-wrapper">
                        <span className="option" onClick={() => handleNotification(notification, `/shoppinglists/view/${item.id}`)}>View</span>
                        <span>|</span>
                        <span className="option" onClick={() => handleNotification(notification)}>Dismiss</span>
                        {user.notifications.length > 1 ? <span>|</span> : null}
                        {user.notifications.length > 1 ? <span className="option" onClick={handleNotifications}>Dismiss&nbsp;All</span> : null}
                    </div>
                    {user.notifications.length > 1 ? <span className='additional'>+{user.notifications.length - 1} more</span> : null}
                </animated.div>
            )
        }
    }
}