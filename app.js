//jshint esversion:6
// jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

mongoose.connect("mongodb://127.0.0.1:27017/userDB" ,{useNewUrlParser : true});

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({ extended:true}));


const userSchema = new mongoose.Schema({
    username : String,
    password: String
});



userSchema.plugin(encrypt,{secret : process.env.SECRET , encryptedFields : ["password"]});

const User = new mongoose.model("User",userSchema);

app.post("/register",function(req,res){
    
    const newUser = new User({
        username : req.body.username,
        password : req.body.password
    });

    newUser.save().then(function(){
        res.render("secrets");
    })
    .catch(function(err){
        res.send(err);
    })  
})

app.post("/login",function(req,res){
    const us = req.body.username;
    const pw = req.body.password;

    User.findOne({username : us}).then(function(user){
        if(user.password === pw){
            res.render("secrets");
        }
    })
    .catch(function(err){
        console.log(err);
    })
})

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
})


app.get("/register",function(req,res){
    res.render("register");
})

app.listen(3000,function (){
    console.log("Server started on port 3000");
});