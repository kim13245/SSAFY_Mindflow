import { useState } from "react"
import { useDispatch } from "react-redux"
import { login } from "../store/slices/authSlice"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import kakaoIcon from "../assets/kakao-icon.svg" // 카카오 아이콘 이미지

const Login = () => {
  // email -> accountId로 변경
  const [accountId, setAccountId] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("") // 로그인 실패 시 에러 메시지를 저장할 state

  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Mindflow 자체 로그인
  const handleLogin = async (e) => {
    e.preventDefault() // 기본 폼 제출 동작(페이지 새로고침) 방지
    setError("") // 에러 메시지 초기화

    try {
      // 백엔드 API로 로그인 요청
      const response = await api.post("/api/auth/login", {
        accountId, // 직접 accountId 사용
        password,
      })

      // 로그인 성공
      if (response.status === 200) {
        dispatch(login(response.data))
        alert("로그인 성공")
        navigate("/main")
      }
    } catch (error) {
      setError("로그인 실패: 아이디 또는 비밀번호가 올바르지 않습니다.")
      console.error("로그인 실패", error)
    }
  }

  // google 소셜 로그인
  // const handleGoogle = async (e) => {
  //   e.preventDeault()
  //   setError("")
  //
  //   try {
  //     // 구글 API로 로그인 요청
  //   }
  // }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#353a3e] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-extrabold text-white">환영합니다</h2>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <input
              type="text" // email -> text로 변경
              placeholder="아이디" // 이메일 주소 -> 아이디로 변경
              className="appearance-none relative block w-full px-3 py-2 bg-gray-700 border border-gray-600 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="비밀번호"
              className="appearance-none relative block w-full px-3 py-2 bg-gray-700 border border-gray-600 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            로그인
          </button>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <p className="text-center text-sm text-gray-400">
            계정이 없으신가요?{" "}
            <a href="/signup" className="font-medium text-[#0eacf9] hover:text-gray-300">
              회원가입
            </a>
          </p>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-800 text-gray-400">또는</span>
          </div>
        </div>

        <button
          className="
          w-full
          flex
          items-center
          justify-center
          px-4
          py-2
          bg-[#FEE500]
          rounded-md
          text-sm
          font-medium
          text-black
          hover:bg-yellow-500
          focus:outline-none
          focus:ring-2
          focus:ring-offset-2
          focus:ring-yellow-500
          transition-colors
          duration-200"
        >
          <img src={kakaoIcon} alt="카카오 아이콘" className="w-5 h-5 mr-2" /> 카카오 로그인
        </button>
        {/*<button className="*/}
        {/*w-full*/}
        {/*flex*/}
        {/*items-center*/}
        {/*px-4*/}
        {/*py-2*/}
        {/*bg-white*/}
        {/*rounded-md*/}
        {/*text-sm*/}
        {/*font-medium*/}
        {/*text-black*/}
        {/*hover:bg-gray-100*/}
        {/*focus:outline-none*/}
        {/*focus:ring-2*/}
        {/*focus:ring-offset-2*/}
        {/*focus:ring-gray-100*/}
        {/*transition-colors*/}
        {/*duration-200*/}
        {/*">*/}

        {/*</button>*/}

        <div className="flex justify-center space-x-4 text-sm text-[#0eacf9]">
          <a href="#" className="hover:text-gray-300">
            이용약관
          </a>
          <span className="text-gray-400">|</span>
          <a href="#" className="hover:text-gray-300">
            개인정보 보호 정책
          </a>
        </div>
      </div>
    </div>
  )
}

export default Login
