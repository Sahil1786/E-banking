const exprss=require("express");
const app=exprss();


const connection = require('./db/db.js');

const mainRouter=require("./routes/index.js");

 




app.use(exprss.json());

const port=3000 || process.env.Port


app.use("/v1", mainRouter);

 // Use the main router for all routes


app.listen(port,(()=>{
    console.log( `server is running on ${port}`);
    
})
)


