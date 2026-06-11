import { useState, useRef, useEffect } from 'react';
import { Paperclip, Send, Smile, Mic, Camera, X, Check, FileText, MapPin, Image as ImageIcon, Trash2 } from 'lucide-react';
import ImageAdjustModal from './modals/ImageAdjustModal';
import SnapPreviewModal from './modals/SnapPreviewModal';
import EmojiPicker from 'emoji-picker-react';

export default function ChatInput({ onSendMessage, socket, selectedChat, replyToMessage, setReplyToMessage }) {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const [sendingSnap, setSendingSnap] = useState(false);
  
  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const secondsIntervalRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const [adjustingImage, setAdjustingImage] = useState(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [snapSource, setSnapSource] = useState(null);
  const [isSending, setIsSending] = useState(false);

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

  const handleInputResize = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'; // Reset height
      const scrollHeight = inputRef.current.scrollHeight;
      inputRef.current.style.height = Math.min(Math.max(scrollHeight, 44), 120) + 'px';
    }
  };

  useEffect(() => {
    handleInputResize();
  }, [message]);

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

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSending) return;
    if (message.trim()) {
      setIsSending(true);
      await onSendMessage(message, null, 'text', replyToMessage?._id);
      setMessage('');
      setReplyToMessage?.(null);
      setShowEmojiMenu(false);
      setShowAttachMenu(false);
      if (socket && selectedChat) {
        socket.emit('stop typing', selectedChat._id);
        setIsTyping(false);
      }
      setIsSending(false);
    }
  };

  const addEmoji = (emoji) => {
    setMessage((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64Audio = reader.result;
          const formatTime = (sec) => {
            const m = Math.floor(sec / 60);
            const s = sec % 60;
            return `${m}:${s < 10 ? '0' : ''}${s}`;
          };
          onSendMessage(`[Voice Message (${formatTime(recordingSeconds)})]`, base64Audio, 'audio', replyToMessage?._id);
          setReplyToMessage?.(null);
        };
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      if (socket && selectedChat) socket.emit('voice_recording_start', selectedChat._id);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access is required to send voice notes.');
    }
  };

  const stopRecordingAndSend = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (socket && selectedChat) socket.emit('voice_recording_stop', selectedChat._id);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      // Discard chunks
      audioChunksRef.current = [];
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (socket && selectedChat) socket.emit('voice_recording_stop', selectedChat._id);
    } else {
      setIsRecording(false);
      if (socket && selectedChat) socket.emit('voice_recording_stop', selectedChat._id);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        alert("File size must be less than 50MB");
        e.target.value = null;
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        if (sendingSnap) {
          // Heuristic to guess if taken by camera or gallery since we use a single input
          let source = 'gallery';
          const isRecent = (Date.now() - file.lastModified) < 60000; // Less than 1 min old
          if (file.name === 'image.jpg' || file.name.startsWith('IMG_') || file.name.startsWith('VID_') || isRecent) {
            source = 'camera';
          }
          setSnapSource(source);
          setAdjustingImage(reader.result);
          setIsPreviewOpen(true);
        } else if (file.type.startsWith('image/')) {
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
    <div className="relative w-full px-4 md:px-6 pb-4 md:pb-8 pt-2 bg-transparent flex flex-col items-center justify-center gap-2 z-20 shrink-0 pb-safe">
      
      {/* Ambient background glow behind composer */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none -z-10" />

      {/* Reply Preview Card */}
      {replyToMessage && (
        <div className="flex w-full items-center justify-between gap-3 max-w-[900px] bg-surface/80 backdrop-blur-xl border border-outline-variant/50 rounded-2xl p-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] mb-1 animate-in slide-in-from-bottom-2 duration-200">
          <div className="w-1 rounded-full bg-primary h-full self-stretch shrink-0" />
          <div className="flex flex-col min-w-0 flex-1 pl-1 py-0.5">
            <span className="text-[12px] font-bold text-primary tracking-wide">
              Replying to {replyToMessage.sender?.displayName || 'User'}
            </span>
            <span className="text-[13px] text-on-surface-variant truncate font-medium mt-0.5 opacity-90">
              {replyToMessage.messageType === 'image' ? '📷 Photo' : 
               replyToMessage.messageType === 'video' ? '🎥 Video' : 
               replyToMessage.messageType === 'document' ? '📄 Document' : 
               replyToMessage.messageType === 'audio' ? '🎤 Voice Note' : 
               replyToMessage.content}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplyToMessage(null)}
            className="p-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface rounded-full transition-all cursor-pointer shadow-sm active:scale-95"
            title="Cancel Reply"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* Emoji Menu Overlay */}
      {showEmojiMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowEmojiMenu(false)} />
          <div className="absolute bottom-full mb-4 left-4 md:left-6 z-50 animate-in slide-in-from-bottom-4 duration-200 shadow-[0_8px_30px_rgb(0,0,0,0.2)] rounded-3xl border border-outline-variant/60 overflow-hidden bg-surface max-w-[calc(100vw-32px)]">
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
      {/* Attachment Menu Popup */}
      {showAttachMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowAttachMenu(false)} />
          <div className="absolute bottom-full mb-4 left-4 md:left-16 z-50 bg-surface/90 backdrop-blur-2xl border border-outline-variant/50 p-4 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex flex-col gap-3 w-max animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
            <div className="grid grid-cols-2 gap-3">
              <button 
                type="button"
                onClick={() => { setSendingSnap(false); fileInputRef.current?.setAttribute('accept', 'image/*,video/*'); fileInputRef.current?.click(); setShowAttachMenu(false); }}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-surface-container hover:bg-surface-container-high rounded-2xl transition-all cursor-pointer active:scale-95 group border border-outline-variant/30 shadow-sm"
              >
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full shadow-[0_4px_12px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform">
                  <ImageIcon size={20} strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/80">Media</span>
              </button>

              <button 
                type="button"
                onClick={() => { setSendingSnap(false); fileInputRef.current?.setAttribute('accept', 'application/*,text/*'); fileInputRef.current?.click(); setShowAttachMenu(false); }}
                className="flex flex-col items-center justify-center gap-2 p-3 bg-surface-container hover:bg-surface-container-high rounded-2xl transition-all cursor-pointer active:scale-95 group border border-outline-variant/30 shadow-sm"
              >
                <div className="p-3 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white rounded-full shadow-[0_4px_12px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
                  <FileText size={20} strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/80">File</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Camera Menu Popup */}
      {showCameraMenu && (
        <>
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowCameraMenu(false)} />
          <div className="absolute bottom-full mb-4 right-16 md:right-24 z-50 bg-surface/90 backdrop-blur-2xl border border-outline-variant/50 p-3 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex flex-col gap-2 w-max animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
            <div className="grid grid-cols-3 gap-2">
              <button 
                type="button"
                onClick={() => { setSendingSnap(true); cameraInputRef.current?.click(); setShowCameraMenu(false); }}
                className="flex flex-col items-center justify-center gap-2 p-3 w-20 bg-surface-container hover:bg-surface-container-high rounded-2xl transition-all cursor-pointer active:scale-95 group border border-outline-variant/30 shadow-sm"
              >
                <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 text-white rounded-full shadow-[0_4px_12px_rgba(244,63,94,0.3)] group-hover:scale-110 transition-transform">
                  <Camera size={18} strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/80">Photo</span>
              </button>

              <button 
                type="button"
                onClick={() => { setSendingSnap(true); videoInputRef.current?.click(); setShowCameraMenu(false); }}
                className="flex flex-col items-center justify-center gap-2 p-3 w-20 bg-surface-container hover:bg-surface-container-high rounded-2xl transition-all cursor-pointer active:scale-95 group border border-outline-variant/30 shadow-sm"
              >
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white rounded-full shadow-[0_4px_12px_rgba(168,85,247,0.3)] group-hover:scale-110 transition-transform">
                  <Camera size={18} strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/80">Video</span>
              </button>

              <button 
                type="button"
                onClick={() => { setSendingSnap(true); galleryInputRef.current?.click(); setShowCameraMenu(false); }}
                className="flex flex-col items-center justify-center gap-2 p-3 w-20 bg-surface-container hover:bg-surface-container-high rounded-2xl transition-all cursor-pointer active:scale-95 group border border-outline-variant/30 shadow-sm"
              >
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full shadow-[0_4px_12px_rgba(59,130,246,0.3)] group-hover:scale-110 transition-transform">
                  <ImageIcon size={18} strokeWidth={2} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface/80">Gallery</span>
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex w-full items-end justify-center gap-1.5 md:gap-3 max-w-[900px] z-20">
        {isRecording ? (
          /* Premium Voice Recording UI */
          <div className="flex-1 bg-surface/90 backdrop-blur-xl rounded-[28px] border border-red-500/30 shadow-[0_8px_30px_rgba(239,68,68,0.15)] flex items-center h-[56px] px-2 transition-all">
            <button 
              type="button" 
              onClick={cancelRecording} 
              className="w-10 h-10 flex items-center justify-center hover:bg-red-500/10 text-on-surface-variant hover:text-red-500 rounded-full transition-colors cursor-pointer shrink-0"
              title="Discard"
            >
              <Trash2 size={20} />
            </button>
            
            <div className="flex-1 flex items-center justify-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
              <span className="text-red-500 text-sm font-black tracking-widest font-mono">
                {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
              </span>
              
              {/* Simulated Waveform */}
              <div className="flex items-center gap-1 ml-2 h-6 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1 bg-red-500 rounded-full animate-pulse opacity-80"
                    style={{ 
                      height: `${20 + Math.random() * 80}%`, 
                      animationDelay: `${i * 150}ms`,
                      animationDuration: '800ms'
                    }}
                  />
                ))}
              </div>
            </div>

            <button 
              type="button" 
              onClick={stopRecordingAndSend} 
              className="w-10 h-10 flex items-center justify-center bg-red-500 text-white hover:bg-red-600 rounded-full transition-all cursor-pointer shrink-0 shadow-lg active:scale-95"
              title="Send Voice Note"
            >
              <Send size={18} strokeWidth={2.5} className="ml-0.5" />
            </button>
          </div>
        ) : (
          /* Normal Message Composer Input */
          <form onSubmit={handleSubmit} className="flex-1 relative flex items-end">
            <div className="w-full bg-surface/80 backdrop-blur-xl border border-outline-variant/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex items-end min-h-[56px] rounded-[28px] pl-2 pr-4 py-1 transition-all focus-within:border-primary/50 focus-within:shadow-[0_8px_30px_rgba(var(--color-primary),0.1)] focus-within:bg-surface">
              
              {/* Left Icons inside input */}
              <div className="flex items-center gap-1 pb-1 shrink-0">
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEmojiMenu(!showEmojiMenu);
                    setShowAttachMenu(false);
                    setShowCameraMenu(false);
                  }}
                  className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all cursor-pointer active:scale-95 ${showEmojiMenu ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
                  title="Emoji"
                >
                  <Smile size={22} strokeWidth={2.2} />
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowAttachMenu(!showAttachMenu);
                    setShowEmojiMenu(false);
                    setShowCameraMenu(false);
                  }}
                  className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all cursor-pointer active:scale-95 ${showAttachMenu ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
                  title="Attach"
                >
                  <Paperclip size={20} strokeWidth={2.2} />
                </button>
              </div>

              {/* Textarea instead of Input */}
              <textarea
                ref={inputRef}
                value={message}
                onChange={handleTyping}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 bg-transparent text-[15px] text-on-surface placeholder-on-surface-variant/50 font-medium outline-none resize-none px-2 mb-1 custom-scrollbar"
                style={{ 
                  height: '44px',
                  minHeight: '44px',
                  lineHeight: '24px',
                  paddingTop: '10px',
                  paddingBottom: '10px'
                }}
              />

              {/* Camera Icon Inside Input (WhatsApp Style) */}
              <div className="flex items-center pb-1 shrink-0 px-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowCameraMenu(!showCameraMenu);
                    setShowAttachMenu(false);
                    setShowEmojiMenu(false);
                  }}
                  className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center rounded-full transition-all cursor-pointer active:scale-95 ${showCameraMenu ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'}`}
                  title="Send View Once Snap"
                >
                  <Camera size={22} strokeWidth={2.2} />
                </button>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*,video/*,application/*,text/*" 
                onChange={handleFileChange} 
              />
              <input 
                type="file" 
                ref={cameraInputRef} 
                className="hidden" 
                accept="image/*"
                capture="environment"
                onChange={handleFileChange} 
              />
              <input 
                type="file" 
                ref={videoInputRef} 
                className="hidden" 
                accept="video/*"
                capture="environment"
                onChange={handleFileChange} 
              />
              <input 
                type="file" 
                ref={galleryInputRef} 
                className="hidden" 
                accept="image/*,video/*" 
                onChange={handleFileChange} 
              />
            </div>
          </form>
        )}

        {/* External Send/Mic Button */}
        {!isRecording && (
          <div className="shrink-0 flex items-center justify-center mb-0.5">
            {message.trim() ? (
              <button 
                onClick={handleSubmit}
                className="w-[46px] h-[46px] md:w-[52px] md:h-[52px] rounded-full bg-gradient-to-br from-primary to-primary-container text-white flex items-center justify-center shadow-[0_8px_20px_rgba(var(--color-primary),0.3)] transition-all active:scale-95 hover:scale-105 cursor-pointer relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <Send size={22} strokeWidth={2.5} className="relative z-10 pl-0.5" />
              </button>
            ) : (
              <button 
                type="button" 
                onClick={startRecording}
                className="w-[46px] h-[46px] md:w-[52px] md:h-[52px] rounded-full bg-surface/80 backdrop-blur-xl border border-outline-variant/60 flex items-center justify-center text-on-surface hover:bg-surface hover:text-primary transition-all shadow-sm active:scale-95 cursor-pointer group"
                title="Voice Note"
              >
                <Mic size={22} strokeWidth={2.2} className="group-hover:scale-110 transition-transform" />
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

      <SnapPreviewModal
        isOpen={isPreviewOpen}
        imageSrc={adjustingImage}
        mediaSource={snapSource}
        onClose={() => {
          setIsPreviewOpen(false);
          setSendingSnap(false);
        }}
        onConfirm={(captionText, mediaDataUrl, source) => {
          onSendMessage(captionText || 'Snap', mediaDataUrl, 'snap', replyToMessage?._id, source);
          setReplyToMessage?.(null);
          setIsPreviewOpen(false);
          setSendingSnap(false);
        }}
      />
    </div>
  );
}
