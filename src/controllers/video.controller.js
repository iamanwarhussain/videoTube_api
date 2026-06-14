const asyncHandler = require("../utils/asyncHandler.js")
const apiError = require("../utils/apiError.js")
const apiResponse = require("../utils/apiResponse.js")
const Video = require("../models/video.model.js")
const { uploadOnCloudinary, removeVideoFromCloudinary } = require("../utils/cloudinary.js")

const getAllVideos = asyncHandler( async (req, res) => {

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
    
})

const getVideobyId = asyncHandler( async (req, res) => {
    
})

const togglePublishStatus = asyncHandler( async (req, res) => {
    
})

const deleteVideo = asyncHandler( async (req, res) => {
    
})

module.exports = {
    getAllVideos,
    uploadVideo,
    updateVideo,
    getVideobyId,
    togglePublishStatus,
    deleteVideo
}