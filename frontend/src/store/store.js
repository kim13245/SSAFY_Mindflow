// Redux Toolkit의 기본 기능과 Redux Persist 관련 기능들을 import
import { combineReducers, configureStore } from "@reduxjs/toolkit"
import { persistStore, persistReducer } from "redux-persist"
import storage from "redux-persist/lib/storage/session" // localStorage를 사용하기 위한 storage
import authReducer from "./slices/authSlice"

// Redux Persist 설정
const persistConfig = {
  key: "root", // localStorage에 저장될 때의 key 값
  storage, // 사용할 스토리지 (localStorage)
  whitelist: ["auth"], // 리듀서의 상태 저장
}

// 여러 리듀서를 하나로 합침
const rootReducer = combineReducers({
  auth: authReducer, //, 인증 관련 상태 관리
})

// rootReducer를 persist로 감싸서 지속성 부여
const persistedReducer = persistReducer(persistConfig, rootReducer)

// Redux store 생성
export const store = configureStore({
  reducer: persistedReducer, // persist가 적용된 리듀서 사용
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // persist 사용 시 발생하는 직렬화 경고 방지
      serializableCheck: false,
    }),
})

// persist store 생성 - 실제 저장소와 동기화를 담당
export const persistor = persistStore(store)

// 이 설정으로:
// 1. auth 관련 상태는 localStorage에 자동 저장됨
// 2. 페이지 새로고침해도 auth 상태 유지
