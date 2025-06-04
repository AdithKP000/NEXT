
import  express  from 'express';
import { 
    createTenantController,
    getTenantController, 
    updateTenantController
        } from '../controllers/tenantControllers';



const router =express.Router();


//create new tenant if none exist
router.post("/",createTenantController)


// get the tenant
router.get("/:cognitoId",getTenantController);

//update Tenant
router.put("/:cognitoId",updateTenantController)



export default router