import { useCallback, useEffect, useState } from "react"
import api from "../api/axios"

export const useInfiniteScroll = (containerRef, currentChatRoom) => {
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [messages, setMessages] = useState([])

  const loadMoreMessages = async () => {
    if (!currentChatRoom) return

    try {
      const response = await api.get(`/api/chatroom/messages/${currentChatRoom}?page=${page}`)

      const newMessages = response.data.flatMap((message) => [
        {
          text: message.question,
          isUser: true,
        },
        {
          text: message.answerSentences.map((sentence) => sentence.content).join(" "),
          isUser: false,
        },
      ])

      setMessages((prev) => [...newMessages, ...prev])
      setPage((prev) => prev + 1)
      setHasMore(newMessages.length > 0)
    } catch (error) {
      console.error("이전 메시지 로딩 실패:", error)
    }
  }

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const { scrollTop } = containerRef.current
    if (scrollTop < 100 && hasMore) {
      loadMoreMessages()
    }
  }, [hasMore])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  return { messages, setMessages, hasMore }
}
