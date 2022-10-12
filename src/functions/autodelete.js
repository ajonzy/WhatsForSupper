export default function autodelete(type, user) {
    const number = type === "mealplan" ? user.settings.autodelete_mealplans_schedule_number : user.settings.autodelete_shoppinglists_schedule_number
    const unit = type === "mealplan" ? user.settings.autodelete_mealplans_schedule_unit : user.settings.autodelete_shoppinglists_schedule_unit
    const data = type === "mealplan" ? user.mealplans : user.shoppinglists.filter(shoppinglist => !shoppinglist.mealplan_id)
    const expiredData = data.filter(item => {
        const now = new Date()
        let itemDate = new Date(item.created_on)
        switch (unit) {
            case "day": {
                itemDate.setDate(itemDate.getDate() + number)
                break
            }
            case "week": {
                itemDate.setDate(itemDate.getDate() + (number * 7))
                break
            }
            case "month": {
                itemDate.setMonth(itemDate.getMonth() + number)
                break
            }
        }
        return itemDate <= now
    })

    expiredData.forEach(item => {
        fetch(`https://whatsforsupperapi.herokuapp.com/${type}/delete/${item.id}`, { 
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
            console.log(`Error deleting ${type}: `, error)
        })
    })

    return [...data.filter(item => !expiredData.map(expiredItem => expiredItem.id).includes(item.id)), ...user.shoppinglists.filter(shoppinglist => shoppinglist.mealplan_id)]
}