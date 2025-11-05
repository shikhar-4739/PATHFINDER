import { asyncHandler, ApiError } from "utils";
import jwt from "jsonwebtoken";
import {prismaClient} from "db";
import type { NextFunction, RequestHandler } from 'express';

interface TokenPayload {
    _id?: string;
    email?: string;
}

export const verifyJWT: RequestHandler = asyncHandler (async (req, res, next: NextFunction) => {     
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload

        if (!decodedToken || !decodedToken._id) {
            throw new ApiError(401, "Invalid Access Token")
        }

        const user = await prismaClient.user.findUnique({
            where: { id: decodedToken._id },
            select: { password: 0, refreshToken: 0 }
        })

        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()

    } catch (error) {
        throw new ApiError(401, (error as any)?.message || "Invalid access token")
    }
})