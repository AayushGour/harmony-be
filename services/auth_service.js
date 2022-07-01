const jwt = require("jsonwebtoken");
const { User } = require("../database/models");
// require("dotenv").config();

const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_TOKEN_KEY = process.env.REFRESH_TOKEN_KEY;
// const TOKEN_TIMEOUT = process.env.TOKEN_TIMEOUT.toString();
const TOKEN_TIMEOUT = "10s";
const REFRESH_TOKEN_TIMEOUT = process.env.REFRESH_TOKEN_TIMEOUT.toString();

const generateToken = (data) => {
    const token = jwt.sign(data, SECRET_KEY, { algorithm: "HS512", expiresIn: TOKEN_TIMEOUT });
    const refreshTokenData = { u: data?.username, p: data?.password };
    const refreshToken = jwt.sign(refreshTokenData, REFRESH_TOKEN_KEY, { algorithm: "HS512", expiresIn: REFRESH_TOKEN_TIMEOUT });
    return ({
        token: token,
        refreshToken: refreshToken
    });
}

const verifyToken = (req, res, next) => {
    const token = req.headers?.authorization?.replace("Bearer ", "");
    if (!token) {
        return res.status(403).send("Token is required for authentication");
    }
    try {
        const verify = jwt.verify(token, SECRET_KEY, { algorithms: ["HS512"] });
        const data = { username: verify?.username, password: verify?.password }
        User.find(data).then(resp => {
            if (resp?.length > 0) {
                return next();
            } else {
                return res.status(401).send("Invalid Token");
            }
        }).catch(err => {
            console.error(err)
            return res.status(401).send("Invalid Token");
        })
    } catch (error) {
        console.log(error.message);
        if (error.message == "jwt expired") {
            return res.status(403).send("Token Expired");
        } else {
            return res.status(401).send("Invalid Token");
        }
    }
}

const verifyRefreshToken = (req, res) => {
    const token = req.headers?.authorization?.replace("Bearer ", "");
    if (!token) {
        return res.status(403).send("Token is required for authentication");
    }
    try {
        const verify = jwt.verify(token, REFRESH_TOKEN_KEY, { algorithms: ["HS512"] });
        const data = { username: verify?.u, password: verify?.p }
        User.find(data).then(resp => {
            if (resp?.length > 0) {
                const freshToken = generateToken(data);
                return res.status(200).send(freshToken);
            } else {
                return res.status(401).send("Invalid Token");
            }
        }).catch(err => {
            console.error(err)
            return res.status(401).send("Invalid Token");
        })
    } catch (error) {
        return res.status(403).send("Logout");
    }
}


module.exports = {
    generateToken: generateToken,
    verifyToken: verifyToken,
    verifyRefreshToken: verifyRefreshToken
}