const mongoose = require("mongoose")

const PlaylistSchema = new mongoose.Schema({

    name : {
        type : String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    video : [{
        type : mongoose.Schema.Types.ObjectId,
        required : "Video"
    }],
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        required : "User"
    }

}, {timestamps: true})

const Playlist = mongoose.model("Playlist", PlaylistSchema)

module.exports = Playlist