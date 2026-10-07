import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../css/StudentRegistration.css";

function StudentRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    regNo: "",
    email: "",
    password: "",
    confirmPassword: "",
    faculty: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isUniversityEmail = /^[^\s@]+@[^\s@]+\.(edu|ac)(\.[a-z]{2,})?$/i.test(formData.email);

    if (
      !formData.fullName ||
      !formData.regNo ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.faculty
    ) {
      setError("Please fill all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!isUniversityEmail) {
      setError("Use a valid university email ending in .edu or .ac.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/students/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      navigate("/login");
    } catch (registrationError) {
      setError(registrationError.message || "Unable to register.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <img
          src="/University logo.jpg"
          alt="University Logo"
          className="login-logo"
        />

        <h2>Student Registration</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="regNo"
            placeholder="Student Registration No"
            value={formData.regNo}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="University Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />

          <select
            name="faculty"
            value={formData.faculty}
            onChange={handleChange}
            required
          >
            <option value="">Select Faculty</option>
            <option value="Technology">Technology</option>
            <option value="Applied Science">Applied Science</option>
            <option value="Social Science">Social Science</option>
            <option value="Management">Management</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Medicine">Medicine</option>
          </select>

          <button type="submit" className="register-btn" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>

        {error && <p role="alert">{error}</p>}

        <p className="login-link">
          Already has an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default StudentRegistration;