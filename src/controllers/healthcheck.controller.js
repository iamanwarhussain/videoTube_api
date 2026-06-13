const asyncHandler = require("../utils/asyncHandler.js")
const apiResponse = require("../utils/apiResponse.js")

const healthCheckController = asyncHandler( async (req, res) => {
    return res.json(new apiResponse(200, "OK", "success"))
})

module.exports = healthCheckController