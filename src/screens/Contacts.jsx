import { useEffect, useState } from "react";
import styled from "styled-components"
import socket from "../Socket"
import { useNavigate } from 'react-router-dom'


function ContactCard({user, handleCall}) {
    
    return (
        <div className="row w-100 mx-0 p-2 align-items-center">
            <div className="col-2 btn">
                <i className="bi bi-person-circle h3"></i>
            </div>
            <div className="col-8">{user}</div>
            <div className="col-2 h5 py-0 my-0 text-end btn" onClick={() => handleCall(user)}>
                <i className="bi bi-telephone-fill text-success"></i>
            </div>
        </div>
    )
}

function Contacts() {
    const [connectedUsers, setConnectedUsers] = useState([]);
    const navigate = useNavigate()

    const handleCall = (user) => {
        if(user) navigate(`/videoroom/${user}`)
    }

    useEffect(() => {
        if (!socket.connected) socket.connect();
    
        socket.on("allUsers", (users) => {
          setConnectedUsers(users);
        });
    
      }, []);
    
    return (
        <div>
            <Body className="m-auto">
                <Header>Contacts</Header>
                <div>
                    <div className="fs-4 text-secondary px-3 py-2">Online ({connectedUsers.length}) </div>
                    <hr />
                    {
                        connectedUsers?.map((user, idx) => {
                            return (<ContactCard user={user?.id} handleCall={handleCall} key={idx} />)
                        })
                    }
                </div>
            </Body>
        </div>
    )
}

export default Contacts

const Body = styled.div`
    width: 100%;
    max-width: 600px;
    display: flex;
    flex-direction: column;
`
const Header = styled.header`
    padding: 15px;
    width: 100%;
    background-color: #884AB2;
    text-align: center;
    font-size: 20px;
    font-weight: 600px;
`
const ContactList = styled.div`
    width: 100%;
`