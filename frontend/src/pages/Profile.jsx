import { useState } from "react"
import axios from "axios"

const Profile = () => {
  // 상태 관리
  const [name, setName] = useState("") // 사용자 이름 상태
  const [email, setEmail] = useState("") // 사용자 이메일 상태
  const [selectedButton, setSelectedButton] = useState("profile") // 현재 선택된 메뉴 상태

  // 프로필 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault()
    // 프로필 업데이트 로직 구현 예정
    console.log("프로필 업데이트:", { name, email })
  }

  // 선택된 메뉴에 따른 컨텐츠 렌더링
  const renderContent = () => {
    switch (selectedButton) {
      // 프로필 설정 페이지
      case "profile":
        return (
          <div className="max-w-3xl bg-white p-8 rounded-lg">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">프로필 설정</h2>
              <button className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">닫기</span>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 text-4xl">👤</span>
                </div>
                {/* <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  이미지 변경
                </button> */}
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    이름
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
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
        );

      // 계정 삭제 페이지
      case "notification":
        return (
          <div className="max-w-3xl bg-white p-8 rounded-lg">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">계정 삭제</h2>
              <button className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">닫기</span>
                ✕
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                삭제
              </button>
            </div>
          </div>
        );

      // 결제 페이지
      case "security":
        return (
          <div className="max-w-3xl bg-white p-8 rounded-lg">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">결제</h2>
              <button className="text-gray-500 hover:text-gray-700">
                <span className="sr-only">닫기</span>
                ✕
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
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex justify-center">
      <div className="flex h-full max-w-7xl w-full">
        {/* 왼쪽 사이드바: 메뉴 버튼 영역 */}
        <div className="w-64 bg-[#353A3E] p-4 space-y-4">
          {/* 프로필 설정 버튼 */}
          <button
            onClick={() => setSelectedButton("profile")}
            className={`
              relative 
              w-full 
              px-4 
              py-4
              rounded-full 
              bg-white 
              text-black
              transition-all 
              duration-300
              overflow-hidden
              hover:bg-gray-100
              border-[5px]
              ${selectedButton === "profile" // 선택된 버튼 스타일 조건부 적용
                ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" 
                : "border-white hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(250,204,21,0.5)]"
              }
              group
            `}
          >
            <span className="relative z-10">프로필 설정</span>
            {/* 네온 효과를 위한 그라데이션 오버레이 */}
            <div className="absolute top-0 -left-full w-full h-full bg-gradient-to-r from-transparent via-yellow-200/30 to-transparent group-hover:animate-neon-shine"></div>
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
              bg-white 
              text-black
              transition-all 
              duration-300
              overflow-hidden
              hover:bg-gray-100
              border-[5px]
              ${selectedButton === "notification" 
                ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" 
                : "border-white hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(250,204,21,0.5)]"
              }
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
                via-yellow-200/30
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
              bg-white 
              text-black
              transition-all 
              duration-300
              overflow-hidden
              hover:bg-gray-100
              border-[5px]
              ${selectedButton === "security" 
                ? "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]" 
                : "border-white hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(250,204,21,0.5)]"
              }
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
                via-yellow-200/30
                to-transparent
                group-hover:animate-neon-shine
              "
            ></div>
          </button>
        </div>

        {/* 메인 컨텐츠 영역: 선택된 메뉴에 따른 컨텐츠 표시 */}
        <div className="flex-1 p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  )
}

export default Profile
