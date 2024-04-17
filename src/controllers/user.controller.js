import { asyncHandle } from "../utils/asyncHandelard.js";
import {ApiError} from "../utils/apiErrors.js"
import {User} from "../models/user.model.js"
import {uplodeOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponce.js";

const registerUser = asyncHandle( async (req, res) => {
    //get user deatels from frountend
    //validations - not empty
    //check if user already exist : username , email
    // check for images , check for avtar
    //uplode them the cloudinary
    //cteate user object - create entery in db
    //remove password anfd refrace token field
    //check for user creation 
    //return response

    const {username, email, fullName, password} = req.body
    console.log("Email : " , email);

    if (
        [fullName , username, email , password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All field are required")
    }

    const existedUser = User.findOne({
        $or: [{email},{username}]
    })
    if (existedUser) {
        throw new ApiError(409 , "email and username is already exist!")
    }

    const avatarLocalPath = req.field?.avatar[0]?.path;
    const covarImageLocalFile = req.field?.covarImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400 , " Avtar must be required")
    }

    const avatar = await uplodeOnCloudinary(avatarLocalPath)
    const covarImage = await uplodeOnCloudinary(covarImageLocalFile)

    if (!avatar) {
        throw new ApiError(400 , " Avtar must be required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        covarImage: covarImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500 , "Somthing want wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200 , createdUser , "User registered sussefully")
    )


})

export {registerUser}

