import { ApiError } from "../utils/apiErrors.js";
import { asyncHandle } from "../utils/asyncHandelard.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const varifyJWT = asyncHandle(async(req , _ , next) => {
   try {
    const token =  req.cookies?.accessToken || req.header
    ("Authorization")?.replace("Bearer " , "")
 
    if (!token) {
         throw new ApiError(401 , "Unauthorized request")
    }
 
    const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
 
    const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
    if (!user) {
         //Todo : Discuss about frontend
         throw new ApiError(401 , "Invalid access token")
    }
 
    req.user = user;
    next()
   } catch (error) {
        throw new ApiError(401 , error?.message || "Invalid Access Tocken")
   }
})  