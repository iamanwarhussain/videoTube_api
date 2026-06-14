const { uploadVideo } = require("../controllers/video.controller.js")
const { Router } = require("express")
const upload = require("../middlewares/multer.middleware.js")
const verifyToken = require("../middlewares/auth.middleware.js")

const router = Router()

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