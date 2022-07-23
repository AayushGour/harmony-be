const crypto = require("crypto-js");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

function encrypt(value) {
    let hash = crypto.HmacSHA512(value, ENCRYPTION_KEY);
    return hash.toString(crypto.enc.Base64);
}
module.exports = {
    encrypt
}