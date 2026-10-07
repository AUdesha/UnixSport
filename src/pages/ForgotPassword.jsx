import { Link } from "react-router-dom";
import "../css/ForgotPassword.css";

function ForgotPassword() {
  return (
    <div className="forgot-container">
      <div className="forgot-card">

        <h2>Reset Password</h2>

        <input
          type="email"
          placeholder="Enter University Email"
        />

        <Link to="/otp-verification">
          <button>
            Send OTP
          </button>
        </Link>

        <p>
          <Link to="/login" state={{ userType: "Student" }}>
            Back to Login
          </Link>
        </p>

      </div>
    </div>
  );
}

export default ForgotPassword;