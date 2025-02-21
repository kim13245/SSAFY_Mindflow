import axios from "axios"
import { store } from "../store/store"

const baseURL = import.meta.env.VITE_API_BASE_URL

console.log("테스트", baseURL)
// axios 인스턴스 생성
const api = axios.create({
  baseURL: baseURL, // .env에서 가져온 URL 사용
  withCredentials: true, // 쿠키를 요청에 포함시킬지 여부 설정
  headers: {
    "Content-Type": "application/json", // 요청의 Content-Type을 JSON으로 설정
  },
})

// 요청 인터셉터 추가
api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.user?.accessToken
    console.log("토큰 값 확인:", token) // 토큰 값 확인

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log("최종 헤더 확인:", config.headers) // 최종 헤더 확인
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// // 응답 인터셉터 추가
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401 에러 (인증 실패) 발생 시
    if (error.response?.status === 401) {
      // 로그인 페이지로 리다이렉트하는 대신 에러를 던짐
      return Promise.reject(new Error("인증이 필요합니다"))
    }
    return Promise.reject(error)
  }
)

export default api
