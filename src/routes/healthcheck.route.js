const { Router } = require("express")
const healthCheck = require("../controllers/healthcheck.controller.js")

const router = Router()

router.route("/").get(healthCheck)

module.exports = router