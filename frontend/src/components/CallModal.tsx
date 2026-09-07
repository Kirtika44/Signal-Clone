'use client';

import React, { useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Shield,
  Volume2,
  Maximize2
} from 'lucide-react';
import { useCall } from '@/context/CallContext';

export const CallModal: React.FC = () => {
  const {
    callState,
    localStream,
    remoteStream,
    endCall,
    toggleMute,
    toggleCamera,
    acceptCall,
    rejectCall,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Bind local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callState.isCameraOff]);

  // Bind remote stream if exists
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!callState.isActive && callState.status !== 'incoming') {
    return null;
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Incoming Call Ringing Overlay
  if (callState.status === 'incoming') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
        <div className="w-full max-w-sm bg-[#0e1726] border border-slate-700/80 rounded-3xl p-6 text-center text-white shadow-2xl">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <img
              src={
                callState.peerUser?.avatar_url ||
                `https://api.dicebear.com/7.x/bottts/svg?seed=${callState.peerUser?.username}`
              }
              alt="Caller"
              className="w-24 h-24 rounded-full object-cover ring-4 ring-blue-500 animate-signal-pulse"
            />
          </div>

          <h3 className="text-xl font-bold text-white mb-1">
            {callState.peerUser?.display_name || 'Incoming Call'}
          </h3>
          <p className="text-xs text-blue-400 font-medium mb-6">
            Incoming Signal {callState.callType === 'video' ? 'Video' : 'Voice'} Call...
          </p>

          <div className="flex items-center justify-center space-x-6">
            {/* Reject Button */}
            <button
              onClick={rejectCall}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-transform active:scale-90"
              title="Decline"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            {/* Accept Button */}
            <button
              onClick={acceptCall}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 transition-transform active:scale-90 animate-bounce"
              title="Accept"
            >
              {callState.callType === 'video' ? (
                <Video className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active / Outgoing Call Modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#070c14]/95 backdrop-blur-lg p-2 sm:p-6 select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-full max-h-[85vh] bg-[#0c1422] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Top Floating Status Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between z-20 text-white">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700/60 text-xs text-slate-300 backdrop-blur-sm">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Signal Secure WebRTC Call</span>
            </div>
          </div>

          <div className="text-center">
            <h4 className="font-semibold text-sm text-white">
              {callState.peerUser?.display_name || 'Call'}
            </h4>
            <span className="text-xs text-slate-400">
              {callState.status === 'connected'
                ? formatDuration(callState.durationSeconds)
                : 'Calling...'}
            </span>
          </div>

          <div className="w-20" />
        </div>

        {/* Video / Stream Canvas Display Area */}
        <div className="flex-1 w-full h-full relative flex items-center justify-center bg-black/40 overflow-hidden">
          {callState.callType === 'video' && !callState.isCameraOff ? (
            /* Video Mode - Main Peer View */
            <div className="w-full h-full relative flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Local Camera Floating PiP Box */}
              <div className="absolute bottom-24 right-4 w-36 sm:w-48 aspect-video bg-slate-900 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-2xl z-20">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                <span className="absolute bottom-1 left-2 text-[10px] text-white/80 bg-black/50 px-1.5 py-0.5 rounded">
                  You
                </span>
              </div>
            </div>
          ) : (
            /* Audio Mode / Camera Off Display */
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <img
                  src={
                    callState.peerUser?.avatar_url ||
                    `https://api.dicebear.com/7.x/bottts/svg?seed=${callState.peerUser?.username}`
                  }
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover ring-4 ring-blue-500/40 shadow-2xl animate-signal-pulse"
                />
                {callState.status === 'connected' && (
                  <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 ring-4 ring-[#0c1422]" />
                )}
              </div>

              {/* Sound Wave Animation */}
              {callState.status === 'connected' && !callState.isMuted && (
                <div className="flex items-center space-x-1 h-6">
                  {[40, 70, 100, 60, 90, 50, 80, 40].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 bg-blue-500 rounded-full animate-pulse"
                      style={{
                        height: `${h}%`,
                        animationDuration: `${0.6 + (i % 3) * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Floating Bottom Controls Dock */}
        <div className="p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex items-center justify-center space-x-4 z-20">
          {/* Mute Microphone Button */}
          <button
            onClick={toggleMute}
            className={`p-3.5 rounded-2xl transition-all ${
              callState.isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700/60'
            }`}
            title={callState.isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {callState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Toggle Camera Button */}
          <button
            onClick={toggleCamera}
            className={`p-3.5 rounded-2xl transition-all ${
              callState.isCameraOff
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-700/60'
            }`}
            title={callState.isCameraOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {callState.isCameraOff ? (
              <VideoOff className="w-5 h-5" />
            ) : (
              <Video className="w-5 h-5" />
            )}
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center space-x-2 shadow-lg shadow-rose-600/40 transition-transform active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
            <span className="text-sm">End</span>
          </button>
        </div>
      </div>
    </div>
  );
};
