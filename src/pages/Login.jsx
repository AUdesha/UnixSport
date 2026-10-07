import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { isStudentEmail } from "../../shared/studentEmail.js";
import "../css/Login.css";


function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    userType: location.state?.userType || "Student",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setError("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!["Student", "Store Keeper", "Gym Coach", "Admin"].includes(formData.userType)) {
      setError("Please select a user type to continue.");
      return;
    }

    if (formData.userType === "Student" && !isStudentEmail(formData.email)) {
      setError("Use the email generated from your registration number and faculty.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/students/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Student server unavailable. Run npm run server from the sport folder.");
      }

      if (data.role === "Store Keeper") {
        localStorage.removeItem("student");
        localStorage.removeItem("staff");
        localStorage.setItem("storekeeper", JSON.stringify(data.storekeeper));
        navigate("/storekeeper-dashboard");
      } else if (data.role === "Gym Coach" || data.role === "Admin") {
        localStorage.removeItem("student");
        localStorage.removeItem("storekeeper");
        localStorage.setItem("staff", JSON.stringify(data.staff));
        navigate("/staff-notices");
      } else {
        localStorage.removeItem("storekeeper");
        localStorage.removeItem("staff");
        localStorage.setItem("student", JSON.stringify(data.student));
        navigate("/student-dashboard");
      }
    } catch (loginError) {
      setError(
        loginError instanceof TypeError
          ? "Cannot reach the student server. Run npm run server from the sport folder."
          : loginError.message || "Unable to log in."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <img
          src="/rajarata.png"
          alt="University Logo"
          className="login-logo"
        />

        <h2>Smart University Gym and Equipment System</h2>

        {location.state?.successMessage && (
          <p className="success-message" role="status">
            {location.state.successMessage}
          </p>
        )}

        {location.state?.errorMessage && <p role="alert">{location.state.errorMessage}</p>}

        <div className="login-portal-heading">
          <span>{formData.userType} Portal</span>
          <Link to="/">Change portal</Link>
        </div>

        <form className="login-form" onSubmit={handleLogin}>

          <input
            type="email"
            name="email"
            aria-label="Email"
            placeholder={formData.userType === "Store Keeper" ? "Enter your Store Keeper email" : ["Gym Coach", "Admin"].includes(formData.userType) ? "Enter your staff email" : "Enter your university email"}
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            aria-label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

         <button type="submit" disabled={isSubmitting}>
           {isSubmitting ? "Logging in..." : "Login"}
         </button>

        </form>

        {error && <p role="alert">{error}</p>}

        <Link to="/forgot-password" className="forgot-link">
          Forgot Password?
        </Link>

        

      </div>
    </div>
  );
}

export default Login;