import React, { useState } from "react"
import { User } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { logout } from "../../store/slices/authSlice"

const Navbar = ({ onChatRoomSelect }) => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [userMenu, setUserMenu] = useState(false)
  const handleLogout = async () => {
    try {
      dispatch(logout())
      localStorage.removeItem("currentChatRoom")
      onChatRoomSelect(null)
      navigate("/login")
    } catch (error) {
      console.error("로그아웃 실패:", error)
    }
  }

  return (
    <nav className="h-14 flex items-center justify-end px-4">
      {/* 우측 아이콘들만 유지 */}
      <div className="flex items-center gap-2 relative">
        <button onClick={() => setUserMenu(!userMenu)} className="p-2 hover:bg-gray-100 rounded-lg">
          <User size={20} className="text-gray-600" />
        </button>
        {userMenu && (
          <div className="absolute z-50 top-[calc(100%+0.25rem)] right-0 mt-1 px-4 py-2 rounded-lg bg-[#e0e0e0] text-gray-800 shadow-white">
            <button
              onClick={() => {
                setUserMenu(!userMenu)
                navigate("/profile")
              }}
              className="p-2 flex items-center gap-2 whitespace-nowrap"
            >
              <span className="text-gray-600 hover:text-gray-100 transition-colors">프로필</span>
            </button>
            <button
              onClick={() => {
                setUserMenu(!userMenu)
                handleLogout()
              }}
              className="p-2 flex items-center gap-2 whitespace-nowrap"
            >
              <span className="text-gray-600 hover:text-gray-100 transition-colors">로그아웃</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
