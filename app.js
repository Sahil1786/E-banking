const exprss=require("express");
const app=exprss();


const connection = require('./db/db.js');

const mainRouter=require("./routes/index.js");
const  cors = require('cors')

 




app.use(exprss.json());

const port=3000 || process.env.Port

const allowedOrigins = [
  "http://192.168.1.48:5173", // Computer A frontend
  "http://192.168.1.35:5173", // Another device/frontend IP
  "http://localhost:5173"     // Local testing
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin); // allow the request
    } else {
      callback(new Error("CORS not allowed for this origin"));
    }
  },
  credentials: true,
}));

app.use("/v1", mainRouter);

 // Use the main router for all routes


app.listen(port,(()=>{
    console.log( `server is running on ${port}`);
    
})
)


