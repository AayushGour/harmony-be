const MONGO_URI = process.env.MONGO_URI;
const mongoose = require("mongoose");
const connectionUri = MONGO_URI;
mongoose.connect(connectionUri).then(resp => {
    console.log("Connection Established")
}).catch(error => {
    console.error(error)
});
