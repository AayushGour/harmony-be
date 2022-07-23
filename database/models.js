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

const playlistSchema = mongoose.Schema({
    id: {
        type: String
    },
    title: {
        type: String
    },
    author: {
        type: String
    },
    url: {
        type: String
    },
    thumbnailUrl: {
        type: String
    },
    duration: {
        type: String
    }
})
const playlistsSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    type: {
        // type: "custom" || "youtube" || 'combined'
        type: String
    },
    youtubeUrl: {
        type: String
    },
    playlist: {
        type: mongoose.Types.DocumentArray(playlistSchema)
    },
    createdOn: {
        type: Date
    },
})


const Playlist = mongoose.model("playlists", playlistsSchema, process.env.PLAYLIST_COLLECTION);

module.exports = {
    User: User,
    Playlist: Playlist
}