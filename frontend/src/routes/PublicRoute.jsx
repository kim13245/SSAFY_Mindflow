import { Navigate } from "react-router-dom"
import { useSelector } from "react-redux"

export const PublicRoute = ({ element }) => {
  const { isAuthenticated } = useSelector((state) => state.auth)

  // 이미 인증된 사용자는 프로필 페이지로 리다이렉트
  return isAuthenticated ? <Navigate to="/main" replace /> : element
}
