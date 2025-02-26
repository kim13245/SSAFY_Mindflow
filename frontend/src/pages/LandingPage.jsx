import React from "react"
import { useNavigate } from "react-router-dom"
import { MessageSquare, Network, ArrowRight } from "lucide-react"

const LandingPage = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#171717]">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              AI와 함께 하는 <br />
              <span className="inline-block text-blue-500 mt-1">스마트한 아이디어 관리</span>
            </h1>
            <p className="text-xl text-gray-400 mb-8">대화하며 정리하고, 마인드맵으로 시각화하세요</p>
            <button onClick={() => navigate("/login")} className="bg-gray-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-600 transition-colors">
              시작하기
              <ArrowRight className="inline ml-2" />
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          {/* Chat Feature */}
          <div className="relative group">
            <div className="bg-gray-700 rounded-2xl p-8 transition-transform group-hover:-translate-y-2">
              <MessageSquare className="w-12 h-12 text-blue-500 mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">AI 채팅</h2>
              <p className="text-gray-400 mb-6">다양한 AI 모델과 대화하며 아이디어를 발전시키세요. 실시간으로 피드백을 받고 새로운 관점을 발견할 수 있습니다.</p>
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                {/* 채팅 데모 이미지/영상 */}
                <img src="/landing1.png" alt="AI 채팅 데모" className="w-full h-full object-cover rounded-lg" />
              </div>
            </div>
          </div>

          {/* Mindmap Feature */}
          <div className="relative group">
            <div className="bg-gray-700 rounded-2xl p-8 transition-transform group-hover:-translate-y-2">
              <Network className="w-12 h-12 text-green-500 mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">마인드맵</h2>
              <p className="text-gray-400 mb-6">대화 내용을 자동으로 마인드맵으로 변환합니다. 복잡한 아이디어도 한눈에 파악할 수 있습니다.</p>
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                {/* 마인드맵 데모 이미지/영상 */}
                <img src="/landing2.png" alt="마인드맵 데모" className="w-full h-full object-fill rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">지금 바로 시작하세요</h2>
          <p className="text-gray-400 mb-8">무료로 시작하고, 당신의 아이디어를 체계적으로 관리하세요</p>
          <button onClick={() => navigate("/signup")} className="bg-white text-gray-900 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-colors">
            회원가입
            <ArrowRight className="inline ml-2" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default LandingPage
