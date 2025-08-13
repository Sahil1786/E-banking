const exprss=require("express");
const app=exprss();


const connection = require('./db/db.js');

const mainRouter=require("./routes/index.js");
const  cors = require('cors')

 




app.use(exprss.json());

const port=3000 || process.env.Port

app.use(cors(
    {
        origin: "http://localhost:5173", // Adjust this to your frontend URL
        methods: ['GET', 'POST', 'PUT', 'DELETE'], 
        allowedHeaders: ['Content-Type', 'Authorization'] ,
        credentials:true
    }
));

app.use("/v1", mainRouter);

 // Use the main router for all routes


app.listen(port,(()=>{
    console.log( `server is running on ${port}`);
    
})
)


