const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const UserSchema = new mongoose.Schema({

    fullname : {
        type : String,
        required : true
    },
    username : {
        type : String,
        required : true,
        unique : true
    },
    email : {
        type : String,
        required : true
    },
    password : {
        type : String,
        required : true
    },
    profileImg : {
        type : String,
        required : true
    },
    coverImage : {
        type : String
    },
    watchHistory : [
        {
            video : {
                type : mongoose.Schema.Types.ObjectId,
                ref : "Video"
            }
        }
    ],
    refreshToken : {
        type : String
    }

}, {timestamps: true})

// To hash the password before its saved in database
UserSchema.pre("save", async function() {

    if(!this.isModified("password")) return

    this.password = await bcrypt.hash(this.password, 10)
})

// A mongoose method to validate password
UserSchema.methods.isPasswordCorrect = async function(password) {

    return await bcrypt.compare(password, this.password)

}

// A mongoose method to generate access token
UserSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            _id : this._id,
            username : this.username
        },
        process.env.ACCESS_TOKEN_KEY,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

// A mongoose method to generate refresh token
UserSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        { _id : this._id},
        process.env.REFRESH_TOKEN_KEY,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

const User = mongoose.model("User", UserSchema)

module.exports = User