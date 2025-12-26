const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "YOUR_DOMAIN",
  databaseURL: "YOUR_DB_URL",
  projectId: "YOUR_PROJECT"
};

firebase.initializeApp(firebaseConfig);

const sendFn = firebase.functions().httpsCallable("sendMessage");

let cooldown = 0;
setInterval(()=>{ if(cooldown>0){cooldown--; document.getElementById("cooldown").innerText=`Wait ${cooldown}s`;} },1000);

document.getElementById("send").onclick = async ()=>{
  if(cooldown>0) return;

  const txt = msg.value.trim();
  if(!txt) return;

  cooldown = 2;

  try{
    await sendFn({
      channelId: "general",
      content: txt,
      username: localStorage.getItem("wallet").slice(0,6)
    });
    msg.value="";
  }catch(e){
    alert(e.message);
    cooldown=0;
  }
};
