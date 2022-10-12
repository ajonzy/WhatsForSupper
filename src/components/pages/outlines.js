import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPenToSquare, faTrashCan } from '@fortawesome/free-regular-svg-icons'

import ConfirmLoadingError from '../utils/confirmLoadingError'

import { UserContext } from '../app'

export default function Outlines(props) {
    const { user, setUser } = useContext(UserContext)
    const [outlinesList, setOutlinesList] = useState(user.mealplanoutlines)
    const [confirm, setConfirm] = useState(false)
    const [confirmId, setConfirmId] = useState(-1)

    const handleFilter = event => {
        setOutlinesList(user.mealplanoutlines.filter(outline => (
            outline.name.toLowerCase().includes(event.target.value.toLowerCase())
        )))
    }

    const handleDelete = outline => {
        if (confirm && confirmId === outline.id) {
            fetch(`https://whatsforsupperapi.herokuapp.com/mealplanoutline/delete/${outline.id}`, { 
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
                console.log("Error deleting mealplan outline: ", error)
            })

            user.mealplanoutlines = user.mealplanoutlines.filter(mealplanoutline => mealplanoutline.id !== outline.id)
            setUser({...user})
            setOutlinesList(outlinesList.filter(mealplanoutline => mealplanoutline.id !== outline.id))
        }
        else {
            setConfirm(true)
            setConfirmId(outline.id)
        }
    }

    const renderOutlines = () => {
        if (user.mealplanoutlines.length === 0) {
            return (
                <div className='no-content'>No outlines here yet...</div>
            )
        }

        outlinesList.sort((outlineA, outlineB) => outlineA.id - outlineB.id).reverse()

        return outlinesList.map(outline => (
            <div key={`outline-${outline.id}`} className="outline-wrapper">
                <p className='name'>{outline.name}</p>
                <div className="options-wrapper">
                    <button type='button' className='icon-button' onClick={() => props.history.push(`/mealplanoutlines/edit/${outline.id}`)}><FontAwesomeIcon icon={faPenToSquare} /></button>
                    <button type='button' className='icon-button' onClick={() => handleDelete(outline)}><FontAwesomeIcon icon={faTrashCan} /></button>
                </div>
                {confirmId === outline.id ? <ConfirmLoadingError confirm={confirm} loading={false} error={""} item={outline.name} /> : null}
            </div>
        ))
    }

    return (
        <div className='page-wrapper outlines-page-wrapper'>
            <h3>Mealplan Outlines</h3>
            <div className="options-wrapper">
                <Link to="/mealplanoutlines/add"><button>Add Mealplan Outline</button></Link>
                <input type="text"
                    placeholder='Search: outline names'
                    onChange={handleFilter}
                />
            </div>

            <div className="outlines-wrapper">
                {renderOutlines()}
            </div>
        </div>
    )
}