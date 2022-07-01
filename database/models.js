const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})

const User = mongoose.model("user", userSchema, process.env.USER_DATA_COLLECTION);

module.exports = {
    User: User
}