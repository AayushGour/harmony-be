require("dotenv").config();
const express = require("express");
const { verifyToken, generateToken, verifyRefreshToken } = require("./services/auth_service");
const { User } = require("./database/models");
const PORT = 5000;
const app = express();
const cors = require("cors");

//define fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

//Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI;
const USER_DATA_COLLECTION = process.env.USER_DATA_COLLECTION;
const mongoose = require("mongoose");

// Local Modules
const appRouter = require("./controller/app-router");
const { encrypt } = require("./services/encryption_service");
const ytpl = require("ytpl");

try {
    const connectionUri = MONGO_URI;
    mongoose.connect(connectionUri).then(resp => {
        console.log("Connection Established")
    }).catch(error => {
        console.error(error)
    });
} catch (error) {
    console.error(error)
}


app.use(express.json());
app.use(cors());

app.get("/refreshToken", (req, res) => {
    return verifyRefreshToken(req, res);
})

app.get("/test", async (req, res) => {
    // const ytTrend = require("@freetube/yt-trending-scraper");
    // let params = {
    //     geoLocation: req.query?.geoLocation,
    //     page: req.query?.page || "music",
    //     parseCreatorOnRise: req.query?.parseCreatorOnRise || false
    // }
    // let trending = await ytTrend.scrape_trending_page(params);
    console.log(`Accessed ${req.url}`);
    let ytplt = await ytpl("PLn94luSwc8DmevxNAZK2GkA5of_eU9Mcb");
    res.status(200).send(ytplt);
})

app.post("/login", async (req, res) => {
    try {
        let data = req.body;
        console.log(`Accessed ${req.url}`);
        User.findOne({ username: data?.username }).then(async (response) => {
            console.log("Got User")
            if (!!response) {
                data.password = await encrypt(data.password);
                if (response?.password === data.password) {
                    let tokenResp = generateToken(data);
                    res.status(200).send(tokenResp);
                } else {
                    res.status(401).send("Invalid Username or Password");
                }
            } else {
                console.log(response)
                res.status(401).send("User not found");
            }
        }).catch(err => {
            console.error(err);
            res.status(401).send("Invalid Username or Password");
        })
    } catch (error) {
        console.error(error);
        res.status(500).send(error?.message);
    }
})

app.put("/signup", (req, res) => {
    let data = req.body;
    console.log(`Accessed ${req.url}`);
    try {
        User.find({ username: data?.username }).then((resp) => {
            if (resp?.length > 0) {
                res.status(401).send("Username already exists.")
            } else {
                data.password = encrypt(data?.password);
                mongoose.connection.collection(USER_DATA_COLLECTION).insertOne(data);
                res.status(201).send("User created successfully")
            }
        })
    } catch (error) {
        console.error(error);
        res.status(400).send(error.message);
    }
})

app.use("/api", appRouter);

app.listen(PORT, () => {
    console.log("Server listening on: ", PORT)
})