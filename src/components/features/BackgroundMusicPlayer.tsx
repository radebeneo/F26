"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// TODO: Replace with your actual Supabase Storage public URLs
const TRACKS = [
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Alive%20-%20Empire%20Of%20The%20Sun.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Busy%20Earnin'%20-%20Jungle.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Cobrastyle.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Do%20You%20Remember%20The%20Times%20-%20ISLAND.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Etcetera%20-%20Steam%20Down.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Eyes%20on%20the%20Prize%20-%20Che%20Lingo.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Fallin%20Apart.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Feel%20The%20Vibe%20-%20BJ%20The%20Chicago%20Kid.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Feels%20Like%20Summer%20-%20Childish%20Gambino.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Feels%20Like%20Summer%20-%20Public%20Order.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Feet%20Don't%20Fail%20Me%20Now.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Followers%20-%20AREA21.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/fuego%20(feat.%20GABIFUEGO)%20-%20Spotify%20Studio%20100%20Recording%20-%20Musti.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Glidin%20(feat.%20slowthai)%20-%20Pa%20Salieu.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Good%20Energy%20-%20Mike%20Sabath.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Good%20Love%202.0%20-%20Priya%20Ragu.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Heat%20Waves%20-%20Glass%20Animals.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Hit%20It%20-%20American%20Authors.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/I%20Am%20(feat.%20Wyclef%20Jean)%20-%20Rock%20Mafia.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/I%20Want%20-%20ENNY.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Inner%20Light%20-%20Elderbrook.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Is%20It%20True%20-%20Tame%20Impala.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Jerk%20It%20Out%20-%20Caesars.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Kids%20-%20MGMT.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Latino%20&%20Proud%20-%20DJ%20Raff.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Love%20Me%20Again%20-%20John%20Newman.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Magic%20-%20Olympic%20Ayres.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Morrow%20-%20070%20Shake.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Motion%20-%20Luke%20Hemmings.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/My%20Type%20-%20Saint%20Motel.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Oh%20My%20God!%20-%20Colouring.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/On%20Top%20Of%20The%20World%20-%20Imagine%20Dragons.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Royals%20-%20Lorde.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Scatter%20-%20Fireboy%20DML.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Seguimos%20-%20Morad.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/SHADE%20-%20Zaia.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/skeletons%20-%20hard%20life.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Soy%20Yo%20-%20Bomba%20Estereo.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Talk%20About%20It%20-%20Jungle.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/The%20Mission%20-%20Bakar.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/The%20Nights%20-%20Avicii.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Trouble%20Coming%20-%20Royal%20Blood.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/War%20Outside%20(feat.%20Lex%20Amor)%20-%20Kojey%20Radical.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Way%20down%20We%20Go%20-%20KALEO.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Welcome%20To%20Jamrock%20-%20Damian%20Marley.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Where%20&%20When%20-%20P%20Money.mp3",
  "https://ufvsbuasgzituhoyvrfv.supabase.co/storage/v1/object/public/audio/Yesterday%20-%20Loyle%20Carner.mp3"
];

export function BackgroundMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<number | null>(null);
  const hasInteractedRef = useRef(false);
  const isFadingOutRef = useRef(false);

  const [shuffledTracks, setShuffledTracks] = useState<string[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  const TARGET_VOLUME = 0.05;
  const FADE_DURATION_MS = 2000;
  const FADE_STEPS = 30;

  const isAttemptingPlayRef = useRef(false);

  // Initialize shuffled tracks on mount
  useEffect(() => {
    if (TRACKS.length > 0) {
      const shuffled = [...TRACKS].sort(() => Math.random() - 0.5);
      setShuffledTracks(shuffled);
    }
  }, []);

  const clearFade = useCallback(() => {
    if (fadeIntervalRef.current !== null) {
      window.clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
  }, []);

  const fadeIn = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      audio.volume = 0;
      await audio.play();

      // Play succeeded, safe to start the fade
      clearFade();
      let step = 0;
      fadeIntervalRef.current = window.setInterval(() => {
        step++;
        if (step >= FADE_STEPS) {
          if (audio) audio.volume = TARGET_VOLUME;
          clearFade();
        } else {
          if (audio) audio.volume = (step / FADE_STEPS) * TARGET_VOLUME;
        }
      }, FADE_DURATION_MS / FADE_STEPS);

      return true;
    } catch {
      console.warn("Autoplay still prevented. Waiting for next interaction.");
      return false;
    }
  }, [clearFade]);

  const fadeOutAndNext = useCallback(() => {
    if (isFadingOutRef.current) return;
    isFadingOutRef.current = true;
    clearFade();

    const audio = audioRef.current;
    if (!audio) return;

    const startVolume = audio.volume;
    let step = 0;

    fadeIntervalRef.current = window.setInterval(() => {
      step++;
      if (step >= FADE_STEPS) {
        if (audio) audio.volume = 0;
        clearFade();
        // Move to the next track
        setCurrentTrackIndex((prev) => (prev + 1) % shuffledTracks.length);
        isFadingOutRef.current = false;
      } else {
        if (audio) {
          audio.volume = Math.max(0, startVolume - (step / FADE_STEPS) * startVolume);
        }
      }
    }, FADE_DURATION_MS / FADE_STEPS);
  }, [clearFade, shuffledTracks.length]);

  // Play and fade in when the track index changes (only if the user has interacted)
  useEffect(() => {
    if (shuffledTracks.length === 0) return;
    if (hasInteractedRef.current) {
      // Small timeout to allow the <audio src> to update in the DOM
      setTimeout(() => fadeIn(), 50);
    }
  }, [currentTrackIndex, shuffledTracks.length, fadeIn]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
  }, []);

  // Global interaction and shortcut listener
  useEffect(() => {
    const handleInteraction = async (e: Event) => {
      // Start playback on first interaction
      if (!hasInteractedRef.current && shuffledTracks.length > 0) {
        if (isAttemptingPlayRef.current) return;
        isAttemptingPlayRef.current = true;

        const success = await fadeIn();
        if (success) {
          hasInteractedRef.current = true;
        }
        isAttemptingPlayRef.current = false;

        // If the first interaction was just a random click/scroll, return so we don't process shortcuts
        if (e.type !== "keydown") return;
      }

      // Handle keyboard shortcuts
      if (e.type === "keydown") {
        const keyEvent = e as KeyboardEvent;
        const target = keyEvent.target as HTMLElement;

        // Prevent shortcuts from triggering if user is typing in an input/textarea
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }

        // Use keyEvent.code for robust physical key detection regardless of layout
        // Shift + N or MediaTrackNext -> Next Track
        if ((keyEvent.shiftKey && keyEvent.code === "KeyN") || keyEvent.key === "MediaTrackNext") {
          keyEvent.preventDefault();
          fadeOutAndNext();
        }

        // M or AudioVolumeMute -> Toggle Mute
        if (keyEvent.code === "KeyM" || keyEvent.key === "AudioVolumeMute") {
          keyEvent.preventDefault();
          toggleMute();
        }
      }
    };

    const events = ["click", "mousedown", "touchstart", "scroll", "keydown"];

    events.forEach(event => {
      window.addEventListener(event, handleInteraction, { capture: true, passive: false });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleInteraction, { capture: true });
      });
      clearFade();
    };
  }, [shuffledTracks.length, fadeIn, fadeOutAndNext, toggleMute, clearFade]);

  // Time update listener for fading out smoothly at the end of a track
  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || isFadingOutRef.current) return;

    // Start fading out when we have exactly FADE_DURATION_MS (or slightly less) remaining
    if (audio.duration > 0 && audio.duration - audio.currentTime <= FADE_DURATION_MS / 1000) {
      fadeOutAndNext();
    }
  };

  // Don't render anything if tracks aren't configured or if the shuffled list isn't ready
  if (TRACKS.length === 0 || shuffledTracks.length === 0) {
    return null;
  }

  // Render an invisible audio element
  return (
    <audio
      ref={audioRef}
      src={shuffledTracks[currentTrackIndex]}
      crossOrigin="anonymous"
      preload="none"
      onTimeUpdate={handleTimeUpdate}
      onEnded={fadeOutAndNext} // Fallback in case timeupdate misses the threshold
      onError={(e) => {
        const mediaEl = e.currentTarget as HTMLAudioElement;
        console.warn("[MusicPlayer] Audio error:", mediaEl.error?.code, mediaEl.error?.message, mediaEl.src);
      }}
    />
  );
}
