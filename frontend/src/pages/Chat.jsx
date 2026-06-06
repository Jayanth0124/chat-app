import { useState, useEffect } from 'react';
import ChatWindow from '../components/ChatWindow';
import ChatList from '../components/ChatList';
import { useChatStore } from '../store/useChatStore';

export default function Chat() {
  const [activeChat, setActiveChat] = useState(null);
  const { setSelectedChat } = useChatStore();

  useEffect(() => {
    return () => {
      // Clear selected chat when unmounting the Chat page entirely
      setSelectedChat(null);
    };
  }, [setSelectedChat]);

  // Handle Hardware Back Button and Escape Key Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeChat) {
        e.preventDefault();
        setActiveChat(null);
        setSelectedChat(null);
      }
    };

    const handlePopState = (e) => {
      if (activeChat) {
        // When hardware back is pressed, popstate fires.
        // We close the chat instead of navigating away.
        setActiveChat(null);
        setSelectedChat(null);
      }
    };

    if (activeChat) {
      // Push a dummy history state with the identical URL
      // This absorbs the next back button press
      window.history.pushState({ chatOpen: true }, '', window.location.href);
      window.addEventListener('keydown', handleKeyDown);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      if (activeChat) {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('popstate', handlePopState);
        // If the chat was closed via UI Back Button or Esc key (not hardware back),
        // we must manually pop the dummy state we injected so the user's history stays clean.
        if (window.history.state && window.history.state.chatOpen) {
          window.history.back();
        }
      }
    };
  }, [activeChat, setSelectedChat]);

  return (
    <div className="flex-1 h-full flex w-full bg-transparent overflow-hidden">
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

