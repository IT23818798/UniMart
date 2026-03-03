//Mongodb password:cNkvd6cu*MZzi@$
const express = require("express");
const mongoose = require("mongoose");
const messageRoutes = require("./routes/messageRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app=express();
app.use(express.json());
//Middleware
app.use("/api/messages", messageRoutes);
app.use("/api/transactions", transactionRoutes);



mongoose.connect(
  "mongodb+srv://UniMart_admin:cNkvd6cu%2AMZzi%40%24@cluster0.wtfex6d.mongodb.net/UniMart?retryWrites=true&w=majority"
)
.then(()=>console.log("Connected to MongoDB"))
.then(()=> {
        app.listen(5000);
})
.catch((err)=>console.log((err)));