import { heroImg, coverImage, avatarImage, firstImage} from './assets';
// import ProfileCard from "./assets/First.jpeg";
import './App.css';
// import ProfileCard from './components/ProfileCard';
// import FirstCard from "./components/FirstCard";


function App() {
  const myprofile = {
    name: 'John Doe',
    favouritecolor: 'Blue',
    hobbies: 'Reading, Traveling, Cooking',
    profession: 'Software Engineer',
    phoneNumber: '09122040194'
  }

const ProfileCard = [
  {
    // <ProfileCard 
    //      name: "Olawale Victor", 
    //      role="FullStack Developer"
    //      avatarImage={avatarImage}
    //      coverImage={coverImage}
    //      badge="Top Performer"
    //      badgeImage="🏆"
    //      rating={4.8}
    //      price={50}
    //      hours={10}
    //      period="monthly"
    //      dark={false}
    //      firstImage ={firstImage}
    //   />
  }
]

  return (
  <>
      <div>
        <h1>{myprofile.name}</h1>
        <p>{myprofile.favouritecolor}</p>
        <p>{myprofile.hobbies}</p>
        <p>{myprofile.profession}</p>
        <p>{myprofile.phoneNumber}</p>
        <img src={heroImg} alt="Profile Image"/>
      </div>
      

     <ProfileCard 
         name="Olawale Victor"
         role="Full Stack Developer"
         avatarImage={avatarImage}
         coverImage={coverImage}
         badge="Top Performer"
         badgeImage="🏆"
         rating={4.8}
         price={50}
         hours={10}
         period="monthly"
         dark={true}
         firstImage ={firstImage}
      />

      <ProfileCard 
         name="Olawale Victor"
         role="FullStack Developer"
         avatarImage={avatarImage}
         coverImage={coverImage}
         badge="Top Performer"
         badgeImage="🏆"
         rating={4.8}
         price={50}
         hours={10}
         period="monthly"
         dark={false}
         firstImage ={firstImage}
      />

      
      <ProfileCard 
         name="Olawale Victor"
         role="FullStack Developer"
         avatarImage={avatarImage}
         coverImage={coverImage}
         badge="Top Performer"
         badgeImage="🏆"
         rating={4.8}
         price={50}
         hours={10}
         period="monthly"
         dark={false}
         firstImage ={firstImage}
      />

           <ProfileCard 
         name="Olawale Victor"
         role="Full Stack Developer"
         avatarImage={avatarImage}
         coverImage={coverImage}
         badge="Top Performer"
         badgeImage="🏆"
         rating={4.8}
         price={50}
         hours={10}
         period="monthly"
         dark={true}
         firstImage ={firstImage}
      />

           <ProfileCard 
         name="Olawale Victor"
         role="Full Stack Developer"
         avatarImage={avatarImage}
         coverImage={coverImage}
         badge="Top Performer"
         badgeImage="🏆"
         rating={4.8}
         price={50}
         hours={10}
         period="monthly"
         dark={true}
         firstImage ={firstImage}
      />

           <ProfileCard 
         name="Olawale Victor"
         role="Full Stack Developer"
         avatarImage={avatarImage}
         coverImage={coverImage}
         badge="Top Performer"
         badgeImage="🏆"
         rating={4.8}
         price={50}
         hours={10}
         period="monthly"
         dark={true}
         firstImage ={firstImage}
      />

           <ProfileCard 
         name="Olawale Victor"
         role="Full Stack Developer"
         avatarImage={avatarImage}
         coverImage={coverImage}
         badge="Top Performer"
         badgeImage="🏆"
         rating={4.8}
         price={50}
         hours={10}
         period="monthly"
         dark={true}
         firstImage ={firstImage}
      />

           <ProfileCard 
         name="Olawale Victor"
         role="Full Stack Developer"
         avatarImage={avatarImage}
         coverImage={coverImage}
         badge="Top Performer"
         badgeImage="🏆"
         rating={4.8}
         price={50}
         hours={10}
         period="monthly"
         dark={true}
         firstImage ={firstImage}
      />

         <ProfileCard 
         name="Olawale Victor"
         role="FullStack Developer"
         avatarImage={avatarImage}
         coverImage={coverImage}
         badge="Top Performer"
         badgeImage="🏆"
         rating={4.8}
         price={50}
         hours={10}
         period="monthly"
         dark={false}
         firstImage ={firstImage}
      />

         <ProfileCard 
         name="Olawale Victor"
         role="FullStack Developer"
         avatarImage={avatarImage}
         coverImage={coverImage}
         badge="Top Performer"
         badgeImage="🏆"
         rating={4.8}
         price={50}
         hours={10}
         period="monthly"
         dark={false}
         firstImage ={firstImage}
      />

      {/* {profilecards.map} */}
  </>
    
  )
}



export default App


// import "./App.css";
// import FirstCard from "./components/FirstCard";
// // import SecondCard from "./components/SecondCard";

// function App() {
//   return (
  
//       <FirstCard />

  
//   );
// }

// export default App;
