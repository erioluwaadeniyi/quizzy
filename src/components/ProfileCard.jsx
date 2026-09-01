// import { coverImage, avatarImage, badgeImage } from "../assets";
import "./ProfileCard.css";

export default function ProfileCard({
  name,
  role,
  avatarImage,
  coverImage,
  badge,
  badgeImage,
  rating,
  price,
  hours,
  period,
  dark = false,
}) {
  return (
    <div className={`profile-card ${dark ? "dark" : "light"}`}>
      {/* Cover */}
      <div className="profile-cover">
        <img src={coverImage} alt="" className="cover-image" />

        {/* Avatar */}
        <img src={avatarImage} alt={name} className="profile-avatar" />

        {/* Badge */}
        <div className="profile-badge">
          <span>{badgeImage}</span>
          {badge}
        </div>

        {/* Action icon */}
        <button className="bookmark-button" aria-label="Bookmark profile">
          🔖
        </button>
      </div>

     {/* Profile information */}
      <div className="profile-content">
        <h2>{name}</h2>
        <p className="profile-role">{role}</p>

        {/* Stats */}
        <div className="profile-stats">
          <div className="stat">
            <span className="stat-icon star">★</span>
            <div>
              <strong>{rating}</strong>
              <small>Rating</small>
            </div>
          </div>

          <div className="stat">
            <span className="stat-icon flag">⚑</span>
            <div>
              <strong>${price}</strong>
              <small>hours</small>
            </div>
          </div>

          <div className="stat">
            <span className="stat-icon clock">◷</span>
            <div>
              <strong>{hours}</strong>
              <small>{period}</small>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button className="contact-button">
          Get In Touch
        </button>
      </div>

    </div>
  )
}