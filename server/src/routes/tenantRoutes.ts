
import  express  from 'express';
import { 
    addFavoutitePropertyController,
    createTenantController,
    getTenantController, 
    getTenantPropertiesController, 
    removeFavoutitePropertyController, 
    updateTenantController
        } from '../controllers/tenantControllers';



const router =express.Router();


//create new tenant if none exist
router.post("/",createTenantController)


// get the tenant
router.get("/:cognitoId",getTenantController);

//update Tenant
router.put("/:cognitoId",updateTenantController);


//get tenant residencies
router.get("/:cognitoId/current-residences",getTenantPropertiesController);

//add favourite property
router.post("/:cognitoId/favorites/:propertyId",addFavoutitePropertyController);

//Remove favourite property
router.delete("/:cognitoId/favorites/:propertyId",removeFavoutitePropertyController);

export default router