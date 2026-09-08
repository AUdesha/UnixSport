import { Link, useNavigate } from "react-router-dom";
import "../css/Login.css";


function Login() {
  const navigate = useNavigate();

const handleLogin = () => {
  const userType = document.getElementById("userType").value;

  if (userType === "Student") {
    navigate("/student-dashboard");
  }
  else if (userType === "Gym Coach") {
    navigate("/gym-coach-dashboard");
  }
  else if (userType === "Store Keeper") {
    navigate("/storekeeper-dashboard");
  }
  else {
    alert("Please select a user type");
  }
};

  return (
    <div className="login-page">
      <div className="login-card">

        <img
          src="/University logo.jpg"
          alt="University Logo"
          className="login-logo"
        />

        <h2>Smart University Gym and Equipment System</h2>

        <form className="login-form">

          <label></label>
          <input
            type="email"
            placeholder="Enter your email"
            required
          />

          <label></label>
          <input
            type="password"
            placeholder="Enter your password"
            required
          />

          <label></label>
          <select id="userType">
             <option value="">Select User Type</option>
             <option value="Student">Student</option>
             <option value="Gym Coach">Gym Coach</option>
             <option value="Store Keeper">Store Keeper</option>
          </select>

         <button type="button" onClick={handleLogin}
>           Login
         </button>

        </form>

        <Link to="/forgot-password" className="forgot-link">
          Forgot Password?
        </Link>

        

      </div>
    </div>
  );
}

export default Login;