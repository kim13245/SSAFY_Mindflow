import { useEffect, useState } from "react"
import api from "../api/axios"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { logout } from "../store/slices/authSlice"
import { toast } from "react-toastify"

const Profile = () => {
  // 상태 관리
  const [userName, setUserName] = useState("") // 사용자 이름
  const [accountId, setAccountId] = useState("") // 로그인 아이디
  const [displayName, setDisplayName] = useState("") //사용자 닉네임
  const [email, setEmail] = useState("") // 사용자 이메일
  const [selectedButton, setSelectedButton] = useState("profile") // 현재 선택된 메뉴 상태

  const userId = useSelector((state) => state.auth.user.userId) //User ID

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const getUserInfo = async () => {
    try {
      const response = await api.post(`/api/users/profiles/${userId}`, userId)
      const data = response.data
      console.log("API 응답 데이터:", data)

      setUserName(data.username)
      setEmail(data.email)
      setAccountId(data.accountId)
      setDisplayName(data.displayName)

      // API 응답 이후 상태값 출력
      console.log("상태 업데이트 후 - 유저 정보:", {
        userName: data.username,
        email: data.email,
        accountId: data.accountId,
        displayName: data.displayName,
      })
    } catch (error) {
      console.log(error)
      setUserName("")
      setEmail("")
      setAccountId("")
      setDisplayName("")
    }
  }

  const deleteUser = async () => {
    try {
      const response = await api.delete(`/api/auth/delete/${userId}`)
      if (response.status === 200 || response.status === 204) {
        dispatch(logout())
        toast.success("회원탈퇴 완료되었습니다.")
        navigate("/")
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getUserInfo()
  }, [userId])

  // 상태 변화를 감지하는 별도의 useEffect 추가
  useEffect(() => {
    console.log("상태 변화 감지 - 현재 유저 정보:", {
      userName,
      email,
      accountId,
      displayName,
    })
  }, [userName, email, accountId, displayName])

  // 프로필 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault()
    // 프로필 업데이트 로직 구현 예정
    console.log("프로필 업데이트:", { username: userName, email, accountId, displayName, password: "1234" })
  }

  // 선택된 메뉴에 따른 컨텐츠 렌더링
  const renderContent = () => {
    switch (selectedButton) {
      // 프로필 설정 페이지
      case "profile":
        return (
          <div className="max-w-3xl bg-white p-8 rounded-lg">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">내 프로필</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    이름
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    readOnly
                  />
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    닉네임
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={displayName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    readOnly
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    이메일
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    readOnly
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        )

      // 계정 삭제 페이지
      case "notification":
        return (
          <div className="max-w-3xl bg-white p-8 rounded-lg">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">계정 삭제</h2>
              <button className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">닫기</span>✕
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={deleteUser}
              >
                삭제
              </button>
            </div>
          </div>
        )

      // 결제 페이지
      case "security":
        return (
          <div className="max-w-3xl bg-white p-8 rounded-lg">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">결제</h2>
              <button className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">닫기</span>✕
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                결제
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="h-full flex justify-center">
      <div className="flex h-full max-w-7xl w-full">
        {/* 왼쪽 사이드바: 메뉴 버튼 영역 */}
        <div className="w-64 bg-[#212121] p-4 space-y-4">
          {/* 프로필 설정 버튼 */}
          <button
            onClick={() => setSelectedButton("profile")}
            className={`
              relative 
              w-full 
              px-4 
              py-4
              rounded-full 
              text-white
              transition-all 
              duration-300
              overflow-hidden
              hover:border-[5px]"border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" 
              group
            `}
          >
            <span className="relative z-10">프로필 설정</span>
            {/* 네온 효과를 위한 그라데이션 오버레이 */}
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-white to-transparent group-hover:animate-neon-shine"></div>
          </button>

          {/* 계정 삭제 버튼 */}
          <button
            onClick={() => setSelectedButton("notification")}
            className={`
              relative 
              w-full 
              px-4 
              py-4
              rounded-full 
              text-white
              transition-all 
              duration-300
              overflow-hidden
              hover:border-[5px]"border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" 
              group
            `}
          >
            <span className="relative z-10">계정 삭제</span>
            <div
              className="
                absolute 
                top-0 
                -left-full 
                w-full 
                h-full 
                bg-gradient-to-r 
                from-transparent 
                via-white
                to-transparent
                group-hover:animate-neon-shine
              "
            ></div>
          </button>

          {/* 결제 버튼 */}
          <button
            onClick={() => setSelectedButton("security")}
            className={`
              relative 
              w-full 
              px-4 
              py-4
              rounded-full 
              text-white
              transition-all 
              duration-300
              overflow-hidden
              hover:border-[5px]"border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" 
              group
            `}
          >
            <span className="relative z-10">￦ 결제</span>
            <div
              className="
                absolute 
                top-0 
                -left-full 
                w-full 
                h-full 
                bg-gradient-to-r 
                from-transparent 
                via-white
                to-transparent
                group-hover:animate-neon-shine
              "
            ></div>
          </button>
        </div>

        {/* 메인 컨텐츠 영역: 선택된 메뉴에 따른 컨텐츠 표시 */}
        <div className="flex-1 p-4">{renderContent()}</div>
      </div>
    </div>
  )
}

export default Profile
