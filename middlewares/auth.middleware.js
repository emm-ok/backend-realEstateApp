
import jwt from "jsonwebtoken"
import { env } from "../config/env.js";
import User from "../modules/user/user.model.js";


export const protect = async (req, res, next) => {
    try{
        const token = req.cookies?.accessToken;

        if(!token){
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            })
        }

        const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);

        const user = await User.findById(decoded.id);

        if(!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: "Account inactive",
            });
        }

        if(
            user.passwordChangedAt && 
            decoded.iat * 1000 < user.passwordChangedAt.getTime()
        ){
            return res.status(401).json({
                success: false,
                message: "Password changed. Please login again."
            });
        }

        req.user = user;
        next();
    } catch(error){
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        })
    }
} 