const asyncHandler = require("../utils/asyncHandler.js")
const apiResponse = require("../utils/apiResponse.js")
const apiError = require("../utils/apiError.js")
const User = require("../models/user.model.js")
const { uploadOnCloudinary, removeImageFromCloudinary } = require("../utils/cloudinary.js")
const jwt = require("jsonwebtoken")
const { default: mongoose } = require("mongoose")

async function generateToken(userId) {

    const user = await User.findById(userId)

    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken

    await user.save({validateBeforeSave : false})

    return {accessToken, refreshToken}
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

    const { email, password } = req.body

    if(!email && !password){
        return res
            .status(400)
            .json(new apiError(400, "All fields are required."))
    }

    const user = await User.findOne({email})

    if(!user){
        return res
            .status(404)
            .json(new apiError(404, "User not found."))
    }

    const correctPassword = await user.isPasswordCorrect(password)

    if(!correctPassword){
        return res
            .status(401)
            .json(new apiError(401, "Incorrect password."))
    }

    const {accessToken, refreshToken} = await generateToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new apiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "User logged in successfully."
        ))

})

const logoutUser = asyncHandler( async ( req, res ) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset : {
                refreshToken : 1
            }
        }, 
        {new : true}
    )

    return res
        .status(200)
        .clearCookies("accessToken", options)
        .clearCookies("refreshToken", options)
        .json(new apiResponse(200 , {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler( async ( req, res) => {
    
    const incommingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

    if(!incommingRefreshToken){
        return res 
            .status(401)
            .json(new apiError(401, "Unauthorized request."))
    }

    const decodedToken = await jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_KEY)

    const user = await User.findById(decodedToken?._id).select("-password")

    if(!user){
        return res
            .status(400)
            json(new apiError(400, "Invalid refreshToken"))
    }

    if(incommingRefreshToken?._id !== user._id){
        return res
            .status(400)
            json(new apiError(400, "RefreshToken expired."))
    }
    
    const {accessToken, refreshToken} = generateToken(user._id)

    return res
        .status(200)
        .cookies("accessToken", accessToken, options)
        .cookies("refreshToken", refreshToken, options)
        .json(new apiResponse(
            200,
            {
                accessToken,
                refreshToken
            },
            "accessToken refreshed."
         ))

})

const changePassword = asyncHandler( async ( req, res ) => {

    const {oldPassword, newPassword} = req.body

    if(!oldPasswd || !newPasswd){
        return res
        .status(400)
        .json(new apiError(400, "All fields are required"))
    }

    if(oldPasswd === newPasswd){
        return res
        .status(400)
        .json(new apiError(400, "Current password and new password cannot be same"))
    }

    const user = await User.findById(req.user._id)

    const isPasswordCorrect = user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        return res
            .status(401)
            .json(new apiError(401, "Previous password incorrect."))
    }

    user.password = newPassword
    await user.save({validateBeforeSave : false})


})

const changeProfile = asyncHandler( async ( req, res ) => {
    const profileImgLocalPath = req.file.profileImg?.path

    if(!profileImgLocalPath){
        return res
            .status(400)
            .json(new apiError(400, "Image file is required."))
    }

    try {
        const profile = await uploadOnCloudinary(profileImgLocalPath)

        if(!profile || !profile.url){
            return res
            .status(500)
            .json(new apiError(500, "An errror occured while uploading file to cloudinary."))
        }

        const oldProfile = req.user.profileImg

        if(oldProfile){
            const publicId = oldProfile.split("/").pop().split(".")[0]
            await removeImageFromCloudinary(publicId)
        }

        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set : {
                    profileImg : profile.url
                }
            },
            {new : true}
        ).select("-password -refreshToken")

        return res
        .status(200)
        .json(new apiResponse(200, {},  "Avatar updated successfully"))

    } catch (error) {
        return res
            .status(400)
            .json(new apiError(400 , "Something went wrong."))
    }

})

const changeCoverImage = asyncHandler( async ( req, res ) => {

    const coverImageLocalPath = req.file.coverImage?.path

    if(!coverImageLocalPath){
        return res
            .status(400)
            .json(new apiError(400, "Image file is required."))
    }

    try {
        const coverImage = await uploadOnCloudinary(coverImageLocalPath)

        if(!coverImage || !coverImage.url){
            return res
            .status(500)
            .json(new apiError(500, "An errror occured while uploading file to cloudinary."))
        }

        const oldCoverImage = req.user.coverImage

        if(oldCoverImage){
            const publicId = oldCoverImage.split("/").pop().split(".")[0]
            await removeImageFromCloudinary(publicId)
        }

        await User.findByIdAndUpdate(
            req.user._id,
            {
                $set : {
                    coverImage : coverImage.url
                }
            },
            {new : true}
        ).select("-password -refreshToken")

        return res
        .status(200)
        .json(new apiResponse(200, {},  "Avatar updated successfully"))

    } catch (error) {
        return res
            .status(400)
            .json(new apiError(400 , "Something went wrong."))
    }

})

const updateDetails = asyncHandler( async ( req, res ) => {
    const {fullname, email, username} = req.body

    const requiredFields = {}

    if(fullname) requiredFields.fullname = fullname
    if(email) requiredFields.email = email
    if(username) requiredFields.username = username

    if(Object.keys(requiredFields).length === 0){
        return res
            .status(400)
            .json(new apiError(400, "Atleast one field is required."))
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set : {
                ...requiredFields
            }
        },
        {new : true}
    ).select("-password -refreshToken")

    if(!user){
        return res
            .status(404)
            .json(new apiError(404, "User not found."))
    }

    return res
        .status(200)
        .json(new apiResponse(200, user, "User details updated successfully."))
})

const getUserProfile = asyncHandler( async ( req, res ) => {
    const username = req.params

    if(!username.trim()){
        return res
            .status(400)
            .json(new apiError(400, "Username is required."))
    }

    const channel = await User.aggregate([
        {
            $match : {
                username : username.toLowerCase()
            }
        },

        {
            $lookup : {
                from : "subscriptions",
                localField : "subscriber",
                foreignField : "_id",
                as : "subscribers"
            }
        },

        {
            $lookup : {
                from : "subscriptions",
                localField : "channel",
                foreignField : "_id",
                as : "subscribedTo"
            }
        },

        {
            $addFields : {
                subscriberCount : {
                    $size : "$subscribers"
                },

                subscribedToCount : {
                    $size : "$subscribedTo"
                },

                isSubscriber : {
                    $cond : {
                        if : {
                            $in : [req.user._id, "$subscribers.subscriber"],
                            then : true,
                            else : false
                        }
                    }
                }
            }
        },

        {
            $project : {
                fullname : 1,
                username : 1,
                email : 1,
                profileImg : 1,
                coverImage : 1,
                subscriberCount : 1,
                subscribedToCount : 1,
                isSubscriber : 1,
            }
        }
    ])

    if(!channel.length){
        return res
            .status(404)
            .json(new apiError(404, "Channel not found."))
    }

    return res
        .status(200)
        .json(new apiResponse(200, channel[0], "Profile fetched successfully."))
})

const getUserHistory = asyncHandler( async ( req, res ) => {
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user._id)
            }
        },

        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup : {
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project : {
                                        username : 1,
                                        profileImg : 1
                                    }
                                }
                            ]
                        }
                    },

                    {
                        $unwind : {
                            path : "$owner",
                            preserveNullAndEmptyArrays : true
                        }
                    }
                ]
            }
        },

        {
            $project : {
                watchHistory : 1,
                owner : 1
            }
        }
    ])

    if(!user || !user.length){
        return res
            .status(404)
            .json(new apiError(404, "User not found."))
    }

    return res
        .status(200)
        .json(new apiResponse(200, user[0], "WatchHistory fetched successfully."))
})

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    changeProfile,
    changeCoverImage,
    updateDetails,
    getUserProfile,
    getUserHistory
}