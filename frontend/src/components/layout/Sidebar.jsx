import { useState, useEffect, useRef, useCallback } from "react"
import { Menu, Search, ExternalLink, Network, MoreHorizontal } from "lucide-react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios.js"
import { deleteNode } from "../../api/mindmap.js"
import { useSelector } from "react-redux"

const Sidebar = ({ onOpenModal, refreshTrigger, setRefreshTrigger, onChatRoomSelect, currentChatRoom, chatSemaphore, mindSemaphore }) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [menuStates, setMenuStates] = useState({})
  const [isChatting, setIsChatting] = useState(false)

  const toggleMenu = (roomId) => {
    setMenuStates((prev) => {
      // 클릭한 메뉴가 이미 열려있다면 닫기만 함
      if (prev[roomId]) {
        return {
          ...prev,
          [roomId]: false,
        }
      }

      // 클릭한 메뉴가 닫혀있다면, 다른 메뉴들을 닫고 현재 메뉴만 열기
      return {
        [roomId]: true,
      }
    })
  }

  const navigate = useNavigate()
  const userId = useSelector((state) => state.auth.user.userId)

  // 채팅방 관련 상태
  const [allChatRooms, setAllChatRooms] = useState([]) // 모든 채팅방 저장
  const [isLoading, setIsLoading] = useState(false) // 사이드바 로딩 상태

  // 스크롤 감지를 위한 ref
  const containerRef = useRef(null)

  // 채팅방 목록 불러오기
  const handleChatRooms = useCallback(async () => {
    console.log("handleChatRooms 실행")
    setIsLoading(true)
    try {
      const response = await api.get(`/api/chatroom/my-rooms/${userId}`)
      // console.log("채팅방 목록 로딩 완료:", response.data)
      setAllChatRooms(response.data)
    } catch (error) {
      console.error("채팅방 목록 로딩 실패:", error)
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  // 채팅방 삭제
  const handleDeleteRoom = async (chatroomId) => {
    try {
      const response = await api.delete(`/api/chatroom/delete/${chatroomId}`)
      if (response.status === 200 || response.status === 204) {
        // 1. 채팅방 목록 업데이트
        setAllChatRooms((prev) => prev.filter((room) => room.id !== chatroomId))

        // 2. 사이드바 갱신을 위한 리프레시 트리거

        setRefreshTrigger((prev) => !prev)


        // 3. 현재 채팅방이 삭제되는 경우 추가 처리
        if (chatroomId === currentChatRoom) {
          onChatRoomSelect(null) // 현재 채팅방 선택 해제
          // navigate("/main") // 메인 페이지로 이동
        }

        alert("삭제 완료")
      }
    } catch (error) {
      console.error("채팅방 삭제 실패:", error)
      alert("삭제 실패")
    }
  }

  // 채팅방 분류 함수
  const categorizeRooms = (rooms) => {
    if (!rooms || rooms.length === 0) return { recentFiveRooms: [], remainingRooms: [] }

    // 최근 5개 채팅방
    const recentFiveRooms = rooms
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)

    // 나머지 채팅방
    const remainingRooms = rooms
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(5)

    return {
      recentFiveRooms,
      remainingRooms,
    }
  }

  // 초기 로딩
  useEffect(() => {
    handleChatRooms()
  }, [refreshTrigger, currentChatRoom, chatSemaphore])

  //대화 목록을 클릭했을 시의 핸들러
  const handleChatRoomClick = (roomId) => {
    onChatRoomSelect(roomId)

    if (location.pathname !== "/main") {
      navigate("/main")
    }
  }

  //대화중이면 채팅방 이동 못하게 금지
  useEffect(() => {
    setIsChatting(chatSemaphore)
    if (chatSemaphore) {
      // 채팅 시작 시 메뉴 닫기
      setMenuStates({})
      // 사용자에게 시각적 피드백 제공 (선택사항)
      // toast.info("채팅 중에는 메뉴를 사용할 수 없습니다");
    }
  }, [chatSemaphore])

  useEffect(() => {
    // console.log("채팅방 목록 상태 변경:", allChatRooms)
  }, [allChatRooms])

  return (
    <div className={`${isCollapsed ? "w-16" : "w-64"} bg-[#1a1a1a] p-4 flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-end"} gap-2 mb-8`}>
        <button className="p-1 rounded hover:bg-gray-200 transition-colors" onClick={() => setIsCollapsed(!isCollapsed)}>
          <Menu className="w-6 h-6 text-[#ffffff]" />
        </button>
        {!isCollapsed && (
          <>
            <button className="p-1 rounded hover:bg-gray-200 transition-colors" onClick={onOpenModal}>
              <Search className="w-6 h-6 text-[#ffffff]" />
            </button>
            <button
              className="p-1 rounded hover:bg-gray-200 transition-colors"
              onClick={() => {
                onChatRoomSelect(null)
                navigate("/main", { state: { refresh: Date.now() } })
              }}
            >
              <ExternalLink className="w-6 h-6 text-[#ffffff]" />
            </button>
            <button className="p-1 rounded hover:bg-gray-200 transition-colors" onClick={() => navigate("/mindmap")}>
              <Network className="w-6 h-6 text-[#ffffff]" />
            </button>
          </>
        )}
      </div>

      {/* Navigation Sections */}
      {!isCollapsed && (
        <div ref={containerRef} className="space-y-8 overflow-y-auto flex-1">
          {/* 오늘 채팅방 */}
          <div className="mb-6">
            <h2 className="text-[#ffffff] mb-2">최근 대화</h2>
            <div className="flex flex-col gap-2">
              {categorizeRooms(allChatRooms).recentFiveRooms.map((chatRoom) => (
                <div key={`today-${chatRoom.id}`} className="relative group">
                  <button
                    onClick={() => handleChatRoomClick(chatRoom.id)}
                    className={`
                      group relative w-full px-4 py-2 rounded-full
                      ${currentChatRoom === chatRoom.id ? "bg-gray-700" : "bg-gray-800"}
                      text-white transition-all duration-300
                      overflow-hidden hover:bg-gray-700
                      hover:shadow-neon
                    `}
                    disabled={isChatting}
                  >
                    <span className="relative z-10 truncate">{chatRoom.title}</span>
                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-neon-shine"></div>
                  </button>
                  <button
                    onClick={() => {
                      toggleMenu(chatRoom.id)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 
                     hover:bg-gray-600 rounded-full opacity-0 
                     group-hover:opacity-100 transition-all duration-300 z-20"
                    disabled={isChatting}
                  >
                    <MoreHorizontal className="w-5 h-5 text-[#ffffff]" />
                  </button>
                  {menuStates[chatRoom.id] && (
                    <div
                      className="absolute z-50 top-[calc(100%-0.5rem)] right-3 mt-1 
                                  px-4 py-2 rounded-lg bg-[#1a1a1a] text-white shadow-lg"
                    >
                      <button
                        onClick={() => {
                          // 마인드맵 로직 추가
                          toggleMenu(chatRoom.id)
                          navigate("/mindmap", { state: { chatRoomId: chatRoom.id } })
                        }}
                        className="p-2 flex items-center gap-2 whitespace-nowrap hover:text-gray-300 transition-colors w-full text-left"
                      >
                        마인드맵
                      </button>
                      <button
                        onClick={() => {
                          console.log("삭제 버튼 클릭됨:", chatRoom.id)
                          toggleMenu(chatRoom.id)
                          handleDeleteRoom(chatRoom.id)
                        }}
                        className="p-2 flex items-center gap-2 whitespace-nowrap hover:text-red-400 transition-colors w-full text-left"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 최근 7일 채팅방 */}
          <div className="flex flex-col gap-2">
            <h2 className="text-[#ffffff] mb-2">지난 대화</h2>
            <div className="flex flex-col gap-2">
              {categorizeRooms(allChatRooms).remainingRooms.map((chatRoom) => (
                <div key={`recent-${chatRoom.id}`} className="relative group">
                  <button
                    onClick={() => handleChatRoomClick(chatRoom.id)}
                    className={`
                    group relative w-full px-4 py-2 rounded-full
                    ${currentChatRoom === chatRoom.id ? "bg-gray-700" : "bg-gray-800"}
                    text-white transition-all duration-300
                    overflow-hidden hover:bg-gray-700
                    hover:shadow-neon
                  `}
                    disabled={isChatting}
                  >
                    <span className="relative z-10 truncate">{chatRoom.title}</span>
                    <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-neon-shine"></div>
                  </button>
                  <button
                    onClick={() => {
                      toggleMenu(chatRoom.id)
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 
                     hover:bg-gray-600 rounded-full opacity-0 
                     group-hover:opacity-100 transition-all duration-300 z-20"
                    disabled={isChatting}
                  >
                    <MoreHorizontal className="w-5 h-5 text-[#ffffff]" />
                  </button>
                  {menuStates[chatRoom.id] && (
                    <div
                      className="absolute z-50 top-[calc(100%-0.5rem)] right-3 mt-1 
                                  px-4 py-2 rounded-lg bg-[#1a1a1a] text-white shadow-lg"
                    >
                      <button
                        onClick={() => {
                          // 마인드맵 로직 추가
                          toggleMenu(chatRoom.id)
                          navigate(`/mindmap/room/${chatRoom.id}`)
                        }}
                        className="p-2 flex items-center gap-2 whitespace-nowrap hover:text-gray-300 transition-colors w-full text-left"
                      >
                        마인드맵
                      </button>
                      <button
                        onClick={() => {
                          // 삭제 로직 추가
                          console.log("삭제 버튼 클릭됨:", chatRoom.id)
                          toggleMenu(chatRoom.id)
                          handleDeleteRoom(chatRoom.id)
                        }}
                        className="p-2 flex items-center gap-2 whitespace-nowrap hover:text-red-400 transition-colors w-full text-left"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* 로딩 인디케이터 */}
          {isLoading && <div className="text-center py-2 text-white">로딩 중...</div>}
        </div>
      )}
    </div>
  )
}

export default Sidebar
