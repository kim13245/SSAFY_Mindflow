{
  /*

HCX-003

gemini-2.0-flash-lite-preview-02-05

최신 멀티모달 기능을 지원.
고속 처리와 다양한 작업에서 뛰어난 성능 제공.
복잡한 멀티모달 작업에 적합.)

gemini-2.0-flash

비용 효율성과 낮은 지연 시간에 최적화.
고빈도 작업에서 효율적인 성능 제공.

gemini-1.5-flash

빠르고 다재다능한 성능.
다양한 작업에서 안정적인 결과 제공.

gemini-1.5-pro
복잡한 추론 작업에 적합.
높은 지능이 요구되는 작업에 최적화.



gpt-4
 가장 성능이 뛰어난 모델로, 8192 토큰까지 처리 가능

gpt-3.5-turbo
현재 가장 효과적이고 비용 효율적인 모델로, 4,096개의 토큰을 생성할 수 있습니다

gpt-3.5-turbo-1106

 향상된 명령어 따름, JSON 모드, 재현성 있는 출력 등을 제공하는 최신 GPT-3.5 Turbo 모델입니다


Claude 3 시리즈
Claude 3.5 Sonnet:  claude-3-5-sonnet-20241022
Claude 3.5 Haiku:  claude-3-5-haiku-20241022

Claude 3 Sonnet:  claude-3-sonnet-20240229
Claude 3 Haiku:  claude-3-haiku-20240307
Claude 3 Opus:  claude-3-opus-20240229
 */
}
import { useRef, useEffect, useState, useCallback } from "react"
import { ChevronDown, SendHorizontal, Map, Loader2 } from "lucide-react"
import ModelCard from "../components/common/ModelCard.jsx"
import api from "../api/axios.js"
import { useSelector } from "react-redux"
import { io } from "socket.io-client"
import { useNavigate } from "react-router-dom"

// WebSocket 연결 설정
// - localhost:5001 서버와 웹소켓 연결을 설정
// - 실시간 양방향 통신을 위한 Socket.io 클라이언트 인스턴스 생성

const baseURL = import.meta.env.VITE_APP_SOCKET_BASE_URL

const socket = io(baseURL, {
  autoConnect: false,
  transports: ["websocket"], // WebSocket 프로토콜만 사용
  reconnection: true, // 연결 끊김 시 재연결 시도
  reconnectionAttempts: 5, // 최대 재연결 시도 횟수
  reconnectionDelay: 1000, // 재연결 시도 간격 (1초)
})

// MainPage 컴포넌트 정의
// setRefreshTrigger: 새로운 채팅방 생성 시 사이드바 갱신을 위한 prop
const MainPage = ({
  refreshTrigger,
  setRefreshTrigger,
  currentChatRoom,
  onChatRoomSelect,
  chatSemaphore,
  setChatSemaphore,
  mindSemaphore,
  setMindSemaphore,
  isCollapsed, // 추가된 prop
}) => {
  // ===== Refs =====
  const navigate = useNavigate()
  const textareaRef = useRef(null) // 입력창 높이 자동조절을 위한 ref
  const messagesEndRef = useRef(null) // 새 메시지 추가시 자동 스크롤을 위한 ref
  const containerRef = useRef(null) // 채팅 메시지 컨테이너의 DOM 요소를 참조하기 위한 ref
  const modelDropdownRef = useRef(null)
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
  const [isResponseLoading, setIsResponseLoading] = useState(false) // 채팅 로딩 중 여부
  // 채팅방 관련 상태
  // const [page, setPage] = useState(1) // 무한 스크롤을 위한 현재 페이지 번호 (1부터 시작)
  // const [hasMore, setHasMore] = useState(true) // 더 불러올 이전 메시지가 있는지 여부를 나타내는 플래그
  const [isAutoScroll, setIsAutoScroll] = useState(true) // 자동 스크롤 상태

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
    chatgpt: ["gpt-3.5-turbo", "gpt-3.5-turbo-1106", "gpt-4"],
    claude: ["claude-3-5-sonnet-latest", "claude-3-opus-20240229", "claude-3-5-haiku-20241022"],
    google: ["gemini-2.0-flash-exp", "gemini-2.0-flash-lite-preview-02-05", "gemini-2.0-flash"],
    clova: ["HCX-003"],
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
        console.log(response.data)
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
    // 소켓 연결 시작
    if (!socket.connected) {
      socket.connect()
    }
    // 연결 성공 이벤트
    socket.on("connect", () => {
      socket.emit("join", { room: userId })
      console.log(userId)
    })

    // 연결 에러 이벤트
    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error)
    })

    // 단일 모델 스트리밍 데이터 수신
    socket.on("stream", (data) => {
      // console.log("Stream chunk received:", data)
      setStreamingText((prev) => prev + data.content)
      setIsResponseLoading(false) // 로딩 종료
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
      socket.off("mindmap_status")
    }
  }, [handleStreamEndCallback, userId, currentChatRoom])

  // **모델 선택 시 처리**
  const handleModelSelect = async (modelName) => {
    if (!userId) {
      console.error("유효하지 않은 사용자 ID")
      return
    }

    // responses 대신 modelStreamingTexts 사용
    const streamingText = modelStreamingTexts[modelName]

    setIsResponseLoading(false)
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
        const newChatRoomId = response.data.chat_room_id
        localStorage.setItem("currentChatRoom", newChatRoomId.toString())

        // 새로운 채팅방에 소켓 연결
        socket.emit("join_room", { chatRoomId: newChatRoomId })

        // 마인드맵 상태를 즉시 'generating'으로 설정
        setMindmapStatus({
          status: "generating",
          message: "마인드맵을 생성하고 있습니다",
        })

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
    if (currentChatRoom) {
      setIsResponseLoading(true) // 로딩 시작
    }
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
      setIsResponseLoading(false) // 로딩 종료
    } finally {
      setChatSemaphore(false) // 임계 구역 해제
      setIsResponseLoading(false)
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

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      // 현재 스크롤 위치가 하단이이라면 자동 스크롤 활성화
      const isAtBottom = Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 1
      setIsAutoScroll(isAtBottom)
    }

    container.addEventListener("scroll", handleScroll)

    return () => container.removeEventListener("scroll", handleScroll)
  }, [])

  // 자동 스크롤 이벤트 리스너 등록
  useEffect(() => {
    if (streamingText && containerRef.current && isAutoScroll) {
      const container = containerRef.current
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "auto", // 'smooth' 대신 'auto' 사용
      })
    }
  }, [streamingText, messages, isAutoScroll])

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

  // useEffect 추가
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // **렌더링**
  return (
    <div className="h-full flex flex-col p-4 relative" id="modal-root">
      {/* 메시지 표시 영역 - 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto" style={{ marginBottom: "120px" }} ref={containerRef}>
        {/* 이전 메시지들 표시 */}
        {messages.map((message, index) => (
          <div key={index} className="mb-4">
            <ModelCard text={message.text} isUser={message.isUser} model={message.model} />
          </div>
        ))}

        {/* 스트리밍 중일 때만 임시로 표시되는 메시지 */}
        {(streamingText || isResponseLoading) && (
          <div className="mb-4">
            <ModelCard text={streamingText} isUser={false} model={model} className="animate-pulse model-card" isLoading={isResponseLoading} />
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
                <p className="text-sm text-gray-600">{streamingText || <Loader2 className="w-5 h-5 animate-spin mr-2" />}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 채팅 입력 폼 - Sidebar 너비를 고려한 고정 위치 */}
      <div className={`fixed bottom-0 right-0 bg-transparent backdrop-blur-none border-none transition-all duration-300 ${isCollapsed ? "left-16" : "left-64"}`}>
        <div className="max-w-2xl min-w-fit mx-auto px-4 py-4">
          {/* 상단 버튼 영역 */}
          <div className="flex justify-end gap-2 mb-3">
            {/* 모델 선택 드롭다운과 마인드맵 버튼을 같은 조건으로 감싸기 */}
            {model && (
              <>
                <div className="relative" ref={modelDropdownRef}>
                  <button onClick={toggleModelDropdown} className="h-10 px-4 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 flex items-center gap-2 transition-colors">
                    <img src={getModelIcon(model)} alt={model} className="w-5 h-5 object-contain" />
                    <span className="capitalize">{model}</span>
                    <ChevronDown size={16} />
                  </button>

                  {/* 드롭다운 메뉴 */}
                  {isModelDropdownOpen && (
                    <div className="absolute bottom-full mb-2 right-0 flex gap-2 bg-white rounded-lg shadow-lg p-2">
                      <div className="w-40">
                        {modelList.map((modelName) => (
                          <button
                            key={modelName}
                            onClick={() => changeModel(modelName)}
                            className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-400 ${modelName === model ? "bg-gray-300" : ""}`}
                          >
                            <img src={getModelIcon(modelName)} alt={modelName} className="w-5 h-5 object-contain" />
                            <span className="capitalize">{modelName}</span>
                          </button>
                        ))}
                      </div>
                      {/* 세부 모델 목록 드롭다운 */}
                      {model && (
                        <div className="w-56 bg-white rounded-lg shadow-lg py-2">
                          {detailModelList[model].map((detailModelName) => (
                            <button
                              key={detailModelName}
                              onClick={() => changeDetailModel(detailModelName)}
                              className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-400 ${detailModelName === detailModel ? "bg-gray-300" : ""}`}
                            >
                              {detailModelName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 마인드맵 버튼 */}
                {mindmapStatus.status === "completed" ? (
                  <button onClick={handleMindmapView} className="h-10 px-4 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center gap-2 transition-colors">
                    <Map size={20} />
                    <span className="hidden sm:inline">마인드맵</span>
                  </button>
                ) : (
                  <button disabled className="h-10 px-4 rounded-xl bg-gray-100 text-gray-500 flex items-center gap-2 cursor-not-allowed">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="hidden sm:inline">생성중</span>
                  </button>
                )}
              </>
            )}
          </div>

          {/* 입력창 영역 */}
          <form onSubmit={handleMessageSend} className="relative">
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={handleInputChange}
              rows={1}
              disabled={chatSemaphore || showModelCards}
              placeholder={showModelCards ? "모델을 선택해주세요" : chatSemaphore ? "메시지 전송 중..." : "무엇이 궁금하신가요?"}
              className={`w-full px-4 py-3 pr-12 rounded-2xl bg-gray-100 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-y-auto ${
                chatSemaphore || showModelCards ? "opacity-50 cursor-not-allowed" : ""
              }`}
              style={{ minHeight: "48px", maxHeight: "120px" }}
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
              className={`absolute right-4 bottom-3 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded-lg transition-colors`}
            >
              <SendHorizontal size={24} />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default MainPage
