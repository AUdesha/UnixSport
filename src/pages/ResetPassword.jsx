import { Link } from "react-router-dom";
import "../css/ResetPassword.css";

function ResetPassword() {
  return (
    <div className="reset-container">
      <div className="reset-card">

        <h2>Reset Password</h2>

        <input
          type="password"
          placeholder="New Password"
        />

        <input
          type="password"
          placeholder="Confirm Password"
        />

        <Link to="/login" state={{ userType: "Student" }}>
          <button>
            Reset Password
          </button>
        </Link>

      </div>
    </div>
  );
}

export default ResetPassword;