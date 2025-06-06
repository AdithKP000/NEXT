import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { wktToGeoJSON } from "@terraformer/wkt";

const prisma= new PrismaClient();
export const createManagerController = async(req:Request,res:Response): Promise<void> =>{
try {
   const{ cognitoId,name,email,phoneNumber}= req.body
   const manager =await prisma.manager.create({
    data:{
        cognitoId,
        name,
        email,
        phoneNumber
    }
   })
       res.status(201).json(manager);


} catch (error) {
    console.log(error)
     res.status(500).send({
            message:"Error creating new manager",
            error,
        })  
}
}

export const getManagerController = async(req:Request,res:Response): Promise<void> =>{
try {
     const { cognitoId }=req.params;
    const manager=await prisma.manager.findUnique({
        where:{cognitoId},
    })
    if (manager){
        res.status(200).json(manager)

    }
    else{
        res.status(404).json("manager not found")
    }
} catch (error) {
    console.log(error)
        res.status(500).send({
            message:"Unable to find the manager",
            error,
        })  
}
}



export const updateManagerController = async(req:Request,res:Response):Promise<void> =>
{
    try {
     const { cognitoId }=req.params;
      const{name,email,phoneNumber}= req.body;
    const updatedManager =await prisma.manager.update({
        where:{cognitoId},
        data:{
            name,
            email,
            phoneNumber
            }
   })
       res.status(201).json(updatedManager);
    } catch (error) {
            console.log(error);
                res.status(500).send({
                    success:false,
                    message:"Unable to update the Manager",
                    error,
                })
    }
}





export const getManagerPropertiesController = async(req:Request,res:Response):Promise<void>=>
{ try {
        const {cognitoId}=req.params
        const property=await prisma.property.findMany({
            where:{managerCognitoId:cognitoId},
            include:{
                location:true,
             }
        });

        const propertyWithFormattedLocation= await Promise.all(
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
        res.json(propertyWithFormattedLocation);
  
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