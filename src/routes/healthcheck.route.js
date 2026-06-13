const { Router } = require("express")
const healthCheckController = require("../controllers/healthcheck.controller.js")

const router = Router()

router.route("/healthCheck").get(healthCheckController)

module.exports = router