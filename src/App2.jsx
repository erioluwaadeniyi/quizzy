// import SecondCard from "./components/SecondCard";

// function App2() {
//   return (
//     <SecondCard />
//   );
// }

// export default App2;

// import React from 'react';
// 

// import React from "react";
import JobCard from "./JobCard";
import { jobsData } from "./jobsData";

function App2() {
  return (
    <div style={{
      backgroundColor: "#e5e5e7",
      minHeight: "100vh",
      padding: "40px 20px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center"
    }}>
      {/* 3-Column Responsive Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        maxWidth: "960px",
        width: "100%",
        gap: "24px",
        justifyItems: "center"
      }}>
        {jobsData.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

export default App2;