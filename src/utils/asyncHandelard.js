const asyncHandle = (requestHandler) => {
    return (req , res , next) => {
        Promise.resolve(requestHandler(req, res , next))
        .catch((err) => next(err))
    }
}

export {asyncHandle}





// by the help of try catch method

// const asyncHandle = (fn) => async (req , res , next) => {
//     try {
//         await fn(req , res , next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             Success : false,
//             message : err.message
//         })
        
//     }
// }

// }