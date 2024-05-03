import { Router } from "express";
import {upload} from "../middlewares/multer.midddleware.js"
import { deleteVideo, getAllVideos, getVideoById, publishVideo, toggleIsPublished, updateVideo } from "../controllers/video.controller.js";
import { varifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/").get(getAllVideos);

router.route("/publish-video").post( varifyJWT,
    upload.fields(
    [
        {name:"thumbnail", maxCount:1},
        {name:"videoFile", maxCount:1}
    ]
) ,publishVideo);

router.route("/vid/:videoId").get(getVideoById);

router.route("/update-video/:videoId").post(varifyJWT,upload.single("thumbnail"),updateVideo);

router.route("/delete/:videoId").post(varifyJWT, deleteVideo);
router.route("/publish-status/:videoId").post(varifyJWT, toggleIsPublished);

export default router