import { asyncHandle } from "../utils/asyncHandelard.js";
import {ApiError} from "../utils/apiErrors.js"
import {User} from "../models/user.model.js"
import {uplodeOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/apiResponce.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";


const genarateAccessAndReferaceTocken = async(userId) =>
{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken  = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})

        return {accessToken , refreshToken}


    } catch (error) {
        throw new ApiError(500, "Somthing went wrong while generationg access and referace tocken")
    }
}


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

    const existedUser = await User.findOne({
        $or: [{email},{username}]
    })
    if (existedUser) {
        throw new ApiError(409 , "email and username is already exist!")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const covarImageLocalFile = req.files?.covarImage[0]?.path;

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


const loginUser = asyncHandle(async (req , res) => {
    //req body -> data
    //username and email
    //find the user
    //check password
    //generate access token and referece token
    //send cookie


    const {email , password , username} = req.body

    if (!(email || username)) {
        throw new ApiError(400 , "Username or password is requred")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })  
    
    if (!user) {
        throw new ApiError(404 , "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401 , "password incorrect")
        }

    const {accessToken , refreshToken} = await genarateAccessAndReferaceTocken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken , options)
    .cookie("refreshToken" , refreshToken ,options) 
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser , refreshToken , accessToken
            },
            "user loggedin sucessfully"
        )
    )

})

const logoutUser = asyncHandle(async(req ,res) =>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken: 1 // this remove the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200  , {} , "User logged out"))


})

const refreshAccessToken = asyncHandle(async(req ,res) => {
   const incommingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

   if (!incommingRefreshToken) {
        throw new ApiError(401 , "unauthroized request")
   }

   try {
    const decodedToken = jwt.verify(
         incommingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
    )
 
    const user = await User.findById(decodedToken?._id)
 
    if (!user) {
         throw new ApiError(401 , "Invalid refresh token")
     }
 
     if (incommingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401 , "Refresh token is expire or used")
     }
 
 
     const options = {
         httpOnly: true , 
         secure: true
     }
 
     const {accessToken , newRefreshToken} = await genarateAccessAndReferaceTocken(user._id)
 
     return res
     .status(200)
     .cookie("accessToken", accessToken , options)
     .cookie("refreshToken" , newRefreshToken ,options) 
     .json(
         new ApiResponse(
             200,
             {accessToken , refreshToken: newRefreshToken},
             "Access token refreshed"
         )
     )
   } catch (error) {
        throw new ApiError(401 , error?.message || "Invalied Refresh Token")
   }
})

const changeCurrentPassword = asyncHandle(async(req,res) => {
    const {oldPassword , newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Invalid Old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200 , {} , "password change successfully"))
})

const getCurrentUser = asyncHandle(async(req , res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200, 
        req.user , 
        "Current User fatched successfully"))
})

const updateAccountDetails = asyncHandle(async(req , res) =>{
    const {fullName , email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400 , "All filed are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200 , user , "Account Deatels Updated Successfully"))
})

const updateUserAvatar = asyncHandle(async(req , res) =>{
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400 , "Avatar file is missing")
    }

    const avatar = await uplodeOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400 , " Error while uploding on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200 , user , "Avatar Image uploded successfully")
    )
    
})

const updateUserCoverImage = asyncHandle(async(req , res) =>{
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400 , "cover Image file is missing")
    }

    const covarImage = await uplodeOnCloudinary(coverImageLocalPath)

    if (!covarImage.url) {
        throw new ApiError(400 , " Error while uploding on covarImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                covarImage: covarImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200 , user , "covarImage uploded successfully")
    )
    
})

const getUserChannelProfile = asyncHandle(async(req , res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    console.log(channel);

    if (!channel?.length) {
        throw new ApiError(400 , "channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200 , channel[0], "user channel fatched successfully")
    )
})

const getWatchHistory = asyncHandle(async(req , res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})


export {
    registerUser , 
    loginUser , 
    logoutUser , 
    refreshAccessToken ,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}

