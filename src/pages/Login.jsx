import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/Login.css";


function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "", userType: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setError("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    const isUniversityEmail = /^[^\s@]+@[^\s@]+\.(edu|ac)(\.[a-z]{2,})?$/i.test(formData.email);

    if (formData.userType !== "Student") {
      setError("Please select Student to continue.");
      return;
    }

    if (!isUniversityEmail) {
      setError("Use your university email to log in.");
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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      localStorage.setItem("student", JSON.stringify(data.student));
      navigate("/student-dashboard");
    } catch (loginError) {
      setError(loginError.message || "Unable to log in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <img
          src="/University logo.jpg"
          alt="University Logo"
          className="login-logo"
        />

        <h2>Smart University Gym and Equipment System</h2>

        <form className="login-form" onSubmit={handleLogin}>

          <label></label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label></label>
          <input
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <label></label>
          <select id="userType" name="userType" value={formData.userType} onChange={handleChange}>
             <option value="">Select User Type</option>
             <option value="Student">Student</option>
             <option value="Gym Coach">Gym Coach</option>
             <option value="Store Keeper">Store Keeper</option>
          </select>

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