export const GAME_TEMPLATES=[
 {kind:"quiz",title:"Who Knows Me Better?",prompt:"Let's see if you actually know me 👀",options:["Who knows me better?","What's my biggest green flag?","What would I choose for a perfect day?"]},
 {kind:"quiz",title:"Best Friend Certified",prompt:"Answer a few questions about me and prove you're really my bestie 😂",options:["What's my biggest pet peeve?","Who would I call first?","What am I most likely to be late for?"]},
 {kind:"opinion",title:"Be Honest 👀",prompt:"Give me your honest opinion.",options:[]},
 {kind:"recommendation",title:"What Should I Watch?",prompt:"I want to watch something tonight. What movie or series have you watched that you'd recommend?",options:[]},
 {kind:"recommendation",title:"Give Me One Song",prompt:"What's one song you think I absolutely need to hear?",options:[]},
 {kind:"poll",title:"Pick One",prompt:"Which one would you choose?",options:["Staying home","Going out"]},
 {kind:"quiz",title:"Who Is More Likely? 😂",prompt:"Pick the person most likely to do it.",options:["Start drama","Disappear from the group chat","Eat everyone else's food"]},
];

export const RESULT_TITLES=[
 ["9-10","🤝 BEST FRIEND CERTIFIED","At this point, they probably know your password too. 😂"],
 ["7-8","👀 THEY ACTUALLY KNOW YOU","Okay... they have clearly been paying attention."],
 ["5-6","😂 JUST WINGING IT","Confidence: 100%. Accuracy: questionable."],
 ["3-4","🤨 YOU TWO NEED TO TALK","How do you know each other and still miss this badly?"],
 ["0-2","💀 EXPOSED","You thought you were mysterious. You are not."]
];

export function resultTitle(score){
  const n=Number(score);
  return RESULT_TITLES.find(([range])=>{
    const [a,b]=range.split("-").map(Number); return n>=a&&n<=b;
  })||RESULT_TITLES.at(-1);
}
