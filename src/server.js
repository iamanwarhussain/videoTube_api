const dotenv = require("dotenv").config()
const app = require("./app.js")
const ConnectDB = require("../src/config/index.js")

const port = process.env.PORT || 8080

ConnectDB()
.then(() => {
    app.listen(port, console.log(`Server started on ${port}`))
})
.catch((error) => {
    console.log(`Server initialization failed : ${error}`)
})
