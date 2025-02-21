import { PrivateRoute } from "./PrivateRoute.jsx"
import { PublicRoute } from "./PublicRoute.jsx"
import MainPage from "../pages/MainPage.jsx"
import Login from "../pages/Login.jsx"
import Signup from "../pages/Signup.jsx"
import Profile from "../pages/Profile.jsx"
import MindmapPage from "../pages/MindmapPage.jsx"
import LandingPage from "../pages/LandingPage.jsx"

const routes = [
  {
    path: "/",
    element: <LandingPage />,
    title: "랜딩페이지",
    requireAuth: false,
  },
  {
    path: "/login/",
    element: <PublicRoute element={<Login />} />,
    title: "로그인페이지",
    requireAuth: false,
  },
  {
    path: "/signup/",
    element: <PublicRoute element={<Signup />} />,
    title: "회원가입페이지",
    requireAuth: false,
  },
  {
    path: "/main",
    // element: <PrivateRoute element={<MainPage setRefreshTrigger={undefined} />} />,
    element: <PrivateRoute element={<MainPage />} />,
    title: "메인페이지",
    requireAuth: true,
  },
  {
    path: "/profile/",
    element: <PrivateRoute element={<Profile />} />,
    title: "프로필페이지",
    requireAuth: true,
  },
  {
    path: "/mindmap/",
    element: <PrivateRoute element={<MindmapPage />} />,
    title: "마인드맵페이지",
    requireAuth: true,
  },
  {
    path: "/mindmap/room/:chatRoomId",
    element: <PrivateRoute element={<MindmapPage />} />,
    title: "마인드맵룸상세페이지",
    requireAuth: true,
  },
  {
    path: "/mindmap/node/:id",
    element: <PrivateRoute element={<MindmapPage />} />,
    title: "마인드맵노드상세페이지",
    requireAuth: true,
  },
]

export default routes
