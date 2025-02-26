// 필요한 리액트 훅과 컴포넌트들을 임포트
import React, { useState } from "react"
import { Routes, Route, useLocation } from "react-router-dom"
import Navbar from "./Navbar"
import Sidebar from "./Sidebar"
import SearchModal from "../common/SearchModal"
import routes from "../../routes"
import { useSelector } from "react-redux"

const AppLayout = () => {
  // 채팅방이 새로 생성되었는지 아닌지의 상태를 관리하는 state
  const [refreshTrigger, setRefreshTrigger] = useState(false)
  // 검색 모달의 열림/닫힘 상태를 관리하는 state
  const [isOpen, setIsOpen] = useState(false)
  // 채팅방 ID 상태
  const [currentChatRoom, setCurrentChatRoom] = useState(() => {
    return localStorage.getItem("currentChatRoom") || null
  })

  // 현재 유저 ID
  const userId = useSelector((state) => state.auth.user.userId)

  const [chatSemaphore, setChatSemaphore] = useState(false) // 채팅 임계구역
  const [mindSemaphore, setMindSemaphore] = useState(false) // 마인드맵 임계구역

  // 현재 라우트 위치 정보를 가져오는 훅
  const location = useLocation()

  const [isCollapsed, setIsCollapsed] = useState(false)

  // 채팅방 업데이트 핸들러(Sidebar)
  const handleChatRoomSelect = (roomId) => {
    if (roomId) {
      localStorage.setItem("currentChatRoom", roomId.toString())
    } else {
      localStorage.removeItem("currentChatRoom")
    }
    setCurrentChatRoom(roomId)
  }

  // 현재 경로가 인증 페이지인지 확인
  const isAuthPage = ["/login", "/signup", "/"].includes(location.pathname)

  // 인증 페이지일 경우 간단한 레이아웃 반환
  if (isAuthPage || !userId) {
    return (
      <div className="h-screen bg-[#171717]">
        <Routes>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Routes>
      </div>
    )
  }

  // 일반 페이지일 경우 전체 레이아웃 반환
  return (
    <div className="flex h-screen bg-[#171717]">
      {/* 사이드바 컴포넌트 - 모달 열기/닫기 함수 전달 */}
      <Sidebar
        onOpenModal={() => setIsOpen(!isOpen)}
        refreshTrigger={refreshTrigger}
        setRefreshTrigger={setRefreshTrigger}
        onChatRoomSelect={handleChatRoomSelect}
        currentChatRoom={currentChatRoom}
        chatSemaphore={chatSemaphore}
        mindSemaphore={mindSemaphore}
        setIsCollapsed={setIsCollapsed}
      />
      <div className="flex-1 flex flex-col">
        {/* 상단 네비게이션 바 */}
        <Navbar onChatRoomSelect={handleChatRoomSelect} />
        {/* 메인 컨텐츠 영역 */}
        <main className="flex-1 px-5 overflow-y-auto">
          {/* 검색 모달 컴포넌트 */}
          <SearchModal isOpen={isOpen} onClose={() => setIsOpen(false)} onChatRoomSelect={handleChatRoomSelect} />
          {/* 라우트에 따른 컴포넌트 렌더링 */}
          <Routes>
            {routes.map((route) => (
              <Route
                key={route.path}
                path={route.path}
                element={React.cloneElement(route.element, {
                  refreshTrigger,
                  setRefreshTrigger,
                  currentChatRoom,
                  onChatRoomSelect: handleChatRoomSelect,
                  chatSemaphore,
                  setChatSemaphore,
                  mindSemaphore,
                  setMindSemaphore,
                  isCollapsed,
                })}
              />
            ))}
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default AppLayout
