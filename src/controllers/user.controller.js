const asyncHandler = require("../utils/asyncHandler.js")
const apiResponse = require("../utils/apiResponse.js")
const apiError = require("../utils/apiError.js")
const User = require("../models/user.model.js")
const { uploadOnCloudinary, removeImageFromCloudinary } = require("../utils/cloudinary.js")

async function generateToken(userId) {

    const user = await User.findById(userId)

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken

    await user.save({validateBeforeSave : false})

    return accessToken, refreshToken
}

const options = {
    httpOnly : true,
    secure : true
}

const registerUser = asyncHandler( async ( req, res ) => {

    const {fullname, username, email, password} = req.body

    if([fullname, username, email, password].some(field => field?.trim() === "")){
        return res
            .status(400)
            .json(new apiError(400, "All fields are required."))
    }

    const existedUser = await User.findOne({
        $or : [{username}, {email}]
    })

    if(existedUser){
        return res
            .status(409)
            .json(new apiError(409, "User with this username or email already exists."))
    }

    const profileImgLocalPath = req.files.profileImg[0]?.path
    let coverImageLocalPath

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ){
        coverImageLocalPath = req.files.coverImage[0]?.path
    }

    if(!profileImgLocalPath){
        return res
            .status(400)
            .json(new apiError(400, "Profile image is required."))
    }

    const profile = await uploadOnCloudinary(profileImgLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!profile){
        return res
            .status(500)
            .json(new apiError(500, "An error occured while uploading file to third-party system."))
    }

    const user = await User.create({
        fullname : fullname.trim(),
        username : username.trim(),
        email,
        password,
        profileImg : profile.url,
        coverImage : coverImage.url
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser){
        return res
            .status(500)
            .json(new apiError(500, "Internal server error while creating new user."))
    }

    return res
        .status(200)
        .json(new apiResponse(201, createdUser, "User created successfully."))
})

const loginUser = asyncHandler( async ( req, res ) => {
    const {email, password} = req.body

    if([email, password].some( field => field.trim() === "")){
        return res
            .status(400)
            .json(new apiError(400, "All fields are required."))
    }

    
})

const logoutUser = asyncHandler( async ( req, res ) => {

})

const changePassword = asyncHandler( async ( req, res ) => {

})

const changeProfile = asyncHandler( async ( req, res ) => {

})

const changeCoverImage = asyncHandler( async ( req, res ) => {

})

const updateDetails = asyncHandler( async ( req, res ) => {

})

module.exports = {
    registerUser,
    loginUser
}