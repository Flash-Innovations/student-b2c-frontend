import React, { useEffect, useRef } from "react";

/**
 * RemoteVideoTile binds a remote MediaStream to a video element.
 * Plays incoming audio and video from a WebRTC peer.
 */
export function RemoteVideoTile({ stream, isVideoOff = false, className = "" }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream || isVideoOff) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className={`w-full h-full object-cover rounded-xl ${className}`}
    />
  );
}
