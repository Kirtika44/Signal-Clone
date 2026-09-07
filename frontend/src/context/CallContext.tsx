'use client';

import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { User, CallState } from '@/types';

interface CallContextType {
  callState: CallState;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (peer: User, type: 'audio' | 'video') => Promise<void>;
  receiveCall: (caller: User, type: 'audio' | 'video') => void;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
}

const initialCallState: CallState = {
  isActive: false,
  callType: 'video',
  status: 'idle',
  isMuted: false,
  isCameraOff: false,
  durationSeconds: 0,
};

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [callState, setCallState] = useState<CallState>(initialCallState);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer counter when connected
  useEffect(() => {
    if (callState.status === 'connected') {
      timerRef.current = setInterval(() => {
        setCallState((prev) => ({
          ...prev,
          durationSeconds: prev.durationSeconds + 1,
        }));
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState.status]);

  // Request actual camera & microphone from browser
  const setupMediaStream = async (video: boolean): Promise<MediaStream | null> => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: video ? { width: 1280, height: 720 } : false,
        });
        setLocalStream(stream);
        return stream;
      }
    } catch (err) {
      console.warn('Media devices not accessible or permission denied, using simulated stream:', err);
    }

    // Fallback simulated stream (canvas animation) if no webcam or in mock environment
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        let frame = 0;
        const draw = () => {
          frame++;
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#2563eb';
          ctx.beginPath();
          ctx.arc(320 + Math.sin(frame * 0.05) * 50, 240, 60, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '20px sans-serif';
          ctx.fillText('Signal Secure Stream', 220, 250);
          requestAnimationFrame(draw);
        };
        draw();
      }
      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(30) : null;
      setLocalStream(stream);
      return stream;
    } catch {
      return null;
    }
  };

  const startCall = async (peer: User, type: 'audio' | 'video') => {
    setCallState({
      isActive: true,
      callType: type,
      status: 'outgoing',
      peerUser: peer,
      isMuted: false,
      isCameraOff: type === 'audio',
      durationSeconds: 0,
    });

    await setupMediaStream(type === 'video');

    // Auto-connect after 2.5s simulated ringing for seamless testing experience
    setTimeout(() => {
      setCallState((prev) => {
        if (prev.status === 'outgoing') {
          return { ...prev, status: 'connected' };
        }
        return prev;
      });
    }, 2500);
  };

  const receiveCall = (caller: User, type: 'audio' | 'video') => {
    setCallState({
      isActive: true,
      callType: type,
      status: 'incoming',
      peerUser: caller,
      isMuted: false,
      isCameraOff: type === 'audio',
      durationSeconds: 0,
    });
  };

  const acceptCall = async () => {
    await setupMediaStream(callState.callType === 'video');
    setCallState((prev) => ({
      ...prev,
      status: 'connected',
    }));
  };

  const rejectCall = () => {
    endCall();
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
      setRemoteStream(null);
    }
    setCallState({
      ...initialCallState,
      status: 'ended',
    });
    setTimeout(() => {
      setCallState(initialCallState);
    }, 800);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setCallState((prev) => ({ ...prev, isMuted: !audioTrack.enabled }));
        return;
      }
    }
    setCallState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCallState((prev) => ({ ...prev, isCameraOff: !videoTrack.enabled }));
        return;
      }
    }
    setCallState((prev) => ({ ...prev, isCameraOff: !prev.isCameraOff }));
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        localStream,
        remoteStream,
        startCall,
        receiveCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
