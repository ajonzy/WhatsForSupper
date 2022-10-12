import { io } from "socket.io-client"

export default function sockets(getUser, setUser) {
    const socket = io("https://whatsforsupperapi.herokuapp.com/")

          socket.on("friend-request-update", data => {
            if (getUser().id === data.data.friend.id) {
              const friendsList = getUser().incoming_friend_requests
              const notifications = getUser().notifications
              switch(data.type) {
                case "add": {
                  const friend = { user_id: data.data.user.id, username: data.data.user.username }
                  friendsList.push(friend)
                  notifications.push(data.data.notification)
                  break
                }
                case "delete": {
                  friendsList.splice(friendsList.findIndex(friend => friend.user_id === data.data.user.id), 1)
                  if (data.data.notification) {
                    notifications.splice(notifications.findIndex(notification => notification.id === data.data.notification.id), 1)
                  }
                  break
                }
              }
              setUser({...getUser()})
            }
          })

          socket.on("shared-friend-request-update", data => {
            if (getUser().id === data.data.friend.id) {
              const friendsList = getUser().outgoing_friend_requests
              friendsList.splice(friendsList.findIndex(friend => friend.user_id === data.data.user.id), 1)
              setUser({...getUser()})
            }
          })

          socket.on("friend-update", data => {
            if (getUser().id === data.data.friend.id) {
              const friendsList = getUser().friends
              const incomingFriendsList = getUser().incoming_friend_requests
              const outgoingFriendsList = getUser().outgoing_friend_requests
              const notificationsList = getUser().notifications
              switch(data.type) {
                case "add": {
                  const friend = { user_id: data.data.user.id, username: data.data.user.username }
                  friendsList.push(friend)
                  if (incomingFriendsList.filter(friend => friend.user_id === data.data.user.id).length > 0) {
                    incomingFriendsList.splice(incomingFriendsList.findIndex(friend => friend.user_id === data.data.user.id), 1)
                  }
                  if (outgoingFriendsList.filter(friend => friend.user_id === data.data.user.id).length > 0) {
                    outgoingFriendsList.splice(outgoingFriendsList.findIndex(friend => friend.user_id === data.data.user.id), 1)
                  }
                  notificationsList.push(data.data.notification)
                  if (data.data.removed_notification.id) {
                    notificationsList.splice(notificationsList.findIndex(notification => notification.id === data.data.removed_notification.id), 1)
                  }
                  break
                }
                case "delete": {
                  friendsList.splice(friendsList.findIndex(friend => friend.user_id === data.data.user.id), 1)
                  break
                }
              }
              console.log(getUser())
              setUser({...getUser()})
            }
          })

          socket.on("meal-share-update", data => {
            if (getUser().id === data.data.user.id) {
              const meals = getUser().shared_meals
              const notifications = getUser().notifications
              switch(data.type) {
                case "add": {
                  meals.push(data.data.meal)
                  notifications.push(data.data.notification)
                  break
                }
                // TODO: Add possible update functionality
              }
              setUser({...getUser()})
            }
          })

          socket.on("mealplan-share-update", data => {
            if (getUser().id === data.data.user.id) {
              const mealplans = getUser().shared_mealplans
              const shoppinglists = getUser().shared_shoppinglists
              const notifications = getUser().notifications
              switch(data.type) {
                case "add": {
                  mealplans.push(data.data.mealplan)
                  if (data.data.mealplan.shoppinglist) {
                    shoppinglists.push(data.data.mealplan.shoppinglist)
                  }
                  if (data.data.mealplan.sub_shoppinglist) {
                    shoppinglists.push(data.data.mealplan.sub_shoppinglist)
                  }
                  notifications.push(data.data.notification)
                  break
                }
                // TODO: Add possible update functionality
              }
              setUser({...getUser()})
            }
          })

          socket.on("shoppinglist-share-update", data => {
            if (getUser().id === data.data.user.id) {
              const shoppinglists = getUser().shared_shoppinglists
              const notifications = getUser().notifications
              switch(data.type) {
                case "add": {
                  shoppinglists.push(data.data.shoppinglist)
                  if (data.data.shoppinglist.mealplan_id) {
                    getUser().shared_mealplans.filter(mealplan => mealplan.id === data.data.shoppinglist.mealplan_id)[0].sub_shoppinglist = data.data.shoppinglist
                  }
                  else {
                    notifications.push(data.data.notification)
                  }
                  break
                }
                case "delete": {
                  shoppinglists.splice(shoppinglists.findIndex(shoppinglist => shoppinglist.id === data.data.shoppinglist.id), 1)
                  if (data.data.shoppinglist.mealplan_id) {
                    getUser().shared_mealplans.filter(mealplan => mealplan.id === data.data.shoppinglist.mealplan_id)[0].sub_shoppinglist = {}
                  }
                  break
                }
                // TODO: Add possible update functionality
              }
              setUser({...getUser()})
            }
          })

          socket.on("shoppingingredient-update", data => {
            const sharedShoppinglist = getUser().shared_shoppinglists.filter(shoppinglist => shoppinglist.id === data.data.shoppinglist_id)[0]
            if (sharedShoppinglist) {
              switch(data.type) {
                case "add": {
                  sharedShoppinglist.shoppingingredients.push(data.data)
                  break
                }
                case "update": {
                  sharedShoppinglist.shoppingingredients.splice(sharedShoppinglist.shoppingingredients.findIndex(ingredient => ingredient.id === data.data.id), 1, data.data)
                  break
                }
                case "delete": {
                  sharedShoppinglist.shoppingingredients.splice(sharedShoppinglist.shoppingingredients.findIndex(ingredient => ingredient.id === data.data.id), 1)
                  break
                }
              }
              setUser({...getUser()})
            }
          })

          socket.on("shoppingingredient-update-multiple", data => {
            data.data.forEach(shoppingingredient => {
              const sharedShoppinglist = getUser().shared_shoppinglists.filter(shoppinglist => shoppinglist.id === shoppingingredient.shoppinglist_id)[0]
              if (sharedShoppinglist) {
                sharedShoppinglist.shoppingingredients.push(shoppingingredient)
                setUser({...getUser()})
              }
            })
          })

          socket.on("shared-shoppingingredient-update", data => {
            const shoppinglist = getUser().shoppinglists.filter(shoppinglist => shoppinglist.id === data.data.shoppinglist_id)[0]
            const sharedShoppinglist = getUser().shared_shoppinglists.filter(shoppinglist => shoppinglist.id === data.data.shoppinglist_id)[0]
            if (shoppinglist) {
              switch(data.type) {
                case "add": {
                  shoppinglist.shoppingingredients.push(data.data)
                  break
                }
                case "update": {
                  shoppinglist.shoppingingredients.splice(shoppinglist.shoppingingredients.findIndex(ingredient => ingredient.id === data.data.id), 1, data.data)
                  break
                }
                case "delete": {
                  shoppinglist.shoppingingredients.splice(shoppinglist.shoppingingredients.findIndex(ingredient => ingredient.id === data.data.id), 1)
                  break
                }
              }
            }
            if (sharedShoppinglist) {
              switch(data.type) {
                case "add": {
                  sharedShoppinglist.shoppingingredients.push(data.data)
                  break
                }
                case "update": {
                  sharedShoppinglist.shoppingingredients.splice(sharedShoppinglist.shoppingingredients.findIndex(ingredient => ingredient.id === data.data.id), 1, data.data)
                  break
                }
                case "delete": {
                  sharedShoppinglist.shoppingingredients.splice(sharedShoppinglist.shoppingingredients.findIndex(ingredient => ingredient.id === data.data.id), 1)
                  break
                }
              }
            }
            setUser({...getUser()})
          })

    return socket
}