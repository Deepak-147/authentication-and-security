require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static("public"));

app.listen(port, () => {
    console.log("Server is running on port: "+port);
});

main().catch(err => console.log(err));

async function main() {
    let dbName = "userDB";

    // connecting to local db
    await mongoose.connect('mongodb://localhost:27017/'+dbName);

    // connecting to hosted db (MongoDB Atlas)
    // await mongoose.connect("mongodb+srv://" + process.env.MONGODB_ADMIN_USER + ":" + process.env.MONGODB_ADMIN_PASS + "@cluster0.vekgroy.mongodb.net/" + dbName);
};

/**
 * create a SCHEMA that sets out the fields each document will have and their datatypes and validations.
 **/
const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
/**
 * create a MODEL. A model is a class with which we construct documents. In this case, each document will be a post with properties(and behaviors) as declared in our schema.
 */
const User = mongoose.model("User", userSchema);

// passport.serializeUser(function(user, done) {
//     done(null, user.id);
// });
 
// passport.deserializeUser(function(id, done) {
//     User.findById(id, function(err, user) {
//         done(err, user);
//     });
// });

passport.serializeUser(function(user, done) {
    done(null, user);
});
   
passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
        // console.log(user);
        return cb(err, user);
    });
  }
));

app.get("/", (req, res) => {
    res.render("home");
});

// Google login handling
app.get('/auth/google', 
    passport.authenticate('google', { scope: ['profile'] })
);

// Redirect URL handling
app.get('/auth/google/secrets', 
    passport.authenticate('google', { failureRedirect: '/login' }), 
    function(req, res) {
        // Successful authentication, redirect.
        res.redirect('/secrets');
    }
);

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/secrets", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("secrets");
    }
    else {
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    req.logout(function(err) {
        if (err) {
            console.log(err);
        }
    });
    res.redirect("/");
});


/***
 * Level 6: Using OAuth and passport
 */
app.post("/register", (req, res) => {
    User.register({ username: req.body.username }, req.body.password, function(err, user) {
        if (!err) {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
        else {
            console.log(err);
            res.redirect("/register");
        }
    });
});

app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if (!err) {
            passport.authenticate("local")(req, res, function() {
                res.redirect("/secrets");
            });
        }
        else {
            console.log(err);
        }
    })
});