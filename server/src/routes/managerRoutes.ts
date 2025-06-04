
import  express  from 'express';
import { 
    createManagerController,
    getManagerController, 
    updateManagerController
        } from '../controllers/managerControllers';



const router =express.Router();


//create new Manager if none exist
router.post("/",createManagerController)


// get the Manager
router.get("/:cognitoId",getManagerController);

//update manager
router.put("/:cognitoId",updateManagerController)



export default router