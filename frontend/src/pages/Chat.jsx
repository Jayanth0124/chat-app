import { useState } from 'react';
import ChatWindow from '../components/ChatWindow';
import ChatList from '../components/ChatList';

export default function Chat() {
  const [activeChat, setActiveChat] = useState(null);

  return (
    <div className="flex-1 h-full flex w-full bg-background overflow-hidden">
      {/* Chat List Sidebar */}
      <ChatList activeChat={activeChat} setActiveChat={setActiveChat} />

      {/* Main Chat Window */}
      <div className={`flex-1 h-full ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatWindow onBack={() => setActiveChat(null)} />
      </div>
    </div>
  );
}

