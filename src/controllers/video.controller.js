const asyncHandler = require("../utils/asyncHandler.js")
const apiError = require("../utils/apiError.js")
const apiResponse = require("../utils/apiResponse.js")
const Video = require("../models/video.model.js")
const { uploadOnCloudinary, removeVideoFromCloudinary, removeImageFromCloudinary } = require("../utils/cloudinary.js")
const { default: mongoose } = require("mongoose")
const User = require("../models/user.model.js")

const getAllVideos = asyncHandler( async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    const matchCondition = {
        isPublished : true
    }

    if(query){
        matchCondition.title = { $regex : query , $options : "i"}
    }

    if(userId){
        matchCondition._id = new mongoose.Types.ObjectId(userId)
    }
    const aggregate = await Video.aggregate([
        {
            $match : matchCondition
        },

        {
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "ownerData",
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
            $unwind : "$ownerData"
        },

        {
            $sort : {
                [sortBy || "createdAt"] : sortType === "asc" ? 1 : -1
            }
        }, 

        {
            $project : {
                title : 1,
                description : 1,
                videofile : 1,
                thumbnail : 1,
                duration : 1,
                views : 1 ,
                owner : 1,
                ownerData : 1
            }
        }

    ])

    if(!aggregate.length){
        return res
            .status(204)
            .json(new apiResponse(204, {}, "No data found."))
    }

    const options = {
        page : parseInt(page),
        limit : parseInt(limit)
    }

    const result = await Video.aggregatePaginate(aggregate, options)

    return res
        .status(200)
        .json(new apiResponse(200, result, "Data fetched successfully."))

})

const uploadVideo = asyncHandler( async (req, res) => {

    const { title, description } = req.body

    if([title, description].some(field => field.trim() === "")){
        return res
            .status(400)
            .json(new apiError(400, "Title & description are required."))
    }

    const existVideo = await Video.findOne({
        title : title,
        description : description,
        owner : req.user._id
    })

    if(existVideo){
        return res
            .status(400)
            .json(new apiError(400, "Video with these title & description already exists with user's account."))
    }

    const localVideoPath = req.files?.videofile[0]?.path
    const localThumbnailPath = req.files?.thumbnail[0]?.path

    if(!(localVideoPath && localThumbnailPath)){
        return res
            .status(400)
            .json(new apiError(400, "Videofile & thumbnail are required."))
    }

    const videofile = await uploadOnCloudinary(localVideoPath)
    const thumbnailfile = await uploadOnCloudinary(localThumbnailPath)

    if(!(videofile && thumbnailfile)){
        return res
            .status(500)
            .json(new apiError(500, "An error occured while uploading on third-party service."))
    }

    const video = await Video.create({
        videofile : videofile.url,
        thumbnail : thumbnailfile.url,
        title : title,
        description : description,
        duration : videofile.duration,
        owner : req.user._id
    })
})

const updateVideo = asyncHandler( async (req, res) => {
    const videoId = req.params
    const {title, description} = req.body

    if([title, description].some(field => field.trim() === "")){
        return res
            .status(400)
            .json(new apiError(400, "Both fields are required."))
    }

    const video = await Video.findById(videoId)

    if(!video){
        return res
            .status(404)
            .json(new apiError(404, "Video not found."))
    }

    if(video.owner.toString() !== req.user._id.toString()){
        return res
            .status(403)
            .json(new apiError(403, "forbidden request."))
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        video._id,
        {
            $set : {
                title : title.trim(),
                description : description.trim()
            }
        },

        {new : true}
    )

    if(!updatedVideo){
        return res
            .status(500)
            .json(new apiError(500, "Internal server error"))
    }

    return res
        .status(200)
        .json(new apiResponse(200, updatedVideo, "Video update success"))

})

const updateThumbnail = asyncHandler( async (req, res) => {
    const videoId = req.params
    const localThumbnailPath = req.file.thumbnail?.path

    const video = await Video.findById(videoId)

    if(!video){
        return res
            .status(404)
            .json(new apiError(404, "Video not found."))
    }

    if(video.owner.toString() !== req.user._id.toString()){
        return res
            .status(403)
            .json(new apiError(403, "forbidden request."))
    }

    try {
        const oldThumbnail = video.thumbnail
    
        const thumbnail = await uploadOnCloudinary(localThumbnailPath)
    
        const publicId = oldThumbnail.split("/").pop().split(".")[0]
    
        await removeImageFromCloudinary(publicId)
    
        const updatedThumbnail = await Video.findByIdAndUpdate(
            video._id,
            {
                $set : {
                    thumbnail : thumbnail.url
                }
            },
    
            {new : true}
        )
    
        if(!updateThumbnail){
            return res
                .status(500)
                .json(new apiError(500, "Internal server error"))
        }
    
        return res
            .status(200)
            .json(new apiResponse(200, updatedThumbnail, "Thumbnail update success"))
    } catch (error) {
        return res
                .status(500)
                .json(new apiError(500, message.error || "Internal server error"))
    }

})

const getVideobyId = asyncHandler( async (req, res) => {
    const videoId = req.params

    try {
        
        const video = await Video.findByIdAndUpdate(
            videoId,

            {
                $inc : {
                    views : 1
                }
            },

            {new : true}
        )

        if(!video){
            return res
                .status(404)
                .json(new apiError(404, "Video not found."))
        }

        await User.findByIdAndUpdate(
            req.user._id,

            {
                $addToSet : {
                    watchHistory : videoId
                }
            },

            {new : true}
        )

        return res
            .status(200)
            .json(new apiResponse(200, video, "Video fetched successfully."))

    } catch (error) {
        return res
                .status(500)
                .json(new apiError(500, message.error || "Internal server error"))
    }
})

const deleteVideo = asyncHandler( async (req, res) => {
    const videoId = req.params

    const video = await Video.findById(videoId)

    if(!video){
        return res
            .status(404)
            .json(new apiError(404, "Video not found."))
    }

    if(video.owner.toString() !== req.user._id.toString()){
        return res
            .status(403)
            .json(new apiError(403, "forbidden request."))
    }

    await Video.findByIdAndDelete(video._id)

    return res
            .status(200)
            .json(new apiResponse(200, {}, "Video deleted successfully."))

})

const togglePublishStatus = asyncHandler( async (req, res) => {
    const videoId = req.params

    const video = await Video.findById(videoId)

    if(!video){
        return res
            .status(404)
            .json(new apiError(404, "Video not found."))
    }

    if(video.owner.toString() !== req.user._id.toString()){
        return res
            .status(403)
            .json(new apiError(403, "forbidden request."))
    }

    await Video.findByIdAndUpdate(
        videoId,
        {
            $set : {
                isPublished : !video.isPublished
            }
        },

        {new : true}
    )

    return res
        .status(200)
        .json(new apiResponse(200, {}, "success"))
})

    

module.exports = {
    getAllVideos,
    uploadVideo,
    updateVideo,
    updateThumbnail,
    getVideobyId,
    togglePublishStatus,
    deleteVideo
}