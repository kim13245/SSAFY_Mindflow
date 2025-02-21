import { BrowserRouter as Router } from "react-router-dom"
import AppLayout from "./components/layout/AppLayout"
import "./index.css"

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  )
}

export default App
