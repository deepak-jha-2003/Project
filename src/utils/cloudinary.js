import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'

          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


const uplodeOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null
        //uplode the file on cloudianry
        const response = await cloudinary.uploader.upload(localFilePath , {
            resource_type: "auto"
        })
        //file has been uploded sucessfully
        console.log("File is uploded on cloudinary", response.url);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath) //removed the locally saved temporiry file as the uplode operation got fauld
        return null;
    }
}

export { uplodeOnCloudinary }