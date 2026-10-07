import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createStudentEmail } from "../../shared/studentEmail.js";
import "../css/StudentRegistration.css";

function StudentRegistration() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    regNo: "",
    password: "",
    confirmPassword: "",
    faculty: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const generatedEmail = createStudentEmail(formData.regNo, formData.faculty);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.fullName ||
      !formData.regNo ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.faculty
    ) {
      setError("Please fill all fields.");
      return;
    }

    if (!generatedEmail) {
      setError("Enter a valid registration number and select a faculty.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
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
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Student server unavailable. Run npm run server from the sport folder.");
      }

      navigate("/login", {
        state: { userType: "Student", successMessage: "Successfully registered. You can now log in." },
      });
    } catch (registrationError) {
      setError(
        registrationError instanceof TypeError
          ? "Cannot reach the student server. Run npm run server from the sport folder."
          : registrationError.message || "Unable to register."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <img
          src="/rajarata.png"
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

          <input
            type="email"
            value={generatedEmail}
            placeholder="University email generated from registration number"
            aria-label="Generated university email"
            readOnly
          />

          <button type="submit" className="register-btn" disabled={isSubmitting}>
            {isSubmitting ? "Registering..." : "Register"}
          </button>
        </form>

        {error && <p role="alert">{error}</p>}

        <p className="login-link">
          Already has an account?{" "}
          <Link to="/login" state={{ userType: "Student" }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

export default StudentRegistration;