const mongoose = require("mongoose")

const TweetSchema = new mongoose.Schema({
    content : {
        type : String,
        required : true
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
}, {timestamps: true})

const Tweet = mongoose.model("Tweet", TweetSchema)

module.exports = Tweet