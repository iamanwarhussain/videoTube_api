const mongoose = require("mongoose")

const SubscriptionSchema = new mongoose.Schema({

    subscriber: {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    channel: {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }

}, {timestamps: true})

const Subscription = mongoose.model("Subscription", SubscriptionSchema)

module.exports = Subscription