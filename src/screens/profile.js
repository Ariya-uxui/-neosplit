import React, { useEffect, useRef, useState } from "react";
import "./profile.css";

const DEFAULT_PROFILE = {
  name: "NongTaeyoung",
  selectedBias: "Taeyong",
  profileImage:
    "https://i.pinimg.com/736x/0b/11/d4/0b11d44290e5c34a8ebf40c4d58bde8f.jpg",
};

export default function Profile() {
  const [name, setName] = useState(DEFAULT_PROFILE.name);
  const [selectedBias, setSelectedBias] = useState(DEFAULT_PROFILE.selectedBias);
  const [profileImage, setProfileImage] = useState(DEFAULT_PROFILE.profileImage);
  const [toast, setToast] = useState("");

  const fileInputRef = useRef(null);

  const biasList = [
    { id: 1, name: "Taeyong", emoji: "🌹" },
    { id: 2, name: "Doyoung", emoji: "🐰" },
    { id: 3, name: "Johnny", emoji: "🌼" },
    { id: 4, name: "Mark", emoji: "🦁" },
    { id: 5, name: "Haechan", emoji: "☀️" },
    { id: 6, name: "Jaehyun", emoji: "💚" },
    { id: 7, name: "Yuta", emoji: "⭐" },
    { id: 8, name: "Jungwoo", emoji: "🐶" },
    { id: 9, name: "Renjun", emoji: "🍃" },
    { id: 10, name: "Jeno", emoji: "🖤" },
    { id: 11, name: "Jaemin", emoji: "🐰" },
    { id: 12, name: "Chenle", emoji: "🎵" },
    { id: 13, name: "Jisung", emoji: "✨" },
  ];

  useEffect(() => {
    const savedProfile = localStorage.getItem("neosplitProfile");

    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setName(parsed.name || DEFAULT_PROFILE.name);
      setSelectedBias(parsed.selectedBias || DEFAULT_PROFILE.selectedBias);
      setProfileImage(parsed.profileImage || DEFAULT_PROFILE.profileImage);
    }
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 1800);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    setProfileImage(imageUrl);
    setToast("Profile image updated");
  };

  const handleSaveProfile = () => {
    const profileData = {
      name: name.trim() || DEFAULT_PROFILE.name,
      selectedBias,
      profileImage,
    };

    localStorage.setItem("neosplitProfile", JSON.stringify(profileData));
    setName(profileData.name);
    setToast("Profile saved");
  };

  return (
    <div className="profile-page">
      <div className="profile-shell">
        <div className="profile-header-pill">Profile</div>

        <div className="profile-card">
          <div className="profile-avatar-wrap">
            <div className="avatar-ring">
              <img src={profileImage} alt="Profile" className="profile-avatar" />
            </div>
          </div>

          <button className="edit-profile-btn" onClick={handleChooseImage}>
            Edit Profile Pic
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageChange}
          />

          <div className="profile-info-box">
            <span className="profile-info-label">Name</span>

            <input
              className="profile-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />

            <button className="save-profile-btn" onClick={handleSaveProfile}>
              Save Name
            </button>
          </div>

          <div className="profile-section-title">Select Bias</div>

          <div className="bias-grid">
            {biasList.map((bias) => (
              <button
                key={bias.id}
                className={`bias-card ${
                  selectedBias === bias.name ? "active" : ""
                }`}
                onClick={() => setSelectedBias(bias.name)}
              >
                <div className="bias-top">
                  <span className="bias-emoji">{bias.emoji}</span>
                  <span className="bias-name">{bias.name}</span>
                </div>

                {selectedBias === bias.name && (
                  <span className="bias-check">✓</span>
                )}
              </button>
            ))}
          </div>

          <div className="profile-summary">
            <p>
              <strong>Current name:</strong> {name}
            </p>
            <p>
              <strong>Selected bias:</strong> {selectedBias}
            </p>
          </div>
        </div>
      </div>

      {toast && <div className="profile-toast">{toast}</div>}
    </div>
  );
}