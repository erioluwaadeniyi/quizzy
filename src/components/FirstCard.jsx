// import "./FirstCard.css";

// export default function FirstCard() {
//   return (
//     <main className="login-page">

//       <div className="login-card">

//         {/* LEFT SIDE */}
//         <section className="image-section">

//           <div className="image-content">
//             <h1>
//               EXPLORE.<br />
//               LEARN.<br />
//               GROW.
//             </h1>
//           </div>

//         </section>


//         {/* RIGHT SIDE */}
//         <section className="form-section">

//           {/* LOGO */}
//           <div className="brand">
//             <div className="brand-symbol">♙</div>
//             <span>YETI.LAB</span>
//           </div>


//           {/* HEADING */}
//           <h2>WELCOME BACK</h2>

//           <p className="description">
//             Enter your email and password to access your account
//           </p>


//           {/* FORM */}
//           <form>

//             {/* EMAIL */}
//             <div className="input-group">
//               <label htmlFor="email">
//                 Email
//               </label>

//               <input
//                 id="email"
//                 type="email"
//                 placeholder="Enter your email"
//               />
//             </div>


//             {/* PASSWORD */}
//             <div className="input-group">
//               <label htmlFor="password">
//                 Password
//               </label>

//               <input
//                 id="password"
//                 type="password"
//                 placeholder="Enter your password"
//               />
//             </div>


//             {/* OPTIONS */}
//             <div className="form-options">

//               <label className="remember">
//                 <input type="checkbox" />
//                 <span>Remember me</span>
//               </label>

//               <a href="#">
//                 Forgot Password
//               </a>

//             </div>


//             {/* SIGN IN */}
//             <button
//               type="submit"
//               className="signin-button"
//             >
//               Sign In
//             </button>


//             {/* GOOGLE */}
//             <button
//               type="button"
//               className="google-button"
//             >
//               <span className="google-icon">G</span>
//               Sign in with Google
//             </button>

//           </form>


//           {/* SIGN UP */}
//           <p className="signup-text">
//             Don't have an account?{" "}
//             <a href="#">
//               Sign up
//             </a>
//           </p>

//         </section>

//       </div>

//     </main>
//   );
// }


import { useState } from "react";

// 1. Variable array containing all your card data (mimics an API response)
const cardsData = [
  {
    id: 1,
    company: "Amazon",
    posted: "5 days ago",
    title: "Senior UI/UX Designer",
    tags: ["Part-Time", "Senior Level"],
    salary: "$120/hr",
    location: "Mumbai, India",
    isSaved: false,
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg",
  },
  {
    id: 2,
    company: "Google",
    posted: "30 days ago",
    title: "Graphic Designer",
    tags: ["Part-Time", "Flexible Schedule"],
    salary: "$150-220k",
    location: "Kochi, India",
    isSaved: true,
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg",
  },
  {
    id: 3,
    company: "Dribbble",
    posted: "18 days ago",
    title: "Senior Motion Designer",
    tags: ["Contract", "Remote"],
    salary: "$85/hr",
    location: "Chennai, India",
    isSaved: false,
    logo: "https://cdn.iconscout.com/icon/free/png-256/free-dribbble-logo-icon-download-in-svg-png-gif-file-formats--social-media-pack-logos-icons-2944810.png",
  },
  {
    id: 4,
    company: "Figma",
    posted: "5 days ago",
    title: "UX Designer",
    tags: ["Full-Time", "In office"],
    salary: "$200-250k",
    location: "Bangalore, India",
    isSaved: true,
    logo: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
  },
  {
    id: 5,
    company: "Airbnb",
    posted: "5 days ago",
    title: "Junior UI/UX Designer",
    tags: ["Contract", "Remote"],
    salary: "$100/hr",
    location: "Delhi, India",
    isSaved: false,
    logo: "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_B%C3%A9lo.svg",
  },
  {
    id: 6,
    company: "Apple",
    posted: "5 days ago",
    title: "Graphic Designer",
    tags: ["Full-Time", "Flexible Schedule"],
    salary: "$85-120k",
    location: "Kerala, India",
    isSaved: true,
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
  },
];

// 2. The Single Card component
const SingleCard = ({ item }) => {
  const [saved, setSaved] = useState(item.isSaved);

  return (
    <div style={styles.card}>
      {/* Top Section */}
      <div style={styles.topRow}>
        <div style={styles.logoCircle}>
          <img src={item.logo} alt={item.company} style={styles.logoImg} />
        </div>
        <button
          onClick={() => setSaved(!saved)}
          style={{
            ...styles.saveBtn,
            backgroundColor: saved ? "#27272a" : "#f4f4f5",
            color: saved ? "#ffffff" : "#71717a",
          }}
        >
          {saved ? "Saved" : "Save"}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill={saved ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ marginLeft: "5px" }}
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

      {/* Middle Section */}
      <div>
        <div style={styles.companyRow}>
          <span style={styles.companyName}>{item.company}</span>
          <span style={styles.postedText}>{item.posted}</span>
        </div>
        <h3 style={styles.jobTitle}>{item.title}</h3>

        {/* Tags */}
        <div style={styles.tagWrapper}>
          {item.tags.map((tag, index) => (
            <span key={index} style={styles.tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div style={styles.bottomRow}>
        <div>
          <div style={styles.salary}>{item.salary}</div>
          <div style={styles.location}>{item.location}</div>
        </div>
        <button style={styles.applyBtn}>Apply now</button>
      </div>
    </div>
  );
};

// 3. Main Component rendering all cards from the variable
const Firstcard = () => {
  return (
    <div style={styles.container}>
      <div style={styles.grid}>
        {cardsData.map((job) => (
          <SingleCard key={job.id} item={job} />
        ))}
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    backgroundColor: "#f2f2f4",
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "40px 20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    maxWidth: "960px",
    width: "100%",
    gap: "24px",
    justifyItems: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: "26px",
    padding: "24px",
    width: "280px",
    height: "320px",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.04)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoCircle: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    border: "1px solid #ebecef",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImg: {
    width: "24px",
    height: "24px",
    objectFit: "contain",
  },
  saveBtn: {
    border: "none",
    borderRadius: "10px",
    padding: "6px 14px",
    fontSize: "12px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  companyRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginTop: "10px",
  },
  companyName: {
    fontSize: "13px",
    fontWeight: "700",
    color: "#09090b",
  },
  postedText: {
    fontSize: "11px",
    color: "#a1a1aa",
  },
  jobTitle: {
    margin: "4px 0 12px 0",
    fontSize: "18px",
    fontWeight: "700",
    color: "#09090b",
  },
  tagWrapper: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
  },
  tag: {
    backgroundColor: "#f4f4f6",
    color: "#52525b",
    fontSize: "11px",
    fontWeight: "600",
    padding: "5px 10px",
    borderRadius: "6px",
  },
  bottomRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: "14px",
    borderTop: "1px solid #f4f4f6",
  },
  salary: {
    fontSize: "15px",
    fontWeight: "700",
    color: "#09090b",
  },
  location: {
    fontSize: "11px",
    color: "#a1a1aa",
    marginTop: "2px",
  },
  applyBtn: {
    backgroundColor: "#09090b",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    padding: "9px 15px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
};

export default Firstcard;