import React from "react"
import { useState } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import PropTypes from "prop-types"
import api from "../../api/axios"
import { useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

const SearchModal = ({ isOpen, onClose, onChatRoomSelect }) => {
  const [searchInput, setSearchInput] = useState("")
  const [SearchResults, setSearchResults] = useState([])

  const userId = useSelector((state) => state.auth.user.userId)
  const navigate = useNavigate()

  const handleSearch = async () => {
    // 더미 데이터
    // const handleSearch = (input) => {
    //   const dummyData = ["커널은 맛있다", "커널은 즐겁다", "커널은 괴롭다", "커널은 분노한다"]

    //   const results = dummyData.filter((item) => item.includes(input))
    //   setSearchResults(results)

    // API 연동
    if (searchInput.trim() === "") {
      setSearchResults([])
      return
    }

    try {
      console.log(`요청 주소: /api/search/${searchInput}/${userId}`)
      const response = await api.get(`/api/chat-log/search/${searchInput}/${userId}`)
      const results = response.data
      console.log("검색결과:   ", results)

      // 결과가 HTML인 경우 처리
      if (typeof results === "string" && results.includes("<!DOCTYPE html>")) {
        console.error("인증 에러: HTML 응답 받음")
        setSearchResults([])
        return
      }

      setSearchResults(results)
    } catch (error) {
      console.error("검색 오류:", error)
      setSearchResults([])
    }
  }

  const handleInputChange = (e) => {
    const input = e.target.value
    setSearchInput(input)
    if (input.trim() === "") {
      setSearchResults([])
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleResultClick = (chatRoomId) => {
    onChatRoomSelect(chatRoomId)
    navigate("/main")
    onClose()
  }

  if (!isOpen) return null

  return createPortal(
    <>
      {/* 반투명 오버레이 - 클릭시 모달 닫기 */}
      <div className="absolute inset-0 z-40" onClick={onClose} />

      {/* 모달 컨테이너 */}
      <div className="absolute inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
        <div className="bg-gray-100 rounded-lg w-full max-w-2xl mx-auto pointer-events-auto flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <input type="text" value={searchInput} onChange={handleInputChange} placeholder="검색 입력..." className="w-full p-2 rounded-md" onKeyDown={handleKeyPress} />
            <button onClick={onClose} className="p-1 hover:bg-gray-400 rounded-full ml-2">
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4">
            {SearchResults.map((result, index) => (
              <button
                key={index}
                onClick={() => handleResultClick(result.chatRoomId)}
                className="block 
        w-full 
        text-left 
        p-2 
        mb-2 
        bg-gray-50 
        rounded-md
        hover:bg-gray-200 
        transition-all 
        duration-300 
        shadow-md
        hover:shadow-neon
        animate-neon-shine
        whitespace-nowrap 
        overflow-hidden 
        text-ellipsis"
              >
                {result.answerSentences[0]?.content}
                {result.answerSentences.length > 1 && "..."}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.getElementById("modal-root")
  )
}

SearchModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onChatRoomSelect: PropTypes.func.isRequired,
}

export default SearchModal
