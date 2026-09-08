import { useState } from "react";
import { Link } from "react-router-dom";
import "../css/StudentRegistration.css";

function StudentRegistration() {
  const [formData, setFormData] = useState({
    fullName: "",
    regNo: "",
    email: "",
    password: "",
    confirmPassword: "",
    faculty: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !formData.fullName ||
      !formData.regNo ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.faculty
    ) {
      alert("Please fill all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    alert("Registration Successful!");
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

          <button type="submit" className="register-btn">
            Register
          </button>
        </form>

        <p className="login-link">
          Already has an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default StudentRegistration;