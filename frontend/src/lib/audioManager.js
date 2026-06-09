import incomingCallFile from '../assets/audio/incoming_call.mp3';
import phoneRingingFile from '../assets/audio/phone_ringing.mp3';
import messageSentFile from '../assets/audio/message_sent.mp3';

class AudioManager {
  constructor() {
    this.sounds = {
      incoming: new Audio(incomingCallFile),
      outgoing: new Audio(phoneRingingFile),
      messageSent: new Audio(messageSentFile),
    };

    // Configure loop states
    this.sounds.incoming.loop = true;
    this.sounds.outgoing.loop = true;

    // Preload
    Object.entries(this.sounds).forEach(([name, audio]) => {
      audio.addEventListener('error', (e) => {
        console.error(`[Audio] Failed to load '${name}'`, e);
      });
      audio.load();
    });

    this.outgoingTimeout = null;
  }

  handlePlayError(name, err) {
    if (err.name === 'NotAllowedError') {
      console.error(`[Audio] Autoplay blocked for '${name}'. Browser requires user interaction before playing audio.`);
    } else if (err.name === 'NotSupportedError') {
      console.error(`[Audio] The element has no supported sources for '${name}'. Path might be invalid in production build.`);
    } else {
      console.error(`[Audio] Playback failed for '${name}':`, err);
    }
  }

  setSpeakerMode(isOn) {
    this.sounds.outgoing.volume = isOn ? 1.0 : 0.05;
  }

  playIncoming() {
    const audio = this.sounds.incoming;
    audio.currentTime = 0;
    audio.play().catch(e => this.handlePlayError('incoming', e));
  }

  stopIncoming() {
    const audio = this.sounds.incoming;
    audio.pause();
    audio.currentTime = 0;
  }

  playOutgoing(onTimeout) {
    const audio = this.sounds.outgoing;
    audio.currentTime = 0;
    audio.play().catch(e => this.handlePlayError('outgoing', e));
    
    if (this.outgoingTimeout) clearTimeout(this.outgoingTimeout);
    this.outgoingTimeout = setTimeout(() => {
      this.stopOutgoing();
      if (onTimeout) onTimeout();
    }, 36000);
  }

  stopOutgoing() {
    const audio = this.sounds.outgoing;
    audio.pause();
    audio.currentTime = 0;
    if (this.outgoingTimeout) {
      clearTimeout(this.outgoingTimeout);
      this.outgoingTimeout = null;
    }
  }

  playMessageSent() {
    const audio = this.sounds.messageSent;
    audio.currentTime = 0;
    audio.play().catch(e => this.handlePlayError('messageSent', e));
  }
}

export const audioManager = new AudioManager();
