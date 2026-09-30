import { Link } from "react-router-dom";
import "../css/Home.css";
import { useState, useEffect } from "react";

function Home() {
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

const toggleTheme = () => {
  if (darkMode) {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("theme", "light");
  } else {
    document.body.classList.add("dark-mode");
    localStorage.setItem("theme", "dark");
  }

  setDarkMode(!darkMode);
};
  return (
    
    <div className="home-container">
       <header className="navbar">

  <div className="logo-text">
    UniXSport
  </div>

  <div className="nav-right">

    <ul className="nav-menu">
      <li>Home</li>
    </ul>

    <button
      className="theme-btn"
      onClick={toggleTheme}
    >
      {darkMode ? "☀ Light" : "🌙 Dark"}
    </button>

  </div>

</header>

      <section className="hero">

        <img
          src="/University logo.jpg"
          alt="University Logo"
          className="university-logo"
        />

        <h1>
          Smart University Gym and Equipment System
        </h1>

        <p>
          Efficiently manage sports and gym equipment
          borrowing, tracking and returning.
        </p>

        <div className="button-group">
          <Link to="/login">
            <button className="login-btn">
              Login
            </button>
          </Link>

          <Link to="/student-registration">
            <button className="register-btn">
              Student Registration
            </button>
          </Link>
        </div>

      </section>
      <footer className="footer">
  <div className="footer-content">

    <h3>Rajarata University Sport Committee</h3>

    <p>Email: info@rjt.ac.lk</p>

    <p>
      Address: Rajarata University of Sri Lanka,
      Mihintale, Anuradhapura, Sri Lanka
    </p>

    <p>
      Facebook:
      <a
        href="https://www.facebook.com/RajarataUniversity"
        target="_blank"
        rel="noreferrer"
      >
        Rajarata University of Sri Lanka
      </a>
    </p>

    <p className="copyright">
      © 2026 UniXSport - Smart University Gym and Equipment System
    </p>

  </div>
</footer>

    </div>
  );
}

export default Home;