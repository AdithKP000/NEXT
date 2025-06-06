import express  from "express";
import { createPropertyController, getPropertyController ,updatePropertyController,getPropertiesController} from "../controllers/propertyController";
import { authMiddleware } from "../middleware/authMiddleware";
import multer from "multer";

const storage =multer.memoryStorage();
const upload =multer({storage:storage });

const router=express.Router();
//get all property
router.get('/',getPropertyController)

//get single propertyf 
router.get('/:id',getPropertiesController)

router.post('/:id',authMiddleware(["manager"]), upload.array("photos"),createPropertyController)

// router.put("/:id",updatePropertyController)
export default router