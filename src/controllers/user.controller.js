import { asyncHandle } from "../utils/asyncHandelard.js";

const registerUser = asyncHandle( async (req, res) => {
    res.status(200).json({
        message: "okk"
    })
})

export {registerUser}

