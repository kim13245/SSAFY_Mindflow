import { BrowserRouter as Router } from "react-router-dom"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import AppLayout from "./components/layout/AppLayout"
import "./index.css"

function App() {
  return (
    <Router>
      <AppLayout />
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} closeOnClick pauseOnHover theme="dark" />
    </Router>
  )
}

export default App
