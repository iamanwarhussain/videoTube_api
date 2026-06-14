const { 
    uploadVideo,
    getAllVideos,
    updateVideo,
    updateThumbnail,
    getVideobyId,
    deleteVideo,
    togglePublishStatus
 } = require("../controllers/video.controller.js")
const { Router } = require("express")
const upload = require("../middlewares/multer.middleware.js")
const verifyToken = require("../middlewares/auth.middleware.js")

const router = Router()

router.route("/").get(getAllVideos)

router.route("/upload").post(
    verifyToken,
    upload.fields([
        {
            name : "videofile",
            maxCount : 1
        }, 
        {
            name : "thumbnail",
            maxCount : 1
        }
    ]),
    uploadVideo
)

router.route("/update/details/:videoId").patch(verifyToken, updateVideo)

router.route("/update/thumbnail/:videoId").patch(verifyToken , updateThumbnail)

router.route("/:videoId").get(verifyToken, getVideobyId)

router.route("/delete/:videoId").delete(verifyToken, deleteVideo)

router.route("/toggle/:videoId").patch(verifyToken, togglePublishStatus)

module.exports = router