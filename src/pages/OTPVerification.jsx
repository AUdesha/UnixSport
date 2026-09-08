import { Link } from "react-router-dom";
import "../css/OTPVerification.css";

function OTPVerification() {
  return (
    <div className="otp-container">
      <div className="otp-card">

        <h2>OTP Verification</h2>

        <input
          type="text"
          placeholder="Enter OTP"
        />

        <Link to="/reset-password">
          <button>
            Verify
          </button>
        </Link>

      </div>
    </div>
  );
}

export default OTPVerification;