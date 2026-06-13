const cloudinary = require("cloudinary").v2
const fs = require("fs")

// Configuring cloudinary
cloudinary.config({

    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET,
    cloud_name : process.env.CLOUDINAR_CLOUD_NAME,
    
})

// Uploading a file to cloudinary
const uploadOnCloudinary = async (localFilePath) => {
    if(!localFilePath) return null

    try {
        const response = await cloudinary.uploader.upload(localFilePath, { resource_type : "auto"})
        console.log(`${response.url}: uploaded successfully.`)
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

const removeImageFromCloudinary = async (publicId) => {
    try {
        if(!publicId) return null
        const respone = await cloudinary.uploader.destroy(publicId, { resource_type : "image"})
        console.log(`${respone} : removed successfully.`)
    } catch (error) {
        console.log(`An error occured while removing file from cloudinary.`)
        return null
    }
}

module.exports = {
    uploadOnCloudinary,
    removeImageFromCloudinary
}