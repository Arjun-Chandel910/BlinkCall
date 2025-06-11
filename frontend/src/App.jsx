import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landing";
import Authentication from "./pages/Authentication";
import { ToastContainer, Bounce } from "react-toastify";
import { AuthProvider } from "./context/AuthContext";
import VideoMeet from "./pages/VideoMeet";
import MeetingCodePage from "./pages/MeetingCodePage";
import VideoRoom from "./pages/VideoRoom";
import ClickSpark from "./utils/ClickSpark";
function App() {
  return (
    <div>
      <ClickSpark
        sparkColor="#fff"
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <Router>
          <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick={false}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="dark"
            transition={Bounce}
          />

          <AuthProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="auth" element={<Authentication />} />
              <Route path="/room/:url/prejoin" element={<VideoMeet />} />
              <Route path="/room/:url" element={<VideoRoom />} />
              <Route path="/roomcode" element={<MeetingCodePage />} />
            </Routes>
          </AuthProvider>
        </Router>
      </ClickSpark>
    </div>
  );
}

export default App;
