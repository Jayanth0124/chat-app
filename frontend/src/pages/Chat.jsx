import { useState, useEffect } from 'react';
import ChatWindow from '../components/ChatWindow';
import ChatList from '../components/ChatList';
import { useChatStore } from '../store/useChatStore';

export default function Chat() {
  const [activeChat, setActiveChat] = useState(null);
  const { setSelectedChat } = useChatStore();

  useEffect(() => {
    return () => {
      // Clear selected chat when leaving the chat page to avoid marking unseen messages as seen
      setSelectedChat(null);
    };
  }, [setSelectedChat]);

  return (
    <div className="flex-1 h-full flex w-full bg-background overflow-hidden">
      {/* Chat List Sidebar */}
      <ChatList activeChat={activeChat} setActiveChat={setActiveChat} />

      {/* Main Chat Window */}
      <div className={`flex-1 h-full ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        <ChatWindow onBack={() => {
          setActiveChat(null);
          setSelectedChat(null);
        }} />
      </div>
    </div>
  );
}

