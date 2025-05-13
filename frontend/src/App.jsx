import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing";
import Authentication from "./pages/Authentication";

function App() {
  return (
    <div>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="auth" element={<Authentication />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
