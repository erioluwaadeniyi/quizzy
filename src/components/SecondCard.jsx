// import React from "react";

const FirstCard = ({
  name = "Odusanya Ademide",
  role = "I'm a Brand Designer who focuses on clarity & emotional connection.",
  rating = "4.8",
  earned = "$45k+",
  rate = "$50/hr",
  image = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop"
}) => {
  return (
    <div style={styles.card}>
      {/* Top Image Container */}
      <div style={styles.imageContainer}>
        <img src={image} alt={name} style={styles.image} />
        <button style={styles.bookmarkBtn} aria-label="Bookmark">
          {/* Bookmark Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>
      </div>

      {/* Profile Details */}
      <div style={styles.content}>
        {/* Name & Verification Badge */}
        <div style={styles.nameRow}>
          <h2 style={styles.name}>{name}</h2>
          {/* Blue Verified Check */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#0095f6">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>

        {/* Bio */}
        <p style={styles.bio}>{role}</p>

        {/* Stats Row */}
        <div style={styles.statsContainer}>
          <div style={styles.statItem}>
            <div style={styles.ratingValue}>
              <span style={styles.star}>★</span> {rating}
            </div>
            <span style={styles.statLabel}>Rating</span>
          </div>

          <div style={styles.divider} />

          <div style={styles.statItem}>
            <span style={styles.statValue}>{earned}</span>
            <span style={styles.statLabel}>Earned</span>
          </div>

          <div style={styles.divider} />

          <div style={styles.statItem}>
            <span style={styles.statValue}>{rate}</span>
            <span style={styles.statLabel}>Rate</span>
          </div>
        </div>

        {/* Action Button */}
        <button style={styles.contactBtn}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "8px" }}>
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          Get In Touch
        </button>
      </div>
    </div>
  );
};

// Component Styles
const styles = {
  card: {
    width: "320px",
    backgroundColor: "#ffffff",
    borderRadius: "28px",
    padding: "16px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: "260px",
    borderRadius: "20px",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  bookmarkBtn: {
    position: "absolute",
    top: "14px",
    right: "14px",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(6px)",
    border: "none",
    borderRadius: "50%",
    width: "36px",
    height: "36px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  content: {
    display: "flex",
    flexDirection: "column",
  },
  nameRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "8px",
  },
  name: {
    margin: 0,
    fontSize: "19px",
    fontWeight: "700",
    color: "#111827",
  },
  bio: {
    margin: "0 0 18px 0",
    fontSize: "13px",
    lineHeight: "1.4",
    color: "#6b7280",
  },
  statsContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: "18px",
  },
  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    flex: 1,
  },
  ratingValue: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  star: {
    color: "#eab308",
    fontSize: "16px",
  },
  statValue: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#111827",
  },
  statLabel: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "2px",
  },
  divider: {
    width: "1px",
    height: "24px",
    backgroundColor: "#e5e7eb",
  },
  contactBtn: {
    backgroundColor: "#0d0f11",
    color: "#ffffff",
    border: "none",
    borderRadius: "24px",
    padding: "13px 0",
    width: "100%",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "background 0.2s ease",
  },
};

export default FirstCard;