import  express from "express"
import dotenv from "dotenv"
import morgan from "morgan"
import cors from "cors"
import helmet from "helmet"
import bodyParser from "body-parser"
import { authMiddleware } from "./middleware/authMiddleware"
import tenantRoutes from "./routes/tenantRoutes"
import managerRoutes from "./routes/managerRoutes"

// Route imports


// configuration
dotenv.config()
const app= express()
app.use(express.json())
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({policy:"cross-origin"}));
app.use(morgan("common"))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:false}))
app.use(cors());



//ROUTES

app.get('/',(req,res)=>{
    res.send("This is home page");
})


app.use("/tenants",authMiddleware(["tenant"]),tenantRoutes)
app.use("/managers",authMiddleware(["manager"]),managerRoutes)

const PORT=process.env.PORT ||3002

app.listen(PORT,()=>{
    console.log(`server listening on port ${PORT}`);
});



