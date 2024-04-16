// const { Schema } = require("mongoose");

import mongoose, {Schema} from "mongoose";
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'


const userSchema = new Schema({
    username: {
        type: String,
        required : true,
        unique: true,
        lowercase:true,
        trim: true,
        index: true
    }, 
    email: {
        type: String,
        required : true,
        unique: true,
        lowercase:true,
        trim: true
    },
    fullName: {
        type: String,
        required : true,
        trim: true,
        index: true
    },
    avatar:{
        type: String, //clournary url
        required : true,
    },
    covarImage:{
        type: String, //clournary url
    },
    watchHistory: [
        {
            type: Schema.types.ObjectId,
            ref: "Video"
        }
    ],
    password:{
        type: String,
        required : [true , "password is required"],
    },
    refreshToken :{

    }

},
{timestamps: true}
)

userSchema.pre("save" , function (next) {
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password , 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password , this.password)
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
    {
        _id : this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
)
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            _id : this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User" ,userSchema )
