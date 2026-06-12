const mongoose = require("mongoose")

const LikeSchema = new mongoose.Schema({

    video : {
        type : mongoose.Schema.Types.ObjectId,
        required : "Video"
    },
    comment : {
        type : mongoose.Schema.Types.ObjectId,
        required : "Comment"
    },
    tweet : {
        type : mongoose.Schema.Types.ObjectId,
        required : "Tweet"
    },
    likedBy : {
        type : mongoose.Schema.Types.ObjectId,
        required : "User"
    }

}, {timestamps: true})

const Like = mongoose.model("Like", LikeSchema)

module.exports = Like