import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import kakaoIcon from "../assets/kakao-icon.svg" // 카카오 아이콘 이미지

const Signup = () => {
  // state 선언
  const [accountId, setAccountId] = useState("")
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [passwordCheck, setPasswordCheck] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [error, setError] = useState("") // 회원가입 실패 시 에러 메시지를 저장할 state

  const navigate = useNavigate()

  // 회원가입 버튼 클릭 시 실행되는 함수
  const handleSubmit = async (e) => {
    e.preventDefault() // 기본 폼 제출 동작(페이지 새로고침) 방지
    setError("") // 에러 메시지 초기화

    // 비밀번호 일치 여부 확인
    if (password !== passwordCheck) {
      setError("비밀번호가 일치하지 않습니다.")
      return
    }

    // 비밀번호 유효성 검사
    // if (password.length < 8) {
    //   setError("비밀번호는 8자리 이상이어야 합니다.")
    //   return
    // }

    // // 비밀번호 복잡성 검사 (특수문자, 숫자, 영문자 포함)
    // const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[!@#$%^*+=-])(?=.*[0-9]).{8,25}$/
    // if (!passwordRegex.test(password)) {
    //   setError("비밀번호는 영문자, 숫자, 특수문자를 모두 포함해야 합니다.")
    //   return
    // }

    try {
      const response = await api.post("/api/auth/register", {
        accountId,
        username,
        password,
        email,
        displayName,
      })
    
      if (response.status === 200) {
        alert("회원가입이 완료되었습니다. 로그인해주세요.")
        navigate("/login")
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setError("이미 존재하는 아이디입니다.")
      } else if (error.response?.status === 400) {
        if (error.response.data.includes("Username is already taken")) {
          setError("이미 존재하는 사용자 이름입니다.")
        } else {
          setError("입력하신 정보를 다시 확인해주세요.")
        }
      } else {
        setError("회원가입에 실패했습니다. 다시 시도해주세요.")
      }
      console.error("회원가입 실패", error)
    }
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#353a3e] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-extrabold text-white">계정 만들기</h2>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm space-y-4">
            <input
              type="text"
              placeholder="아이디"
              className="appearance-none relative block w-full px-3 py-2 bg-gray-700 border border-gray-600 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            />

            <input
              type="email"
              placeholder="이메일 주소"
              className="appearance-none relative block w-full px-3 py-2 bg-gray-700 border border-gray-600 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="사용자 이름"
              className="appearance-none relative block w-full px-3 py-2 bg-gray-700 border border-gray-600 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="표시 이름"
              className="appearance-none relative block w-full px-3 py-2 bg-gray-700 border border-gray-600 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
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

            <input
              type="password"
              placeholder="비밀번호 확인"
              className="appearance-none relative block w-full px-3 py-2 bg-gray-700 border border-gray-600 placeholder-gray-400 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
              value={passwordCheck}
              onChange={(e) => setPasswordCheck(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            회원가입
          </button>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <p className="text-center text-sm text-gray-400">
            이미 계정이 있으신가요?{" "}
            <a href="/login/" className="font-medium text-[#0eacf9] hover:text-gray-300">
              로그인
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

        <button className="w-full flex items-center justify-center px-4 py-2 bg-[#FEE500] rounded-md text-sm font-medium text-black hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200">
          <img src={kakaoIcon} alt="카카오 아이콘" className="w-5 h-5 mr-2" /> 카카오 로그인
        </button>

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

export default Signup
