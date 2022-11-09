require('dotenv').config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const md5 = require("md5");

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
 * Level 3 Hashing: Hash the password and then store this hash value as password. Its irreversible process. A secret can be hashed using a hash function, but given a hashed value we cannot obtain the secret.
 */
app.post("/register", (req, res) => {
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password) 
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

app.post("/login", (req, res) => {
    const username = req.body.username;
    const password = md5(req.body.password); // Hash the password given by the user and compare it with the stored hash value

    User.findOne({email: username}, (err, foundUser) => {
        if (!err) {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.render("secrets");
                }
            }
        }
        else {
            res.send(err);
        }
    });
});