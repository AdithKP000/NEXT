import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";

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