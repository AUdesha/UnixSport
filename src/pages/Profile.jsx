import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/Profile.css";

function Profile() {
  const navigate = useNavigate();
  const [student] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("student") || "null");
    } catch {
      return null;
    }
  });
  const [profilePic, setProfilePic] = useState("/rajarata.png");

  useEffect(() => {
    if (!student) navigate("/login", { replace: true, state: { userType: "Student" } });
  }, [navigate, student]);

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setProfilePic(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUpdate = () => {
    alert("Profile Updated Successfully!");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("student");
      localStorage.removeItem("storekeeper");
      localStorage.removeItem("staff");
      navigate("/login", { replace: true, state: { userType: "Student" } });
    }
  };

  return (
    <div className="profile-container">

      <div className="profile-card">

        <h2>My Profile</h2>

        <img
          src={profilePic}
          alt="Profile"
          className="profile-image"
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />

        <div className="profile-details">

          <label>Name</label>
          <input type="text" value={student?.fullName || ""} readOnly />

          <label>Email</label>
          <input type="email" value={student?.email || ""} readOnly />

          <label>Registration Number</label>
          <input type="text" value={student?.regNo || ""} readOnly />

          <label>Faculty</label>
          <input type="text" value={student?.faculty || ""} readOnly />

        </div>

        <button
          className="update-btn"
          onClick={handleUpdate}
        >
          Update Profile
        </button>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          Logout
        </button>

      </div>

    </div>
  );
}

export default Profile;