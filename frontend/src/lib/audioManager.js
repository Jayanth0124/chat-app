class AudioManager {
  constructor() {
    this.sounds = {
      incoming: new Audio('/src/assets/audio/incoming_call.wav'),
      outgoing: new Audio('/src/assets/audio/phone_ringing.wav'),
      messageSent: new Audio('/src/assets/audio/message_sent.wav'),
    };

    // Configure incoming call audio
    this.sounds.incoming.loop = true;
    
    // Configure outgoing call audio
    this.sounds.outgoing.loop = true;

    // Preload
    Object.values(this.sounds).forEach(audio => {
      audio.load();
    });

    this.outgoingTimeout = null;
  }

  setSpeakerMode(isOn) {
    // Earpiece mode requires a very low volume to feel realistic on generic web browsers
    this.sounds.outgoing.volume = isOn ? 1.0 : 0.05;
  }

  playIncoming() {
    this.sounds.incoming.currentTime = 0;
    this.sounds.incoming.play().catch(e => console.warn('Audio play failed:', e));
  }

  stopIncoming() {
    this.sounds.incoming.pause();
    this.sounds.incoming.currentTime = 0;
  }

  playOutgoing(onTimeout) {
    this.sounds.outgoing.currentTime = 0;
    this.sounds.outgoing.play().catch(e => console.warn('Audio play failed:', e));
    
    // 35 second timeout for outgoing calls
    if (this.outgoingTimeout) clearTimeout(this.outgoingTimeout);
    this.outgoingTimeout = setTimeout(() => {
      this.stopOutgoing();
      if (onTimeout) onTimeout();
    }, 35000);
  }

  stopOutgoing() {
    this.sounds.outgoing.pause();
    this.sounds.outgoing.currentTime = 0;
    if (this.outgoingTimeout) {
      clearTimeout(this.outgoingTimeout);
      this.outgoingTimeout = null;
    }
  }

  playMessageSent() {
    // Clone node allows playing overlapping sounds if sent rapidly, but user asked for "no overlapping" for calls.
    // For message sent, we'll just reset and play to ensure low latency.
    this.sounds.messageSent.currentTime = 0;
    this.sounds.messageSent.play().catch(e => console.warn('Audio play failed:', e));
  }
}

export const audioManager = new AudioManager();
