//jshint esversion:6
// jshint esversion:6
require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({ extended:true}));

app.use(session({
    secret : "Hellomananbansal.",
    resave : false,
    saveUninitialized  : false
}))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/userDB" ,{useNewUrlParser : true});


const userSchema = new mongoose.Schema({
    username : String,
    password: String,
    googleId : String,
    secret : String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    
    
    
    User.findOrCreate({googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.post("/register",function(req,res){
    User.register({username : req.body.username}, req.body.password ).then(function(user){
        
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        
    }).catch(function(err){
        res.redirect("/register");
    })
    
})

app.post("/login",function(req,res){
    const user = new User({
        username : req.body.username,
        password : req.body.password
    });

    req.login(user,function(err){
        if(err){
            console.log(err);
            res.redirect("/login");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })
})

app.get("/",function(req,res){
    res.render("home");
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
})

app.post("/submit",function(req,res){
    const subs = req.body.secret;
    console.log(req.user)

    User.findById(req.user.id).then(function(user){
        if(user){
            user.secret = subs;
            user.save().then(function(){
                res.redirect("/secrets");
            })
        }
    }).catch(function(err){
        console.log(err);
    })
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] }));


app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/login",function(req,res){
    res.render("login");
})


app.get("/register",function(req,res){
    res.render("register");
})

app.get("/secrets",function(req,res){
    User.find({"secret": {$ne:null}}).then(function(user){
        res.render("secrets", {userWiths: user})
    }).catch(function(err){
        console.log(err);
    })
})

app.get("/logout",function(req,res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }
        else{
            res.redirect("/");
        }
    });

})

app.listen(3000,function (){
    console.log("Server started on port 3000");
});