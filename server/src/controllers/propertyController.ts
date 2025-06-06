import { Prisma, PrismaClient,Location} from "@prisma/client";
import { wktToGeoJSON } from "@terraformer/wkt";
import { Request, Response } from "express";
import {S3Client} from "@aws-sdk/client-s3"
import {Upload} from "@aws-sdk/lib-storage";
import axios from "axios"


 const prisma = new PrismaClient()
const s3Client=new S3Client({
    region:process.env.AWS_REGION
})
//get Multiple properties
export const getPropertiesController = async(req:Request,res:Response):Promise<void>=>
{
    try {
        const
         {favoriteIds,
        priceMin,
        priceMax,
        beds,
        bath,
        propertyType,
        squareFeetMin,
        squareFeetMax,
        amenities,
        availableFrom,
        lattitude,
        longitude
        } = req.query;


        let whereConditions:Prisma.Sql[]=[];

        if(favoriteIds)
        {
        const favoriteIdsArray=  (favoriteIds as string).split(",").map(Number);
            whereConditions.push(Prisma.sql ` p.id IN ${Prisma.join(favoriteIdsArray)}`)
        }
        if(priceMin)
        {
            whereConditions.push(Prisma.sql`p."pricePerMonth">= ${Number(priceMin)}`)
        }
        if(priceMax)
        {
            whereConditions.push(Prisma.sql`p."pricePerMonth"<= ${Number(priceMax)}`)
        }
        if(beds && beds!= "any"){
        whereConditions.push(Prisma.sql`p."beds">= ${Number(beds)}`)
        }
        if(bath && bath!= "any"){
          whereConditions.push(Prisma.sql`p."beds">= ${Number(bath)}`)
        }  
        if(propertyType &&propertyType !="any "){
          whereConditions.push(Prisma.sql`p."propertyType"= ${propertyType} :: "PropertyType"`)
        } 
        if(squareFeetMin){
            whereConditions.push(Prisma.sql`p."squareFeet">= ${Number(squareFeetMin)}`)
        }
        if(squareFeetMin){
            whereConditions.push(Prisma.sql`p."squareFeet"<= ${Number(squareFeetMax)}`)
        }
        if(amenities && amenities !="any ")
        {
            const amenitiesArray=(amenities as string).split(",")
            whereConditions.push(Prisma.sql`p.amenities @>${amenitiesArray}`);
        }
        if(availableFrom && availableFrom!="any")
            {
                const availableFromDate= typeof availableFrom ==="string" ? availableFrom :null;
                if(availableFromDate)
                {
                    const date=new Date(availableFromDate);
                    if(!isNaN(date.getTime()))
                    {
                        whereConditions.push(
                            Prisma.sql`EXISTS (
                                SELECT 1 FROM "Lease" l WHERE l."propertyId"=p.id
                                AND l."startDate" <=${date.toISOString()}
                                )`
                        );
                    }
                }
            }

        if(lattitude && longitude)
        {
            const lat=parseFloat(lattitude as string);
            const long=parseFloat(longitude as string);
            const rediusInKilometer=1000
            const  degree=rediusInKilometer/111;

             whereConditions.push(Prisma.sql`ST_Dwithin(
                l.coordinates::geometry,
                ST_SetSRID(ST_MakePoint(${long}, ${lat}),4326),
                ${degree}
             ) `);
        }

        const completeQuerry= Prisma.sql`
        SELECT
        p.*,
        json_build_object(
            'id':l.id,
            'adress':l.adress,
            'city':l.city,
            'state':l.state,
            'country':l.country,
            'postalCode':l.postalCode,
            'coordinates':json_build_object(
            'longitude':ST_X(l."coordinates"::geometry),
            'latitude':ST_Y(l."coordinates"::geometry)
            )
        )AS location
        FROM "Properties" p JOIN "Location" l on p."locationId"=l.id
        ${
            whereConditions.length>0 
            ? Prisma.sql`WHERE${Prisma.join(whereConditions, "AND")}`
            : Prisma.empty
            }  `;
 const properties=await prisma.$queryRaw(completeQuerry);

 res.json(properties)


     } catch (error) {
        console.log(error)
        res.status(500).send({
            success:false,
            message:"Unable to get querried properties",
            error,
        })
    }
}


//get Single properties
export const getPropertyController = async(req:Request,res:Response):Promise<void>=>
{ try {
        const {id}=req.params
        const property = await prisma.property.findUnique({
            where:{id:Number(id)},
            include:{
                location:true,
            }
        })
        if(property)
        {
            const coordinates: {coordinates : string}[]=
            await prisma.$queryRaw `SELECT  ST_asText(coordinates) as coordinates from "Location" WHERE id=${property.location.id} `
            const geoJSON:any= wktToGeoJSON(coordinates[0]?.coordinates || "");
            const longitude=geoJSON.coordinates[0];
            const latitude=geoJSON.coordinates[1];
            const propertyWithCoordinates={
                ...property,
                location:{
                ...property.location,
                coordinates:{
                    longitude,
                    latitude,
                }
            }
              }
              res.json(propertyWithCoordinates);
        }    
    } catch (error) {
        console.log(error)
        console.log(error)
        res.status(500).send({
            success:false,
            message:"Unable to get querried properties",
            error,
        })
    }
}





//Create  properties
export const createPropertyController= async(req:Request,res:Response):Promise<void> =>{
     try {
        const files=req.files as Express.Multer.File[];
        const  {country,state,address,city,postalCode,managerCognitoId, ...propertyData}=req.body
        const photoUrls =await Promise.all(files.map(async(file)=>{
            const uploadParams={
                Bucket:process.env.S3_BUCKET_NAME!,
                Key:`properties/${Date.now} -${file.originalname}`,
                Body:file.buffer,
                ContentType:file.mimetype,
            };

            const uploadResult= await new Upload({
                client:s3Client,
                params:uploadParams,

            }).done();
            return uploadResult.Location;
        }))
        
        const geocodingURL= `https://nominatim.openstreetmap.org/search?${ new URLSearchParams (
            {
                street:address,
                city,
                country,
                postalcode:postalCode,
                state,
                format:"json",
                limit:"1",
            }).toString()}`

        const geocodingResponse=await axios.get(geocodingURL,{
            headers:{  "User-Agent":"RealEstateApp" , }});

        const [longitude,latitude]= geocodingResponse.data[0]?.lon && geocodingResponse.data[0]?.lat 
        ?[parseFloat(geocodingResponse.data[0]?.lon),
            parseFloat(geocodingResponse.data[0]?.lat)]
        : [ 0,0];

        //adding location onto the locations table
    const [location] = await prisma.$queryRaw<Location[]>`
      INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
      VALUES (${address}, ${city}, ${state}, ${country}, ${postalCode}, ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326))
      RETURNING id, address, city, state, country, "postalCode", ST_AsText(coordinates) as coordinates;
    `;

    // addding the item onto the property table
    const newPropert=await prisma.property.create(
        {
            data:{
                ...propertyData,
                photoUrls,
                locationId:location.id,
                managerCognitoId,
                amenities:typeof propertyData.amenities ==="string" ?propertyData.amenities.split(",") :[],
                highlights:typeof propertyData.highlights ==="string" ?propertyData.highlights.split(",") :[],
                isPetsAllowed: propertyData.isPetsAllowed ==="true",
                isParkingIncluded:propertyData.isParkingIncluded ==="true",
                securityDeposit: parseFloat(propertyData.securityDeposit),
                pricePerMonth: parseFloat(propertyData.pricePerMonth),
                applicationFee: parseFloat(propertyData.applicationFee),
                beds: parseInt(propertyData.beds),
                baths: parseFloat(propertyData.baths),
                squareFeet: parseInt(propertyData.squareFeet),

            },
            include:{
                location:true,
                manager:true
            }
        }
    );
            res.status(201).send(newPropert)
    } catch (error) {
        console.log(error)  
        console.log(error)
        res.status(500).send({
            success:false,
            message:"Unable to Create properties",
            error,
        })
    }
}

 //Update  properties
export const updatePropertyController= async(req:Request,res:Response):Promise<void> =>{
     try {
        
    } catch (error) {
        console.log(error)
    }
}