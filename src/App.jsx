import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import OTPVerification from "./pages/OTPVerification";
import ResetPassword from "./pages/ResetPassword";
import StudentRegistration from "./pages/StudentRegistration";
import StudentDashboard from "./pages/StudentDashboard";
import CoachDashboard from "./pages/CoachDashboard";
import Profile from "./pages/Profile";
import AddEvent from "./pages/AddEvent";
import GymSchedule from "./pages/GymSchedule";
import RequestSchedule from "./pages/RequestSchedule";
import PendingRequests from "./pages/PendingRequests";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/otp-verification" element={<OTPVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/student-registration" element={<StudentRegistration />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/coach-dashboard" element={<CoachDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/add-event" element={<AddEvent />} />
        <Route path="/gym"element={<GymSchedule />}/>
        <Route path="/request-schedule" element={<RequestSchedule />}
        
/>
        <Route path="/pending-requests" element={<PendingRequests />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;