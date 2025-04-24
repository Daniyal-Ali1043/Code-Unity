import React from 'react';
import chatAppLogo from '../assets/CodeUnity.png'; // Ensure the logo path is correct

const NoConversation = () => {
    return (
        <div className='d-flex flex-column align-items-center justify-content-center w-100' style={{ height: '100vh' }}>
            <img src={chatAppLogo} alt="Chat App" style={{ width: "300px", marginBottom: "10px" }} />
            <p className='text-slate-800 h4'>Select user to send message</p>
            </div>
    );
};

export default NoConversation;
