import React from "react"
import { Navigate } from "react-router-dom"
import { useSelector } from "react-redux"
/**
 * 인증이 필요한 라우트를 보호하는 함수
 * @param {JSX.Element} element - 렌더링할 리액트 컴포넌트
 * @returns {JSX.Element} - 인증 여부에 따라 원래 컴포넌트 또는 로그인 페이지로 리다이렉트
 */
export const PrivateRoute = ({ element, ...rest }) => {
  const { isAuthenticated } = useSelector((state) => state.auth)

  // element에 추가 props 전달
  const elementWithProps = React.cloneElement(element, { ...rest })

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  // replace: true -> 브라우저 히스토리에 현재 페이지를 남기지 않음
  // (뒤로 가기 했을 때 이전 페이지로 돌아가지 않게 함)
  return isAuthenticated ? elementWithProps : <Navigate to="/login" replace />
}
