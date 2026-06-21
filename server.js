const express =require("express");
const app=express();
const port= process.env.PORT || 6700;

// to tell app where sttaic files are stored
app.use(express.static("frontend"));
app.listen(port,function(){
console.log("App running on https://localhost:" +port);
});