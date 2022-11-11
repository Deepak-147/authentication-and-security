require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;


const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
    extended: true
}));
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

/**
 * create a MODEL. A model is a class with which we construct documents. In this case, each document will be a post with properties(and behaviors) as declared in our schema.
 */
const User = mongoose.model("User", userSchema);

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.get("/register", (req, res) => {
    res.render("register");
});

/***
 * Level 4 Salting and Hashing with bcrypt: An attacker can generate the hash table with sophisticated machines and can lookup your password in the hash table and gain access. To counter this, we can add a salt (some extra strings) to our password and then hash it and store it on database.
 */
app.post("/register", (req, res) => {
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        const newUser = new User({
            email: req.body.username,
            password: hash
        });
    
        newUser.save((err) => {
            if (!err) {
                res.render("secrets");
            }
            else {
                res.send(err);
            }
        });
    });
});

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email: username}, (err, foundUser) => {
        if (!err) {
            if (foundUser) {
                bcrypt.compare(password, foundUser.password, function(err, result) {
                    if (result == true) {
                        res.render("secrets");
                    }
                });
            }
        }
        else {
            res.send(err);
        }
    });
});