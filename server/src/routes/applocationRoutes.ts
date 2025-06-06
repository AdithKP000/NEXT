import express from "express"
import { authMiddleware } from "../middleware/authMiddleware";
import { createApplicationController, 
    getAllApplicationsController,
     updateApplicationController 
    } from "../controllers/applicationController";
const router = express.Router();


router.post("/",authMiddleware(["tenant"]),createApplicationController)

router.get("/", authMiddleware(["manager","tenant"]),getAllApplicationsController)

router.put("/:id/status",authMiddleware(["manager"]),updateApplicationController)




export default router




