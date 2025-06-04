import {Request,Response,NextFunction} from "express";
import jwt,{JwtPayload } from "jsonwebtoken";

interface DecodedToken extends JwtPayload
{
    sub:string
    "custom:role"?: string;
}

declare global{
    namespace Express{
        interface Request{
            user?:{
                id:string,
                role:string,
            }
        }
    }
}

export const authMiddleware=(allowedRoles :string[])=>{
    return (req:Request,res:Response,next:NextFunction): void =>{
        try {
            const token=req.headers.authorization?.split(" ")[1];
            if(!token)
            {
                res.status(401).send({
                    success:false,
                    message:"Unable to obtain user token,Unauthorized"
                })
                return;
            }
            const decoded=jwt.decode(token) as DecodedToken
            const userRole=decoded["custom:role"] || " ";
            req.user={
                id:decoded.sub,
                role:userRole
            }

            const hasAccess= allowedRoles.includes(userRole.toLowerCase())

            if(!hasAccess)
            {
                res.status(404).send({
                    success:false,
                    message:"the user has no acces to the particular endpoint",
                })
                return
            };

            console.log("access granted")
                   next();     


        } catch (error) {
                console.log(error)
            res.status(400).send({
                success:false,
                message:"Unablt to accs the token",
                error,
            })
            return
        }
    }
}






// import { Request, Response, NextFunction } from "express";
// import { CognitoJwtVerifier } from "aws-jwt-verify";



// declare global {
//   namespace Express {
//     interface Request {
//       user?: {
//         id: string;
//         role: string;
//       };
//     }
//   }
// }


// const verifier = CognitoJwtVerifier.create({
//   userPoolId: "ap-south-1_0Q9ycIYcB", // Replace with your pool ID
//   tokenUse: "id",
//   clientId: "ijj6oj2f4brobm6uilna4b1dl", // Replace with your app client ID
// });



// export const authMiddleware = (allowedRoles: string[]) => {
//   return async (req: Request, res: Response, next: NextFunction) => {
//     const token = req.headers.authorization?.split(" ")[1];
//     console.log('token',token)

//     if (!token) {
//       res.status(401).json({ message: "Unauthorized no token" });
//       return;
//     }

//     try {
//         const payload = await verifier.verify(token);

//       const userRole=payload["custom:role"] || " ";
//       console.log("userrole=",userRole)
//       req.user={
//             id:payload.sub,
//             role:userRole,
//             }


//       const hasAccess = allowedRoles.includes(userRole.toLowerCase());
      
//       if (!hasAccess) {
//         res.status(403).json({ message: "Access Denied" });
//         return;
//       }
//           next();

//     } catch (err) {
//       console.error("Failed to decode token:", err);
//       res.status(400).json({ message: "Invalid token" });
//       return;
//     }

//   };
// };