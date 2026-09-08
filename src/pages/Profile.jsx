import { useState } from "react";
import { Link } from "react-router-dom";
import "../css/Profile.css";

function Profile() {

  const [profilePic, setProfilePic] = useState("/University logo.jpg");

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setProfilePic(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleUpdate = () => {
    alert("Profile Updated Successfully!");
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
          <input
            type="text"
            value="Udesha Jayamini"
            readOnly
          />

          <label>Email</label>
          <input
            type="email"
            value="udesha@gmail.com"
            readOnly
          />

          <label>Registration Number</label>
          <input
            type="text"
            value="TG2021001"
            readOnly
          />

        </div>

        <button
          className="update-btn"
          onClick={handleUpdate}
        >
          Update Profile
        </button>

        <Link to="/">
          <button className="logout-btn">
            Logout
          </button>
        </Link>

      </div>

    </div>
  );
}

export default Profile;