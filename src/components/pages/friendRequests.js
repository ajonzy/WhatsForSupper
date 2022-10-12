import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faX } from '@fortawesome/free-solid-svg-icons'

import { UserContext } from '../app'

export default function FriendRequests(props) {
    const { user, setUser } = useContext(UserContext)
    const [outgoingFriendRequests, setOutgoingFriendRequests] = useState(user.outgoing_friend_requests)
    const [incomingFriendRequests, setIncomingFriendRequests] = useState(user.incoming_friend_requests)
    const [problem, setProblem] = useState(false)

    const handleFilter = event => {
        setOutgoingFriendRequests(user.outgoing_friend_requests.filter(friend => (
            friend.username.toLowerCase().includes(event.target.value.toLowerCase())
        )))

        setIncomingFriendRequests(user.incoming_friend_requests.filter(friend => (
            friend.username.toLowerCase().includes(event.target.value.toLowerCase())
        )))
    }

    const handleOutgoingDelete = friendRequest => {
        fetch(`https://whatsforsupperapi.herokuapp.com/user/friend/cancel/${user.id}/${friendRequest.user_id}`, { 
            method: "DELETE",
            headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status !== 200) {
                console.log(data)
                setProblem(true)
            }
        })
        .catch(error => {
            console.log("Error canceling friend request: ", error)
            setProblem(true)
        })

        user.outgoing_friend_requests = user.outgoing_friend_requests.filter(request => request.user_id !== friendRequest.user_id)
        setOutgoingFriendRequests(user.outgoing_friend_requests)
        setUser({...user})
    }

    const handleIncomingDelete = friendRequest => {
        fetch(`https://whatsforsupperapi.herokuapp.com/user/friend/reject/${user.id}/${friendRequest.user_id}`, { 
            method: "DELETE",
            headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status !== 200) {
                console.log(data)
                setProblem(true)
            }
        })
        .catch(error => {
            console.log("Error rejecting friend request: ", error)
            setProblem(true)
        })

        user.incoming_friend_requests = user.incoming_friend_requests.filter(request => request.user_id !== friendRequest.user_id)
        setIncomingFriendRequests(user.incoming_friend_requests)
        setUser({...user})
    }

    const handleAccept = friendRequest => {
        fetch(`https://whatsforsupperapi.herokuapp.com/user/friend/accept/${user.id}/${friendRequest.user_id}`, { 
            method: "DELETE",
            headers: { authorization: "Basic " + Buffer.from(process.env.AUTH_USERNAME + ":" + process.env.AUTH_PASSWORD).toString("base64") } 
        })
        .then(response => response.json())
        .then(data => {
            if (data.status !== 200) {
                console.log(data)
                setProblem(true)
            }
        })
        .catch(error => {
            console.log("Error rejecting friend request: ", error)
            setProblem(true)
        })

        user.incoming_friend_requests = user.incoming_friend_requests.filter(request => request.user_id !== friendRequest.user_id)
        setIncomingFriendRequests(user.incoming_friend_requests)

        user.outgoing_friend_requests = user.outgoing_friend_requests.filter(request => request.user_id !== friendRequest.user_id)
        setOutgoingFriendRequests(user.outgoing_friend_requests)

        user.friends.push(friendRequest)
        setUser({...user})
        props.history.push("/friends")
    }

    const renderFriendRequests = () => {
        if (user.outgoing_friend_requests.length === 0 && user.incoming_friend_requests.length === 0) {
            return (
                <div className='no-content'>No friend requests here...</div>
            )
        }

        outgoingFriendRequests.reverse()
        incomingFriendRequests.reverse()

        const outgoingFriends = outgoingFriendRequests.map(friend => (
            <div key={`outgoing-friend-${friend.user_id}`} className="friend-wrapper outgoing">
                <p className='name'>{friend.username}</p>
                <div className="friends-options-wrapper">
                    <button type='button' className='icon-button' onClick={() => handleOutgoingDelete(friend)}><FontAwesomeIcon icon={faX} /></button>
                </div>
            </div>
        ))

        const incomingFriends = incomingFriendRequests.map(friend => (
            <div key={`incoming-friend-${friend.user_id}`} className="friend-wrapper incoming">
                <p className='name'>{friend.username}</p>
                <div className="friends-options-wrapper">
                    <button type='button' className='icon-button' onClick={() => handleAccept(friend)}><FontAwesomeIcon icon={faCheck} /></button>
                    <button type='button' className='icon-button' onClick={() => handleIncomingDelete(friend)}><FontAwesomeIcon icon={faX} /></button>
                </div>
            </div>
        ))

        if (outgoingFriends.length > 0) {
            outgoingFriends.unshift(
                <h3 className='outgoing-heading' key="outgoing-heading">Outgoing</h3>
            )
        }

        if (incomingFriends.length > 0) {
            incomingFriends.unshift(
                <h3 className='incoming-heading' key="incoming-heading">Incoming</h3>
            )
        }

        return incomingFriends.concat(outgoingFriends)
    }

    return (
        <div className='page-wrapper friend-requests-page-wrapper'>
            <h3>Friend Requests</h3>
            <div className="options-wrapper">
                <Link to="/friends/add"><button>Send Friend Request</button></Link>
                <input type="text"
                    placeholder='Search: usernames'
                    onChange={handleFilter}
                />
            </div>
            <div className="friend-requests-wrapper">
                {renderFriendRequests()}
            </div>
            <div className="spacer-30" />
            <button onClick={() => props.history.push("/friends")}>Back to Friends List</button>
        </div>
    )
}