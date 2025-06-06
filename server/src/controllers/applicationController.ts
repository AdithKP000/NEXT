import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { connect } from "http2";
const prisma= new PrismaClient();


 export const getAllApplicationsController = async(req:Request,res:Response):Promise<void> =>{
    try {
        const {userId,userType}=req.query;
        let whereClause={};

        if(userId && userType)
        {
            if(userType==="tenant")
            {
                whereClause={tenantCognitoId:String(userId)}
            }
            else if(userType==="manager")
            {
                whereClause={
                    property:{
                        managerCognitoId:String(userId),
                    }
                }
            }
        }

        const application= await prisma.application.findMany({
            where:whereClause,
            include:{
                property:{
                    include:{
                        location:true,
                        manager:true,
                    }
                },
                tenant:true,
            }
        })


        function calculateNextPaymentDate(startDate:Date):Date{
            const today= new Date;
            const nextPaymentDate=new Date(startDate);
            while(nextPaymentDate<=today)
            {   
                nextPaymentDate.setMonth(nextPaymentDate.getMonth()+1);
            }
            return nextPaymentDate;
        }

        const formattedApplication= await Promise.all(
            application.map(async (app)=>{
                const lease=await prisma.lease.findFirst({
                    where :{
                        tenant:{
                            cognitoId:app.tenantCognitoId
                        },
                        propertyId:app.propertyId 
                    },
                    orderBy:{startDate:"desc"}
                 });

                 return{
                    ...app,
                    property:{
                        ...app.property,
                        address:app.property.location.address,
                    },
                    manager:app.property.manager,
                    lease:lease? {...lease,nextPaymentDate:calculateNextPaymentDate(lease.startDate)}:null
                 }
            })
        )
        
        res.json(formattedApplication);
    } catch (error) {
        console.log(error);
        res.status(500).send({
            success:false,
            message:"Unable to get all applicaions",
            error,
        })
    }
 }




 export const createApplicationController = async(req:Request,res:Response):Promise<void>=>{
    try {
        const{
            applicationDate,
            status,
            propertyId,
            tenantCognitoId,
            name,
            email,
            phoneNumber,
            message,  
        } = req.body;

        const property= await prisma.property.findUnique({
            where:{id:propertyId},
            select:{pricePerMonth:true, securityDeposit:true}
        });

            if(!property)
            {
                res.status(404).send({
                    success:false,
                    message:"Unable to obtain the property with the given ID",
                })
                return;
            }

        const newApplication= await prisma.$transaction(async(prisma)=>{
            const lease= await prisma.lease.create({
                data:{
                startDate: new Date(),
                endDate:new Date( new Date().setFullYear( new Date().getFullYear() +1)),
                rent:property.pricePerMonth,
                deposit:property.securityDeposit,
                property:{
                    connect:{id:propertyId},
                },
                tenant:{
                    connect:{cognitoId:tenantCognitoId}
                },
                }
            });

            const applicaiton= await prisma.application.create({
                data:{
                    applicationDate: new Date(applicationDate),
                    status,
                    name,
                    email,
                    phoneNumber,
                    message,
                    property:{
                        connect:{id:propertyId}
                    },
                    tenant:{
                        connect:{cognitoId:tenantCognitoId}
                    },
                    lease:{
                        connect:{id:lease.id}
                    }
                },
                include:{
                    property:true,
                    tenant:true,
                    lease:true,
                },
                
            });
            return applicaiton;
        });

        res.status(200).json(newApplication)

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success:false,
            message:"Unable to Create new applicaions",
            error,
        })
    }
 }




  export const updateApplicationController = async(req:Request,res:Response):Promise<void>=>{
    try {
        const {id} = req.params;
        const {status}=req.body;

        const application= await prisma.application.findUnique({
            where:{id:Number(id)},
            include:{
                property:true,
                tenant:true,
            }
        });

                    if (!application) {
            console.log("Unable to find the application");
            res.status(400).json({ message: "Unable to find the application" });
            return; 
            }

         if (status === "Approved") {
                const newLease = await prisma.lease.create({
                    data: {
                    startDate: new Date(),
                    endDate: new Date(
                        new Date().setFullYear(new Date().getFullYear() + 1)
                    ),
                    rent: application.property.pricePerMonth,
                    deposit: application.property.securityDeposit,
                    propertyId: application.propertyId,
                    tenantCognitoId: application.tenantCognitoId,
                    },
                });
                    await prisma.property.update({
                    where: { id: application.propertyId },
                    data: {
                    tenants: {
                        connect: { cognitoId: application.tenantCognitoId },
                    },
                    },
                    });
                await prisma.application.update({
                    where:{id:Number(id)},
                    data:{
                        status,leaseId:newLease.id
                    },
                    include:{
                        property:true,
                        tenant:true,
                        lease:true,
                    },
                });
        }
        else{
            await prisma.application.update({
                where:{id:Number(id)},
                data:{status},
            })
        }

            const updatedApplication= await prisma.application.findUnique({
                where:{id:Number(id)},
                 include:{
                        property:true,
                        tenant:true,
                        lease:true,
                    },
            });

            res.status(201).json(updatedApplication)

    } catch (error) {
        console.log(error);
        res.status(500).send({
            success:false,
            message:"Unable to Create new applicaions",
            error,
        })
    }
 }

