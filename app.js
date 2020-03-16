//Database connection

const mongoose = require('mongoose');
const express = require("express");
require('dotenv').config()

const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const cookieParser = require("cookie-parser");

//calling the routes from the Routes folder
const authRoutes = require("./routes/auth");



//db connection
mongoose.connect(process.env.DATABASE,
 { 
     useNewUrlParser: true, 
     useUnifiedTopology :true,
     useCreateIndex: true
    
 }).then( () => {
     console.log("DB CONNECTED")
 }).catch( err => {
     console.log("ERROR CONNECTING ", err)
 })



 //middlewares
 app.use(bodyParser.json());//Parse incoming request bodies in a middleware before your handlers, available under the req.body property.
 app.use(cookieParser());//deleting/adding values to cookies
 app.use(cors());//for requesting from 3rd party domains 


//MY ROUTES
app.use("/api", authRoutes)//middleware specific to this compoennt


 //port
const port_number = process.env.PORT || 7000;


//starting a server
app.listen(port_number, () => {
    console.log(`App is running ${port_number}`)
})

