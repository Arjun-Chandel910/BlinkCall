import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ToastContainer, Bounce } from "react-toastify";
import { AuthProvider } from "./context/AuthContext";
import ClickSpark from "./utils/ClickSpark";
import AuthGaurd from "./utils/AuthGaurd";

const LandingPage = lazy(() => import("./pages/Landing"));
const Authentication = lazy(() => import("./pages/Authentication"));
const VideoMeet = lazy(() => import("./pages/VideoMeet"));
const VideoRoom = lazy(() => import("./pages/VideoRoom"));
const MeetingCodePage = lazy(() => import("./pages/MeetingCodePage"));

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
            autoClose={2000}
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
            <Suspense
              fallback={
                <div className="text-white text-center mt-10">Loading...</div>
              }
            >
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<Authentication />} />
                <Route element={<AuthGaurd />}>
                  <Route path="/room/:url/prejoin" element={<VideoMeet />} />
                  <Route path="/room/:url" element={<VideoRoom />} />
                  <Route path="/roomcode" element={<MeetingCodePage />} />
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </Router>
      </ClickSpark>
    </div>
  );
}

export default App;
