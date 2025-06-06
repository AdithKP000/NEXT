import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { wktToGeoJSON } from "@terraformer/wkt";

const prisma= new PrismaClient();
export const createTenantController = async(req:Request,res:Response): Promise<void> =>{
try {
   const{ cognitoId,name,email,phoneNumber}= req.body
   const tenant =await prisma.tenant.create({
    data:{
        cognitoId,
        name,
        email,
        phoneNumber
    }
   })
       res.status(201).json(tenant);


} catch (error) {
    console.log(error)
     res.status(500).send({
            message:"Error creating new tenant",
            error,
        })  
}
}

export const getTenantController = async(req:Request,res:Response): Promise<void> =>{
try {
     const { cognitoId }=req.params;
        console.log(cognitoId)
    const tenant=await prisma.tenant.findUnique({
        where:{cognitoId},
        include:{
                favorites:true
        }
    })
    if (tenant){
            res.status(200).json(tenant)
    }
    else{
        console.log("no tenant found")
    }
} catch (error) {
    console.log(error)
        res.status(500).send({
            message:"Unable to find the tenant",
            error,
        })  
}
}




export const updateTenantController = async(req:Request,res:Response):Promise<void>=>{
    try {
   const{name,email,phoneNumber}= req.body;
   const { cognitoId}=req.params;
   console.log(cognitoId)
   const updatedTenant =await prisma.tenant.update({
    where:{cognitoId},
    data:{
        name,
        email,
        phoneNumber
    }
   })
       res.status(201).json(updatedTenant);
    } catch (error) {
            console.log(error);
            res.status(500).send({
                success:false,
                message:"Unable to update the user",
                error,
            })
    }
}



export const getTenantPropertiesController= async(req:Request,res:Response):Promise<void>=>
{ try {
        const {cognitoId}=req.params
        const property=await prisma.property.findMany({
            where:{tenants:{some:{cognitoId}}},
            include:{
                location:true,
             }
        });

        const residencesyWithFormattedLocation= await Promise.all(
            property.map(async (prop)=>{
                const coordinates: {coordinates : string}[]=
            await prisma.$queryRaw `SELECT  ST_asText(coordinates) as coordinates from "Location" WHERE id=${prop.location.id} `
            const geoJSON:any= wktToGeoJSON(coordinates[0]?.coordinates || "");
            const longitude=geoJSON.coordinates[0];
            const latitude=geoJSON.coordinates[1];
            return{
                ...prop,
                location:{
                ...prop.location,
                coordinates:{
                    longitude,
                    latitude,
                    }
                }
              }
            })
        )
        res.json(residencesyWithFormattedLocation);
  
    } catch (error) {
        console.log(error)
        console.log(error)
        res.status(500).send({
            success:false,
            message:"Unable to get manager properties",
            error,
        })
    }
}



export const addFavoutitePropertyController= async(req:Request,res:Response): Promise<void> =>{
    try{
        const {cognitoId,propertyId}=req.params;
        const tenant=await prisma.tenant.findUnique({
            where:{cognitoId},
            include:{favorites:true},
        })
        const propertyIDNumber=Number(propertyId);
        const existingFavourites=tenant?.favorites || [] ;
        if(!existingFavourites.some((fav)=>{fav.id == propertyIDNumber}))
        {
            const updatedTenant=await prisma.tenant.update({
                where:{cognitoId},
                data:{
                        favorites:{
                            connect:{id:propertyIDNumber}
                        }
                },
                include:{favorites:true},
            })
            res.json(updatedTenant);
        }
        else
        {res.status(409).send({
                success:false,
                message:"Property already added as favourite",
            })
        }

    } catch (error) {
            console.log(error)
            console.log(error)
            res.status(500).send({
                success:false,
                message:"Unable to add favoutite propertiess properties",
                error,
            })
        }
}




export const removeFavoutitePropertyController= async(req:Request,res:Response): Promise<void> =>{
    try{
        const {cognitoId,propertyId}=req.params;
         const propertyIDNumber=Number(propertyId);
        const updatedTenant=await prisma.tenant.update({
            where:{cognitoId},
            data:{
                        favorites:{
                            disconnect:{id:propertyIDNumber}
                        }
                },
                include:{favorites: true},
        })
            res.json(updatedTenant);
        

    } catch (error) {
            console.log(error)
            console.log(error)
            res.status(500).send({
                success:false,
                message:"Unable to remove favoutite propertiess properties",
                error,
            })
        }
}