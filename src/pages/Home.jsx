import { Link } from "react-router-dom";
import "../css/Home.css";
import { useState, useEffect } from "react";

const portals = [
  { role: "Student", number: "01" },
  { role: "Gym Coach", number: "02" },
  { role: "Store Keeper", number: "03" },
  { role: "Admin", number: "04" },
];

function Home() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
  }, [darkMode]);

  const toggleTheme = () => {
    const nextDarkMode = !darkMode;
    localStorage.setItem("theme", nextDarkMode ? "dark" : "light");
    setDarkMode(nextDarkMode);
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
          src="/rajarata.png"
          alt="University Logo"
          className="university-logo"
        />

        <h1>
          Smart University Gym and Equipment System
        </h1>

        <p>
          Efficiently manage gym schedule and sports equipment
          borrowing, tracking and returning.
        </p>

        <div className="button-group">
          <a href="#portals" className="login-btn">Choose a Portal</a>
          <Link to="/student-registration" className="register-btn">Student Registration</Link>
        </div>

      </section>

      <section className="portal-section" id="portals" aria-labelledby="portal-heading">
        <div className="portal-section-heading">
          <p>UniXSport access</p>
          <h2 id="portal-heading">Choose your portal</h2>
        </div>

        <div className="portal-grid">
          {portals.map((portal) => (
            <Link
              key={portal.role}
              to="/login"
              state={{ userType: portal.role }}
              className="portal-card"
            >
              <span className="portal-number" aria-hidden="true">{portal.number}</span>
              <h3>{portal.role}</h3>
              <p>{portal.description}</p>
              <span className="portal-action">Continue to login <span aria-hidden="true">→</span></span>
            </Link>
          ))}
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