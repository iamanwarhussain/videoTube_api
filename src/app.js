const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const morgan = require("morgan")
const logger = require("./utils/logger.js")

const app = express()

// Logging format and logger middleware for structerized log messages
const morganFormat = ":method :url :status :response-time ms"

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

// Build-in middlewares
app.use(cors({ origin : process.env.CORS , credentials : true }))
app.use(cookieParser())
app.use(express.json({ limit : "16kb" }))
app.use(express.urlencoded({ extended : true , limit : "16kb" }))
app.use(express.static("public"))

// Importing routes
const healthCheckRoute = require("./routes/healthcheck.route.js")
const userRoute = require("./routes/user.route.js")

// Using routes
app.use("/", healthCheckRoute)
app.use("/api/v1/users", userRoute)

module.exports = app