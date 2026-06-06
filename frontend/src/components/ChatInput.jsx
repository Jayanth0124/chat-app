import { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, Smile, Mic, Camera, X, Check, FileText, MapPin, Image } from 'lucide-react';
import ImageAdjustModal from './modals/ImageAdjustModal';
import EmojiPicker from 'emoji-picker-react';

export default function ChatInput({ onSendMessage, socket, selectedChat, replyToMessage, setReplyToMessage }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  
  // Voice Recording Simulator State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const secondsIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const [adjustingImage, setAdjustingImage] = useState(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      secondsIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (secondsIntervalRef.current) clearInterval(secondsIntervalRef.current);
    }
    return () => {
      if (secondsIntervalRef.current) clearInterval(secondsIntervalRef.current);
    };
  }, [isRecording]);

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!socket || !selectedChat) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', selectedChat._id);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop typing', selectedChat._id);
      setIsTyping(false);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message, null, 'text', replyToMessage?._id);
      setMessage('');
      setReplyToMessage?.(null);
      setShowEmojiMenu(false);
      setShowAttachMenu(false);
      if (socket && selectedChat) {
        socket.emit('stop typing', selectedChat._id);
        setIsTyping(false);
      }
    }
  };

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const sendVoiceNote = () => {
    const formatTime = (sec) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    };
    onSendMessage(`[Voice Message (${formatTime(recordingSeconds)})]`, null, 'text', replyToMessage?._id);
    setReplyToMessage?.(null);
    setIsRecording(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast?.error("File size must be less than 50MB");
        e.target.value = null;
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (file.type.startsWith('image/')) {
          setAdjustingImage(reader.result);
          setIsAdjustOpen(true);
        } else if (file.type.startsWith('video/')) {
          onSendMessage(file.name, reader.result, 'video', replyToMessage?._id);
          setReplyToMessage?.(null);
        } else {
          onSendMessage(file.name, reader.result, 'document', replyToMessage?._id);
          setReplyToMessage?.(null);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = null;
    setShowAttachMenu(false);
  };

  return (
    <div className="px-6 py-4 bg-background flex flex-col items-center justify-center gap-2 z-10 shrink-0 relative">
      
      {/* Reply Preview Bar */}
      {replyToMessage && (
        <div className="flex w-full items-center justify-between gap-3 max-w-[900px] bg-surface-container border border-outline-variant/60 rounded-2xl px-5 py-3 animate-in slide-in-from-bottom-2 duration-150 mb-1 z-10">
          <div className="flex flex-col min-w-0">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">
              Replying to {replyToMessage.sender?.displayName || 'User'}
            </span>
            <span className="text-xs text-on-surface-variant truncate font-medium mt-0.5">
              {replyToMessage.messageType === 'image' ? '📷 Image' : replyToMessage.content}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplyToMessage(null)}
            className="p-1.5 hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-full transition-colors cursor-pointer"
            title="Cancel Reply"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Emoji Menu Overlay */}
      {showEmojiMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowEmojiMenu(false)} />
          <div className="absolute bottom-20 left-4 z-50 animate-in slide-in-from-bottom-2 duration-150 shadow-2xl overflow-hidden rounded-2xl border border-outline-variant/60 max-w-[calc(100vw-32px)]">
            <EmojiPicker 
              theme="dark" 
              emojiStyle="native" 
              onEmojiClick={(emojiData) => addEmoji(emojiData.emoji)}
              width={350}
              height={400}
              searchDisabled={false}
              skinTonesDisabled
            />
          </div>
        </>
      )}

      {/* Attachment Menu Overlay */}
      {showAttachMenu && (
        <div className="absolute bottom-20 left-20 bg-surface border border-outline-variant/60 p-2 rounded-2xl shadow-xl z-50 flex flex-col gap-1 w-44 animate-in slide-in-from-bottom-2 duration-150">
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors text-left w-full cursor-pointer"
          >
            <Image size={16} className="text-blue-500" /> Photo & Video
          </button>
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container rounded-xl transition-colors text-left w-full cursor-pointer"
          >
            <FileText size={16} className="text-purple-500" /> Document
          </button>
        </div>
      )}

      <div className="flex w-full items-center justify-center gap-3 max-w-[900px]">
        {isRecording ? (
          /* Pulsing Voice Recorder Simulation bar */
          <div className="flex-1 bg-surface-container-low rounded-full border border-outline-variant/60 shadow-sm flex items-center justify-between h-[52px] px-6 transition-colors animate-pulse">
            <div className="flex items-center gap-3 text-red-500 text-sm font-bold">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              Recording Voice Note ({Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')})
            </div>
            <div className="flex items-center gap-2">
              <button 
                type="button" 
                onClick={() => setIsRecording(false)} 
                className="p-2 hover:bg-surface-container text-on-surface-variant hover:text-red-500 rounded-full transition-colors cursor-pointer"
                title="Discard"
              >
                <X size={18} />
              </button>
              <button 
                type="button" 
                onClick={sendVoiceNote} 
                className="p-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-full transition-colors cursor-pointer"
                title="Send Voice Note"
              >
                <Check size={18} />
              </button>
            </div>
          </div>
        ) : (
          /* Normal Message Composer Input */
          <form onSubmit={handleSubmit} className="flex-1 relative">
            <div className="bg-surface-container-low rounded-full border border-outline-variant/60 shadow-sm flex items-center h-[52px] px-2 transition-colors focus-within:border-primary">
              
              {/* Left Icons inside input */}
              <div className="flex items-center gap-1 pl-1 pr-2 text-on-surface-variant">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEmojiMenu(!showEmojiMenu);
                    setShowAttachMenu(false);
                  }}
                  className={`p-2 hover:text-on-surface transition-colors rounded-full cursor-pointer ${showEmojiMenu ? 'text-primary' : ''}`}
                  title="Emoji"
                >
                  <Smile size={22} strokeWidth={2} />
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAttachMenu(!showAttachMenu);
                    setShowEmojiMenu(false);
                  }}
                  className={`p-2 hover:text-on-surface transition-colors rounded-full cursor-pointer ${showAttachMenu ? 'text-primary' : ''}`}
                  title="Attach"
                >
                  <Paperclip size={20} strokeWidth={2} />
                </button>
              </div>

              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={handleTyping}
                placeholder="Type a message..."
                className="flex-1 bg-transparent text-[15px] text-on-surface placeholder-on-surface-variant/50 font-medium outline-none h-full"
              />

              {/* Hidden File Input for Real Image/Video/Doc Uploads */}
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*,application/*,text/*" 
                onChange={handleFileChange} 
              />
            </div>
          </form>
        )}

        {/* External Send/Mic Button */}
        {!isRecording && (
          <div className="shrink-0 flex items-center justify-center">
            {message.trim() ? (
              <button 
                onClick={handleSubmit}
                className="w-[50px] h-[50px] rounded-full bg-primary hover:bg-primary/90 text-white flex items-center justify-center shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Send size={22} strokeWidth={2.5} className="ml-1" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => setIsRecording(true)}
                className="w-[50px] h-[50px] rounded-full bg-surface-container-low border border-outline-variant/60 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high flex items-center justify-center shadow-sm transition-all cursor-pointer"
                title="Record Audio"
              >
                <Mic size={22} strokeWidth={2} />
              </button>
            )}
          </div>
        )}
      </div>
      
      <ImageAdjustModal
        isOpen={isAdjustOpen}
        imageSrc={adjustingImage}
        onClose={() => setIsAdjustOpen(false)}
        onConfirm={(adjustedDataUrl) => {
          onSendMessage('', adjustedDataUrl, 'image', replyToMessage?._id);
          setReplyToMessage?.(null);
          setIsAdjustOpen(false);
        }}
        aspectMode="original"
      />
    </div>
  );
}
