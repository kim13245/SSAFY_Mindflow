import { useRef, useEffect, useState, useCallback } from "react"
import { ArrowUpCircle, ChevronDown } from "lucide-react"
import ModelCard from "../components/common/ModelCard.jsx"
import api from "../api/axios.js"
import { useSelector } from "react-redux"
import { io } from "socket.io-client"
import { useLocation, useNavigate } from "react-router-dom"

// WebSocket 연결 설정
// - localhost:5001 서버와 웹소켓 연결을 설정
// - 실시간 양방향 통신을 위한 Socket.io 클라이언트 인스턴스 생성

const baseURL = import.meta.env.VITE_APP_SOCKET_BASE_URL

const socket = io(baseURL, {
  transports: ["websocket"], // WebSocket 프로토콜만 사용
  reconnection: true, // 연결 끊김 시 재연결 시도
  reconnectionAttempts: 5, // 최대 재연결 시도 횟수
  reconnectionDelay: 1000, // 재연결 시도 간격 (1초)
})

// MainPage 컴포넌트 정의
// setRefreshTrigger: 새로운 채팅방 생성 시 사이드바 갱신을 위한 prop
const MainPage = ({ refreshTrigger, setRefreshTrigger, currentChatRoom, onChatRoomSelect, chatSemaphore, setChatSemaphore }) => {
  // ===== Refs =====
  const location = useLocation()
  const navigate = useNavigate()
  const textareaRef = useRef(null) // 입력창 높이 자동조절을 위한 ref
  const messagesEndRef = useRef(null) // 새 메시지 추가시 자동 스크롤을 위한 ref
  const containerRef = useRef(null) // 채팅 메시지 컨테이너의 DOM 요소를 참조하기 위한 ref
  // - 스크롤 위치 감지
  // - 무한 스크롤 구현에 사용

  // ===== State 관리 =====
  // 채팅 관련 상태들
  const [messages, setMessages] = useState([]) // 전체 채팅 기록
  const [userInput, setUserInput] = useState("") // 현재 사용자 입력
  const [firstUserInput, setFirstUserInput] = useState("") // 첫 질문 저장
  const [streamingText, setStreamingText] = useState("") // AI 응답 스트리밍 텍스트

  // AI 모델 관련 상태들
  const [model, setModel] = useState("chatgpt") // 선택된 AI 모델
  const [detailModel, setDetailModel] = useState("gpt-3.5-turbo") // 선택된 모델의 세부 버전
  const [showModelCards, setShowModelCards] = useState(false) // 모델 선택 UI 표시 여부
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false) // 모델 선택 드롭다운 상태

  // 채팅방 관련 상태
  const [page, setPage] = useState(1) // 무한 스크롤을 위한 현재 페이지 번호 (1부터 시작)
  const [hasMore, setHasMore] = useState(true) // 더 불러올 이전 메시지가 있는지 여부를 나타내는 플래그

  // 각 AI 모델별 스트리밍 응답 저장
  const [modelStreamingTexts, setModelStreamingTexts] = useState({
    chatgpt: "",
    claude: "",
    google: "",
    clova: "",
  })

  // 마인드맵 상태
  const [mindmapStatus, setMindmapStatus] = useState({
    status: "completed",
    message: "",
  })

  // Redux에서 유저정보 가져오기
  const userId = useSelector((state) => state.auth.user.userId)

  // ===== 상수 정의 =====
  // 지원하는 AI 모델 목록
  const modelList = ["chatgpt", "claude", "google", "clova"]
  // 각 모델별 세부 버전 정의
  const detailModelList = {
    chatgpt: ["gpt-3.5-turbo", "gpt-4o", "gpi-4o-mini", "gpt-o1"],
    claude: ["claude-3-5-sonnet-latest", "claude-3-opus", "claude-3.5-haiku"],
    google: ["gemini-2.0-flash-exp", "gemini-1.5-pro"],
    clova: ["HCX-003", "clova-studio-basic"],
  }

  // ===== useEffect 훅 =====

  useEffect(() => {
    const loadChatRoomMessages = async () => {
      // currentChatRoom이 null이면 메시지 초기화
      if (!currentChatRoom) {
        setMessages([])
        return
      }

      try {
        // API를 통해 채팅 내역 가져오기
        const response = await api.get(`/api/chatroom/messages/${currentChatRoom}`)

        // 서버 응답 데이터를 UI에 표시할 수 있는 형식으로 변환
        const formattedMessages = response.data.flatMap((message) => [
          // 첫 번째 요소: 사용자의 질문
          {
            text: message.question,
            isUser: true, // 사용자 메시지임을 표시
          },
          // 두 번째 요소: AI의 답변
          {
            model: message.model,
            detailModel: message.detailModel,
            // answerSentences 배열의 각 문장(sentence)에서 content를 추출하여
            // 하나의 문자열로 결합 (공백으로 구분)
            text: message.answerSentences.map((sentence) => sentence.content).join(" "),
            isUser: false, // AI 메시지임을 표시
          },
        ])

        setMessages(formattedMessages)

        const lastMessage = response.data[response.data.length - 1]

        setModel(lastMessage.model)
        setDetailModel(lastMessage.detailModel)
        console.log("현재 모델: ", model, detailModel)
      } catch (error) {
        console.error("채팅 메세지 로딩 실패:", error)
      }
    }

    loadChatRoomMessages()
  }, [currentChatRoom, refreshTrigger])

  // 새 창 버튼을 눌렀을 때 location.state 변경 감지하여 초기화
  useEffect(() => {
    if (currentChatRoom === null) {
      // currentChatRoom이 null로 변경되었을 때의 로직
      setMessages([]) // 메시지 초기화
      setModel("") // 모델 초기화
      setDetailModel("") // 세부 모델 초기화
      setShowModelCards(false) // 모델 카드 숨기기
      setStreamingText("") // 스트리밍 텍스트 초기화
      setModelStreamingTexts({
        chatgpt: "",
        claude: "",
        google: "",
        clova: "",
      }) // 모델 스트리밍 텍스트 초기화
    }
  }, [currentChatRoom, refreshTrigger])

  // textarea 높이 자동 조절
  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current)
    }
  }, [userInput])

  // 새 메시지 추가시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 스트리밍 종료 콜백 함수 - 메모이제이션
  const handleStreamEndCallback = useCallback(() => {
    setStreamingText("")
  }, [])

  // WebSocket 이벤트 리스너 설정
  useEffect(() => {
    // 연결 성공 이벤트
    socket.on("connect", () => {
      console.log("Socket connected")
    })

    // 연결 에러 이벤트
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })

    // 단일 모델 스트리밍 데이터 수신
    socket.on("stream", (data) => {
      // console.log("Stream chunk received:", data)
      setStreamingText((prev) => prev + data.content)
    })

    // 모든 모델의 스트리밍 데이터 수신
    socket.on("all_stream", (data) => {
      // console.log("All stream chunk received:", data)
      setModelStreamingTexts((prev) => ({
        ...prev,
        [data.model_name]: prev[data.model_name] + data.content,
      }))
    })

    // 스트리밍 종료 이벤트
    socket.on("stream_end", handleStreamEndCallback)

    // 에러 이벤트
    socket.on("error", (error) => {
      console.error("Socket error:", error)
    })

    // 마인드맵 상태 이벤트 리스너
    socket.on("mindmap_status", (data) => {
      console.log("Received mindmap status:", data)
      console.log("Current chatRoom:", currentChatRoom)
      console.log("Data chatRoomId:", data.chatRoomId)

      // chatRoomId 타입 일치 확인 (문자열로 통일)
      if (String(data.chatRoomId) === String(currentChatRoom)) {
        console.log("Updating mindmap status to:", data.status)
        setMindmapStatus({
          status: data.status,
          message: data.message,
        })
      }
    })

    // 컴포넌트 언마운트시 이벤트 리스너 제거
    return () => {
      socket.off("stream")
      socket.off("all_stream")
      socket.off("stream_end")
      socket.off("error")
    }
  }, [handleStreamEndCallback])

  // **모델 선택 시 처리**
  const handleModelSelect = async (modelName) => {
    if (!userId) {
      console.error("유효하지 않은 사용자 ID")
      return
    }

    // responses 대신 modelStreamingTexts 사용
    const streamingText = modelStreamingTexts[modelName]

    setModel(modelName)
    // 기본 detail_model 설정
    setDetailModel(detailModelList[modelName][0])
    setShowModelCards(false)

    const aiMessage = {
      text: streamingText, // 스트리밍으로 받은 텍스트 사용
      isUser: false,
      model: modelName,
    }
    setMessages((prev) => [...prev, aiMessage])

    try {
      const response = await api.post("/api/messages/choiceModel", {
        userInput: firstUserInput,
        answer: streamingText, // 스트리밍으로 받은 텍스트 사용
        creatorId: userId,
        model: modelName,
        detailModel: detailModelList[modelName][0], // 기본 detail_model 사용
      })

      console.log("API Response:", response) // 응답 확인용 로그 추가

      onChatRoomSelect(response.data.chat_room_id)

      // 모든 모델의 스트리밍 텍스트 초기화
      if (response.data && response.data.chat_room_id) {
        localStorage.setItem("currentChatRoom", response.data.chat_room_id.toString())
        onChatRoomSelect(response.data.chat_room_id)
        setModelStreamingTexts({
          chatgpt: "",
          claude: "",
          google: "",
          clova: "",
        })
        setRefreshTrigger((prev) => !prev)
      } else {
        console.error("포멧 에러:", response)
      }

      // 채팅방이 생성된 후 사이드바에 새로운 채팅방을 생성했다고 알림
      setRefreshTrigger((prev) => !prev)
    } catch (error) {
      console.error("모델 선택 오류:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
    }
  }

  // **메시지 전송 처리**
  const handleMessageSend = async (e) => {
    e.preventDefault()
    if (!userInput.trim()) return

    setChatSemaphore(true) //임계 구역 설정: 채팅입력, 채팅방 변경 방지
    // 사용자 메시지를 즉시 화면에 표시
    const userMessage = {
      text: userInput,
      isUser: true,
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      // currentChatRoom이 null이면 새로운 대화 시작
      if (!currentChatRoom) {
        // 첫 메시지일 때는 모델 선택 카드를 즉시 표시
        setFirstUserInput(userInput)
        setShowModelCards(true)

        setModelStreamingTexts({
          chatgpt: "",
          claude: "",
          google: "",
          clova: "",
        })
        await api.post("/api/messages/all", { userInput })
      } else {
        // 이후 메시지: 선택된 모델과 대화
        const response = await api.post("/api/messages/send", {
          chatRoomId: currentChatRoom,
          model: model,
          userInput,
          creatorId: userId,
          detailModel,
        })

        const { response: aiResponse } = response.data

        // 스트리밍 텍스트를 최종 응답으로 바로 교체
        setStreamingText(aiResponse)

        // 스트리밍 애니메이션 효과 제거를 위한 약간의 지연
        requestAnimationFrame(() => {
          const aiMessage = {
            text: aiResponse,
            isUser: false,
            model: model,
          }
          setMessages((prev) => [...prev, aiMessage])
          setStreamingText("")
        })
      }
    } catch (error) {
      console.error("메시지 전송 오류:", error)
      setStreamingText("")
    } finally {
      setChatSemaphore(false) // 임계 구역 해제
      setUserInput("")
    }
  }

  // **모델 아이콘 경로 반환**
  const getModelIcon = (modelName) => `/icons/${modelName}.svg`

  // **모델 드롭다운 토글**
  const toggleModelDropdown = () => {
    setIsModelDropdownOpen(!isModelDropdownOpen)
  }

  // **모델 변경 처리**
  const changeModel = (modelName) => {
    setModel(modelName)
    setDetailModel(detailModelList[modelName][0])
    if (chatSemaphore) {
      setChatSemaphore(false)
    } //임계 해제
  }
  // **세부 모델 변경 처리**
  const changeDetailModel = (detailModelName) => {
    setDetailModel(detailModelName)
    setIsModelDropdownOpen(false)
  }

  // **텍스트 영역 높이 조절**
  const adjustTextareaHeight = (element) => {
    element.style.height = "auto"
    const newHeight = Math.min(element.scrollHeight, 5 * 24) // 최대 5줄까지만 확장
    element.style.height = `${newHeight}px`
  }

  // **입력 변경 처리**
  const handleInputChange = (e) => {
    setUserInput(e.target.value)
    adjustTextareaHeight(e.target)
  }

  // 스크롤 이벤트 처리
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const { scrollTop } = containerRef.current
    // 스크롤이 상단에 가까워지면 이전 메시지 로드
    if (scrollTop < 100 && hasMore) {
      loadMoreMessages()
    }
  }, [hasMore])

  // 무한스크롤 로직
  const loadMoreMessages = async () => {
    // 현재 활성화된 채팅방이 없으면 함수 종료
    if (!currentChatRoom) return

    try {
      // 현재 페이지 번호를 기준으로 이전 메시지들을 서버에서 가져옴
      const response = await api.get(`/api/chatroom/messages/${currentChatRoom}?page=${page}`)

      // 서버로부터 받은 메시지 데이터를 UI에 맞게 변환
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

      // 새로 받은 메시지들을 기존 메시지 배열의 앞쪽에 추가
      // (시간순으로 정렬하기 위해 이전 메시지가 앞에 위치)
      setMessages((prev) => [...newMessages, ...prev])

      // 다음 페이지를 위해 페이지 번호 증가
      setPage((prev) => prev + 1)

      // 새로 받은 메시지가 있으면 더 불러올 메시지가 있다고 판단
      // 메시지가 없으면 더 이상 불러올 메시지가 없음을 표시
      setHasMore(newMessages.length > 0)
    } catch (error) {
      console.error("이전 메시지 로딩 실패:", error)
    }
  }

  // 스크롤 이벤트 리스너 등록
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("scroll", handleScroll)
      return () => container.removeEventListener("scroll", handleScroll)
    }
  }, [handleScroll])

  // 마인드맵 조회 핸들러
  const handleMindmapView = async () => {
    try {
      console.log("마인드맵 조회!!!!!!!!!!!!!")
      console.log("마인드맵 페이지로 이동:", currentChatRoom)
      navigate(`/mindmap/room/${currentChatRoom}`)
    } catch (error) {
      console.error("마인드맵 페이지 이동 실패:", error)
    }
  }

  // **렌더링**
  return (
    <div className="h-full flex flex-col p-4 relative" id="modal-root">
      {/* 메시지 표시 영역 - 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto mb-4">
        {/* 이전 메시지들 표시 */}
        {messages.map((message, index) => (
          <div key={index} className="mb-4">
            <ModelCard text={message.text} isUser={message.isUser} model={message.model} />
          </div>
        ))}

        {/* 스트리밍 중일 때만 임시로 표시되는 메시지 */}
        {streamingText && (
          <div className="mb-4">
            <ModelCard text={streamingText} isUser={false} model={model} className="animate-pulse" />
          </div>
        )}
        <div ref={messagesEndRef} />

        {/* 모델 선택 카드 영역 */}
        {showModelCards && (
          <div className="grid grid-cols-2 gap-4 mt-4 max-w-[calc(100%-10rem)] mx-auto">
            {Object.entries(modelStreamingTexts).map(([modelName, streamingText]) => (
              <div key={modelName} className="bg-[#e0e0e0] p-3 rounded-lg cursor-pointer hover:bg-[#EFEFEF] transition-colors" onClick={() => handleModelSelect(modelName)}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-5 h-5">
                    <img src={getModelIcon(modelName)} alt={`${modelName} icon`} className="w-full h-full object-contain" />
                  </span>
                  <span className="text-gray-800 capitalize text-sm">{modelName}</span>
                </div>
                <p className="text-sm text-gray-600">{streamingText || <span className="animate-pulse">마인드맵 생성중...</span>}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 채팅 입력 폼 - 고정 위치 */}
      <div className="w-1/2 mx-auto flex gap-2">
        <form onSubmit={handleMessageSend} className="relative flex-1">
          <textarea
            ref={textareaRef}
            value={userInput}
            onChange={handleInputChange}
            rows={1}
            disabled={chatSemaphore || showModelCards}
            placeholder={showModelCards ? "모델을 선택해주세요" : chatSemaphore ? "메시지 전송 중..." : "메시지를 입력하세요"}
            className={`w-full px-4 py-2 pr-12 rounded-lg bg-[#e0e0e0] text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#FFD26F] resize-none overflow-y-auto ${
              chatSemaphore || showModelCards ? "opacity-50 cursor-not-allowed" : ""
            }`}
            style={{ minHeight: "40px", maxHeight: "120px", lineHeight: "24px" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleMessageSend(e)
              }
            }}
          />
          <button
            type="submit"
            disabled={chatSemaphore || showModelCards}
            className={`absolute right-2 top-[8px] text-gray-600 hover:text-[#FBFBFB] ${chatSemaphore || showModelCards ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <ArrowUpCircle size={24} />
          </button>
        </form>

        {/* 모델 선택 드롭다운 */}
        {model && (
          <div className="relative">
            <button onClick={toggleModelDropdown} className="h-[40px] px-4 rounded-lg bg-[#e0e0e0] text-gray-800 hover:bg-[#EFEFEF] flex items-center gap-2">
              <img src={getModelIcon(model)} alt={model} className="w-5 h-5 object-contain" />
              <span className="capitalize">{model}</span>
              <ChevronDown size={16} />
            </button>

            {/* 드롭다운 메뉴 */}
            {isModelDropdownOpen && (
              <div className="absolute bottom-full mb-2 right-0 flex gap-2">
                <div className="w-40 bg-white rounded-lg shadow-lg py-2">
                  {modelList.map((modelName) => (
                    <button
                      key={modelName}
                      onClick={() => changeModel(modelName)}
                      className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-gray-100 ${modelName === model ? "bg-gray-50" : ""}`}
                    >
                      <img src={getModelIcon(modelName)} alt={modelName} className="w-5 h-5 object-contain" />
                      <span className="capitalize">{modelName}</span>
                    </button>
                  ))}
                </div>
                {/* 세부 모델 목록 드롭다운 */}
                {model && (
                  <div className="w-56 bg-white rounded-lg shadow-lg py-2">
                    <div className="px-4 py-2 text-sm font-medium text-gray-600 border-b border-gray-100"></div>
                    {detailModelList[model].map((detailModelName) => (
                      <button
                        key={detailModelName}
                        onClick={() => changeDetailModel(detailModelName)}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${detailModelName === detailModel ? "bg-gray-50" : ""}`}
                      >
                        {detailModelName}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 마인드맵 버튼 */}
        {mindmapStatus.status === "completed" ? (
          <button onClick={handleMindmapView} className="h-[40px] px-4 rounded-lg bg-[#e0e0e0] text-gray-800 hover:bg-[#EFEFEF] flex items-center gap-2 ml-2">
            마인드맵 조회하기
          </button>
        ) : (
          <button disabled className="h-[40px] px-4 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed flex items-center gap-2 ml-2">
            <span className="animate-spin">⚙️</span>
            {mindmapStatus.message || "마인드맵 생성중"}
          </button>
        )}
      </div>
    </div>
  )
}

export default MainPage
