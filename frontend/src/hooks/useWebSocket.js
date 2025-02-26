import { useEffect, useCallback } from 'react';
import { io } from "socket.io-client";

const baseURL = import.meta.env.VITE_APP_SOCKET_BASE_URL;

export const useWebSocket = ({ 
  setStreamingText, 
  setModelStreamingTexts, 
  setMindmapStatus, 
  currentChatRoom 
}) => {
  // 스트리밍 종료 콜백 함수 - 메모이제이션
  const handleStreamEndCallback = useCallback(() => {
    setStreamingText("");
  }, []);

  useEffect(() => {
    const socket = io(baseURL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("stream", (data) => {
      setStreamingText((prev) => prev + data.content);
    });

    socket.on("all_stream", (data) => {
      setModelStreamingTexts((prev) => ({
        ...prev,
        [data.model_name]: prev[data.model_name] + data.content,
      }));
    });

    socket.on("stream_end", handleStreamEndCallback);

    socket.on("mindmap_status", (data) => {
      if (String(data.chatRoomId) === String(currentChatRoom)) {
        setMindmapStatus({
          status: data.status,
          message: data.message,
        });
      }
    });

    return () => {
      socket.off("stream");
      socket.off("all_stream");
      socket.off("stream_end");
      socket.off("error");
      socket.disconnect();
    };
  }, [handleStreamEndCallback, currentChatRoom]);
}; 