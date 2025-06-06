
import  express  from 'express';
import { 
    createManagerController,
    getManagerController, 
    getManagerPropertiesController, 
    updateManagerController
        } from '../controllers/managerControllers';



const router =express.Router();


//create new Manager if none exist
router.post("/",createManagerController)


// get the Manager
router.get("/:cognitoId",getManagerController);

//update manager
router.put("/:cognitoId",updateManagerController)



//get manager Properties
router.get('/:cognitoId/properties',getManagerPropertiesController)

export default router