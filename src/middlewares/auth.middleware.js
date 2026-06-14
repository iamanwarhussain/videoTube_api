const asyncHandler = require("../utils/asyncHandler.js")
const apiError = require("../utils/apiError.js")
const jwt = require("jsonwebtoken")
const User = require("../models/user.model.js")

const verifyToken = asyncHandler( async (req, res, next) => {

    try {
        const token = req.cookies?.AccessToken || req.headers("Authorization")?.replace("Bearer", "")
    
        if(!token){
                return res.json(401).json(new api_error(401, "Unauthorized request"))
        }
    
        const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_KEY)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
                return res.status(400).json(new api_error(400, "Invalid Access Token"))
        }
    
        req.user = user
    
        next()
    } catch (error) {
        return res
            .status(400)
            .json(new apiError(400, error?.message || "Invalid access token."))
    }

} )

module.exports = verifyToken