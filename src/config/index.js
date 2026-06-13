const mongoose = require("mongoose")

async function ConnectDB() {

    try {

        await mongoose.connect(`${process.env.DATABASE_URL}`)
        console.log(`Database connected successfully.`)

    } catch (error) {
        console.log(`Database connection failed : ${error}`)
        process.exit(1)

    }
}

module.exports = ConnectDB