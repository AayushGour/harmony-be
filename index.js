require("dotenv").config();
const express = require("express");
const { verifyToken, generateToken, verifyRefreshToken } = require("./services/auth_service");
const { User } = require("./database/models");
const PORT = 5000;
const app = express();
const cors = require("cors");

//Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
const USER_DATA_COLLECTION = process.env.USER_DATA_COLLECTION;
const mongoose = require("mongoose");
const connectionUri = MONGO_URI;
mongoose.connect(connectionUri).then(resp => {
    console.log("Connection Established")
}).catch(error => {
    console.error(error)
});

app.use(express.json());
app.use(cors());
// App Router
const appRouter = express();
appRouter.use(verifyToken);

appRouter.get("/test", (req, res) => {
    res.send("Authenticated")
})

app.get("/refreshToken", (req, res) => {
    return verifyRefreshToken(req, res);
})

app.post("/login", async (req, res) => {
    let data = req.body;
    User.find(data).then(response => {
        if (response?.length > 0) {
            let tokenResp = generateToken(data);
            res.status(200).send(tokenResp);
        } else {
            res.status(401).send("Invalid Username or Password");
        }
    }).catch(err => {
        console.error(err);
        res.status(401).send("Invalid Username or Password");
    })
})

app.put("/signup", (req, res) => {
    let data = req.body;
    try {
        User.find({ username: data?.username }).then((resp) => {
            if (resp?.length > 0) {
                res.status(401).send("Username already exists.")
            } else {
                mongoose.connection.collection(USER_DATA_COLLECTION).insertOne(data);
                res.status(201).send("User created successfully")
            }
        })
    } catch (error) {
        console.error(error);
        res.status(401).send(error.message);
    }
})

app.use("/api", appRouter);

app.listen(PORT, () => {
    console.log("Server listening on: ", PORT)
})