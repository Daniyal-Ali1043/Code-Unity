import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const ComChatWindow = ({ user, onBack }) => {
  const [messages, setMessages] = useState([
    {
      text: `Hi, ${user.name}. I’m facing some challenges in optimizing my code for performance. Can you help?`,
      sender: user.name,
      time: '12:45 PM',
      type: 'received',
    },
    {
      text: `Hi, ${user.name} 👋 I'd be glad to help you with optimizing your code for better performance.`,
      sender: 'You',
      time: '12:55 PM',
      type: 'sent',
    },
  ]);

  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim()) {
      setMessages([
        ...messages,
        { text: input, sender: 'You', time: '1:05 PM', type: 'sent' },
      ]);
      setInput('');
    }
  };

  return (
    <div
      className="d-flex flex-column bg-white rounded shadow-sm"
      style={{
        flexGrow: 1,
        maxWidth: '55%',
        marginLeft: '20px',
        height: '100%',
        padding: '15px',
      }}
    >
      {/* Chat Header */}
      <div
        className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3"
        style={{ padding: '10px 20px' }}
      >
        <span
          className="d-lg-none"
          style={{
            fontSize: '24px',
            cursor: 'pointer',
          }}
          onClick={onBack}
        >
          ←
        </span>
        <h5 className="m-0">{user.name}</h5>
        <p className="text-muted mb-0">{user.time}</p>
      </div>

      {/* Chat Messages */}
      <div
        className="flex-grow-1 overflow-auto"
        style={{
          padding: '20px',
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`d-flex flex-column ${
              msg.type === 'sent' ? 'align-items-end' : 'align-items-start'
            } mb-3`}
          >
            <p
              className={`mb-1 p-2 rounded ${
                msg.type === 'sent'
                  ? 'bg-primary text-white'
                  : 'bg-light text-dark'
              }`}
              style={{
                maxWidth: '70%',
              }}
            >
              {msg.text}
            </p>
            <span className="text-muted" style={{ fontSize: '0.75rem' }}>
              {msg.time}
            </span>
          </div>
        ))}
      </div>

      {/* Chat Input */}
      <div
        className="d-flex align-items-center border-top pt-3"
        style={{ padding: '10px' }}
      >
        <input
          type="text"
          className="form-control me-2"
          placeholder="Message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            borderRadius: '8px',
          }}
        />
        <button
          className="btn btn-primary"
          onClick={handleSend}
          style={{
            borderRadius: '8px',
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ComChatWindow;
