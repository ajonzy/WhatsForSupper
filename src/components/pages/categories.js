import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { faCheck, faX } from '@fortawesome/free-solid-svg-icons'

import ConfirmLoadingError from '../utils/confirmLoadingError'

import { UserContext } from '../app'

import titleize from '../../functions/titleize'

export default function Categories(props) {
    const { user, setUser } = useContext(UserContext)
    const [categoriesList, setCategoriesList] = useState(user.categories)
    const [edit, setEdit] = useState("")
    const [editId, setEditId] = useState(-1)
    const [confirm, setConfirm] = useState(false)
    const [confirmId, setConfirmId] = useState(-1)

    const handleFilter = event => {
        setCategoriesList(user.categories.filter(category => (
            category.name.toLowerCase().includes(event.target.value.toLowerCase())
        )))
    }

    const handleEdit = category => {
        if (editId !== -1) {
            if (edit === "" || edit === category.name) {
                setEdit("")
                setEditId(-1)
            }
            else {
                fetch(`https://whatsforsupperapi.herokuapp.com/category/update/${category.id}`, {
                    method: "PUT",
                    headers: { 
                        authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64"),
                        "content-type": "application/json" 
                    },
                    body: JSON.stringify({
                        name: edit
                    })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status !== 200) {
                        setError("An error occured... Please try again later.")
                        console.log(data)
                        setLoading(false)
                    }
                })
                .catch(error => {
                    setError("An error occured... Please try again later.")
                    console.log("Error logging in: ", error)
                    setLoading(false)
                })

                category.name = titleize(edit)
                user.categories.splice(user.categories.findIndex(userCategory => userCategory.id === category.id), 1, category)
                user.meals.filter(meal => meal.categories.map(category => category.id).includes(category.id)).forEach(meal => meal.categories.splice(meal.categories.findIndex(mealCategory => mealCategory.id === category.id), 1, category))
                setUser({...user})
                setCategoriesList([...categoriesList])
                setEdit("")
                setEditId(-1)
            }
        }
        else {
            setEdit(category.name)
            setEditId(category.id)
        }
    }

    const handleCancel = () => {
        setEdit("")
        setEditId(-1)
    }

    const handleDelete = category => {
        if (confirm && confirmId === category.id) {
            fetch(`https://whatsforsupperapi.herokuapp.com/category/delete/${category.id}`, { 
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
                console.log("Error deleting category: ", error)
            })

            user.categories = user.categories.filter(userCategory => userCategory.id !== category.id)
            user.meals.filter(meal => meal.categories.map(category => category.id).includes(category.id)).forEach(meal => meal.categories.splice(meal.categories.findIndex(mealCategory => mealCategory.id === category.id), 1))
            setUser({...user})
            setCategoriesList(categoriesList.filter(existingCategory => existingCategory.id !== category.id))
        }
        else {
            setConfirm(true)
            setConfirmId(category.id)
        }
    }

    const renderCategoryEdit = category => {
        return (
            <div key={`category-${category.id}`} className="category-wrapper">
                <input type="text" 
                    value={edit}
                    placeholder="Name"
                    onChange={event => setEdit(event.target.value)}
                    required
                />
                <div className="options-wrapper">
                    <button type='button' className='icon-button' onClick={() => handleEdit(category)}><FontAwesomeIcon icon={faCheck} /></button>
                    <button type='button' className='icon-button' onClick={handleCancel}><FontAwesomeIcon icon={faX} /></button>
                </div>
            </div>
        )
    }

    const renderCategories = () => {
        if (user.categories.length === 0) {
            return (
                <div className='no-content'>No outlines here yet...</div>
            )
        }

        categoriesList.sort((categoryA, categoryB) => categoryA.id - categoryB.id).reverse()

        return categoriesList.map(category => (
            editId === category.id
            ? renderCategoryEdit(category)
            : (
                <div key={`category-${category.id}`} className="category-wrapper">
                    <p className='name'>{category.name}</p>
                    <div className="options-wrapper">
                        <button type='button' className='icon-button' onClick={() => handleEdit(category)}><FontAwesomeIcon icon={faPenToSquare} /></button>
                        <button type='button' className='icon-button' onClick={() => handleDelete(category)}><FontAwesomeIcon icon={faTrashCan} /></button>
                    </div>
                    {confirmId === category.id ? <ConfirmLoadingError confirm={confirm} loading={false} error={""} item={category.name} /> : null}
                </div>
            )
        ))
    }

    return (
        <div className='page-wrapper categories-page-wrapper'>
            <h3>Meal Categories</h3>
            <div className="options-wrapper">
                <Link to="/mealcategories/add"><button>Add Meal Category</button></Link>
                <input type="text"
                    placeholder='Search: category names'
                    onChange={handleFilter}
                />
            </div>

            <div className="categories-wrapper">
                {renderCategories()}
            </div>
        </div>
    )
}