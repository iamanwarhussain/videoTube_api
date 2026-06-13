const asyncHandler = require("../utils/asyncHandler.js")
const apiResponse = require("../utils/apiResponse.js")

const healthCheck = asyncHandler( async (req, res) => {
    return new apiResponse(200, "OK", "success")
})

module.exports = healthCheck