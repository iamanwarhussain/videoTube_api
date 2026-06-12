const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

// Build-in middlewares
app.use(cors({ origin : process.env.CORS , credentials : true }))
app.use(cookieParser)
app.use(express.json({ limit : "16kb" }))
app.use(express.urlencoded({ limit : "16kb" }))
app.use(express.static("public"))

module.exports = app