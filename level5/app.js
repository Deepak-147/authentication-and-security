require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
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
    password: String
});

userSchema.plugin(passportLocalMongoose);

/**
 * create a MODEL. A model is a class with which we construct documents. In this case, each document will be a post with properties(and behaviors) as declared in our schema.
 */
const User = mongoose.model("User", userSchema);

// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res) => {
    res.render("home");
});

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
 * Level 5: Using passport to handle salting, hashing, cookies and sessions
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