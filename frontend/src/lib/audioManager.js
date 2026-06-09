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

    // Preload & initialize logs
    Object.entries(this.sounds).forEach(([name, audio]) => {
      audio.addEventListener('canplaythrough', () => {
        console.log(`[Audio] Loaded successfully '${name}' (readyState: ${audio.readyState})`);
      });
      audio.addEventListener('error', (e) => {
        console.error(`[Audio] Failed to load '${name}'`, e);
      });
      
      // Attempt preload
      audio.load();
      console.log(`[Audio] Initialized '${name}' with source from bundler.`);
    });

    this.outgoingTimeout = null;
  }

  logEvent(name, action, audio) {
    console.log(`[Audio] ${action} '${name}' | readyState: ${audio?.readyState} | vol: ${audio?.volume} | muted: ${audio?.muted}`);
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
    const oldVol = this.sounds.outgoing.volume;
    this.sounds.outgoing.volume = isOn ? 1.0 : 0.05;
    console.log(`[Audio] setSpeakerMode(${isOn}) | outgoing ring vol changed from ${oldVol} to ${this.sounds.outgoing.volume}`);
  }

  playIncoming() {
    const audio = this.sounds.incoming;
    audio.currentTime = 0;
    this.logEvent('incoming', 'play() requested', audio);
    audio.play()
      .then(() => console.log(`[Audio] Playing 'incoming' successfully.`))
      .catch(e => this.handlePlayError('incoming', e));
  }

  stopIncoming() {
    const audio = this.sounds.incoming;
    audio.pause();
    audio.currentTime = 0;
    this.logEvent('incoming', 'stop() requested', audio);
  }

  playOutgoing(onTimeout) {
    const audio = this.sounds.outgoing;
    audio.currentTime = 0;
    this.logEvent('outgoing', 'play() requested', audio);
    audio.play()
      .then(() => console.log(`[Audio] Playing 'outgoing' successfully.`))
      .catch(e => this.handlePlayError('outgoing', e));
    
    if (this.outgoingTimeout) clearTimeout(this.outgoingTimeout);
    this.outgoingTimeout = setTimeout(() => {
      console.log(`[Audio] Outgoing call timeout reached (36s). Auto-stopping.`);
      this.stopOutgoing();
      if (onTimeout) onTimeout();
    }, 36000);
  }

  stopOutgoing() {
    const audio = this.sounds.outgoing;
    audio.pause();
    audio.currentTime = 0;
    this.logEvent('outgoing', 'stop() requested', audio);
    if (this.outgoingTimeout) {
      clearTimeout(this.outgoingTimeout);
      this.outgoingTimeout = null;
    }
  }

  playMessageSent() {
    const audio = this.sounds.messageSent;
    // Don't restart if already playing recently to prevent stacking, but the user requested "instantly", 
    // so we just reset currentTime to 0.
    audio.currentTime = 0;
    this.logEvent('messageSent', 'play() requested', audio);
    audio.play()
      .then(() => console.log(`[Audio] Playing 'messageSent' successfully.`))
      .catch(e => this.handlePlayError('messageSent', e));
  }
}

export const audioManager = new AudioManager();
