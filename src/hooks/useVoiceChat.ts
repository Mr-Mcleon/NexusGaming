import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface VoiceUser {
  userId: string;
  username: string;
  isMuted: boolean;
  isSpeaking: boolean;
}

export const useVoiceChat = (channelId: string | null) => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [voiceUsers, setVoiceUsers] = useState<VoiceUser[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsConnected(false);
    setVoiceUsers([]);
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup, channelId]);

  const joinVoice = useCallback(async () => {
    if (!user || !channelId) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      // Use Supabase Realtime presence for signaling
      const channel = supabase.channel(`voice:${channelId}`, {
        config: { presence: { key: user.id } },
      });

      channel
        .on("presence", { event: "sync" }, () => {
          const state = channel.presenceState();
          const users: VoiceUser[] = Object.entries(state).map(([key, presences]) => {
            const p = (presences as any[])[0];
            return {
              userId: key,
              username: p.username || "Unknown",
              isMuted: p.isMuted || false,
              isSpeaking: false,
            };
          });
          setVoiceUsers(users);
        })
        .on("presence", { event: "join" }, async ({ key, newPresences }) => {
          if (key === user.id) return;
          // Create peer connection for new user
          await createPeerConnection(key, true, channel);
        })
        .on("presence", { event: "leave" }, ({ key }) => {
          const pc = peerConnectionsRef.current.get(key);
          if (pc) {
            pc.close();
            peerConnectionsRef.current.delete(key);
          }
        })
        .on("broadcast", { event: "signal" }, async ({ payload }) => {
          if (payload.target !== user.id) return;
          await handleSignal(payload.from, payload.signal, channel);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await channel.track({
              username: user.email?.split("@")[0] || "Unknown",
              isMuted: false,
            });
          }
        });

      channelRef.current = channel;
      setIsConnected(true);
    } catch (err) {
      console.error("Failed to join voice:", err);
    }
  }, [user, channelId]);

  const createPeerConnection = async (
    peerId: string,
    isInitiator: boolean,
    channel: ReturnType<typeof supabase.channel>
  ) => {
    if (!user || !localStreamRef.current) return;

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    localStreamRef.current.getTracks().forEach((track) => {
      pc.addTrack(track, localStreamRef.current!);
    });

    pc.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play().catch(console.error);
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        channel.send({
          type: "broadcast",
          event: "signal",
          payload: {
            from: user.id,
            target: peerId,
            signal: { type: "candidate", candidate: event.candidate },
          },
        });
      }
    };

    peerConnectionsRef.current.set(peerId, pc);

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      channel.send({
        type: "broadcast",
        event: "signal",
        payload: {
          from: user.id,
          target: peerId,
          signal: { type: "offer", sdp: offer },
        },
      });
    }
  };

  const handleSignal = async (
    fromId: string,
    signal: any,
    channel: ReturnType<typeof supabase.channel>
  ) => {
    if (!user) return;

    let pc = peerConnectionsRef.current.get(fromId);

    if (signal.type === "offer") {
      if (!pc) {
        await createPeerConnection(fromId, false, channel);
        pc = peerConnectionsRef.current.get(fromId);
      }
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channel.send({
        type: "broadcast",
        event: "signal",
        payload: {
          from: user.id,
          target: fromId,
          signal: { type: "answer", sdp: answer },
        },
      });
    } else if (signal.type === "answer") {
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    } else if (signal.type === "candidate") {
      if (pc) await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
  };

  const leaveVoice = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);

        // Update presence
        channelRef.current?.track({
          username: user?.email?.split("@")[0] || "Unknown",
          isMuted: !track.enabled,
        });
      }
    }
  }, [user]);

  return {
    isConnected,
    isMuted,
    voiceUsers,
    joinVoice,
    leaveVoice,
    toggleMute,
  };
};
