import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma= new PrismaClient();
export const getLeasesController= async(req:Request,res:Response): Promise<void> =>{
try {
   
    const lease = await prisma.lease.findMany({
        include:{
            tenant: true,
            property:true,
        }
    })
    res.json(lease)

} catch (error) {
    console.log(error)
     res.status(500).send({
            message:"Error creating new leases",
            error,
        })  
}
}

export const getLeasesPaymentController= async(req:Request,res:Response): Promise<void> =>{
try {
   
    const {id}=req.params;
    const payment= await prisma.payment.findMany({
        where:{leaseId:Number(id)},
        
    })
    res.json(payment)

} catch (error) {
    console.log(error)
     res.status(500).send({
            message:"Error creating new lease Payment",
            error,
        })  
}
}