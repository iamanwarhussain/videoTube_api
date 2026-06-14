const {
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
} = require("../controllers/user.controller.js")
const { Router } = require("express")
const upload = require("../middlewares/multer.middleware.js")
const verifyToken = require("../middlewares/auth.middleware.js")

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "profileImg",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyToken, logoutUser)

router.route("/refresh-access-token").post(refreshAccessToken)

router.route("/password").post(verifyToken, changePassword)

router.route("/profile/img").post(verifyToken, upload.single("profileImg"), changeProfile)

router.route("/cover/img").post(verifyToken, upload.single("coverImage"), changeCoverImage)

router.route("/update").post(verifyToken, updateDetails)



module.exports = router