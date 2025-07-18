import React, { useState } from 'react';
// Import RotateCcw icon
import { Menu, X, User, LogOut, Bell, Search, ChevronDown, ChevronLeft, ChevronRight, Home, DollarSign, Activity, BarChart2, Briefcase, Calendar, RotateCcw } from 'lucide-react';

const BOT_ICON_URL = "https://png.pngtree.com/png-clipart/20230401/original/pngtree-smart-chatbot-cartoon-clipart-png-image_9015126.png";

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ text: string; isUser: boolean }>>([
    { text: "👋 Hi! I'm your i-STOKVEL assistant. How can I help you today?", isUser: false }
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSendMessage = async () => {
    if (inputMessage.trim()) {
      setMessages(prev => [...prev, { text: inputMessage, isUser: true }]);
      setInputMessage('');

      try {
        const res = await fetch('http://localhost:5001/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: inputMessage }),
        });
        const data = await res.json();
        setMessages(prev => [
          ...prev,
          { text: data.answer || "Sorry, I couldn't get a response.", isUser: false }
        ]);
      } catch (err) {
        setMessages(prev => [
          ...prev,
          { text: "Sorry, there was an error contacting the AI.", isUser: false }
        ]);
      }
    }
  };

  // Function to clear all messages
  const handleClearMessages = () => {
    setMessages([]); // Reset the messages array to empty
     // Optional: Add an initial message again after clearing
     setTimeout(() => {
        setMessages([{ text: "👋 Hi! I'm your i-STOKVEL assistant. How can I help you today?", isUser: false }]);
     }, 100); // Add a small delay
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
        style={{ width: 56, height: 56 }}
      >
        {isOpen ? (
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <img
            src={BOT_ICON_URL}
            alt="Chatbot"
            className="w-8 h-8 object-contain"
          />
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 bg-white rounded-lg shadow-xl flex flex-col">
          {/* Chat Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <img src={BOT_ICON_URL} alt="Chatbot" className="w-8 h-8 rounded-full bg-white p-1" />
              <div>
                <h3 className="font-semibold">i-STOKVEL Assistant</h3>
                <p className="text-sm text-blue-100">We're here to help!</p>
              </div>
            </div>
            <button
              onClick={handleClearMessages}
              className="p-1 rounded-full text-blue-200 hover:text-white hover:bg-blue-500 focus:outline-none transition-colors duration-200"
              title="Clear chat"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} items-end`}
              >
                {!message.isUser && (
                  <img
                    src={BOT_ICON_URL}
                    alt="Bot"
                    className="w-6 h-6 rounded-full mr-2 bg-white border"
                  />
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.isUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
                {message.isUser && <div className="w-6 h-6 ml-2" />}
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBot; 