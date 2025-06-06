import  express  from 'express';
import { getLeasesController, getLeasesPaymentController } from '../controllers/leaseController';
import { authMiddleware } from '../middleware/authMiddleware';


const router=express.Router()



router.get("/",authMiddleware(["manager","tenant"]) , getLeasesController)


router.get("/:id/payment",authMiddleware(["manager","tenant"]) ,getLeasesPaymentController);



export default router;