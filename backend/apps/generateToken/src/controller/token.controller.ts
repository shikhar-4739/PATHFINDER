import type { RequestHandler } from 'express';
import { asyncHandler, ApiError, ApiResponse } from 'utils';
import * as jwt from 'jsonwebtoken';
import { prismaClient } from 'db';

const ACCESS_EXPIRES = (process.env.ACCESS_TOKEN_EXPIRY ?? '15m') as NonNullable<jwt.SignOptions['expiresIn']>;
const REFRESH_EXPIRES = (process.env.REFRESH_TOKEN_EXPIRY ?? '7d') as NonNullable<jwt.SignOptions['expiresIn']>;

interface TokenPayload {
    _id?: string;
    email?: string;
}

const generateTokens: RequestHandler = asyncHandler(async (req, res) => {
    const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
    
    if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
        throw new ApiError(500, 'Missing ACCESS_TOKEN_SECRET or REFRESH_TOKEN_SECRET environment variables');
    }
	const { userId, email } = req.body;
	if (!userId || typeof userId !== 'string') {
		throw new ApiError(400, 'Invalid or missing "userId" in request body');
	}

    const accessToken = jwt.sign(
        {
            _id: userId,
            email: email
        },
        ACCESS_TOKEN_SECRET as jwt.Secret,
        { expiresIn: ACCESS_EXPIRES }
    );

    const refreshToken = jwt.sign(
        {
            _id: userId,
            email: email
        },
        REFRESH_TOKEN_SECRET as jwt.Secret,
        { expiresIn: REFRESH_EXPIRES }
    );


	// respond
	return res.status(201).json({
		ok: true,
		data: {
			accessToken,
			refreshToken,
		}
	});
});

const refreshToken: RequestHandler = asyncHandler(async (req, res) => {

    const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
    const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET;
    
    if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
        throw new ApiError(500, 'Missing ACCESS_TOKEN_SECRET or REFRESH_TOKEN_SECRET environment variables');
    }
    const token = req.cookies?.refreshToken || req.header("Authorization")?.replace("Bearer ","")

    if (!token) {
        throw new ApiError(401, "Refresh Token is required");
    }

    const decodedToken = jwt.verify(token, REFRESH_TOKEN_SECRET) as TokenPayload;

    if (!decodedToken || !decodedToken._id) {
        throw new ApiError(401, "Invalid Refresh Token");
    }

    const user = await prismaClient.user.findUnique({ where: { id: decodedToken._id } });

    if (!user) {
        throw new ApiError(401, "Invalid Refresh Token");
    }


    const accessToken = jwt.sign(
        {
            _id: decodedToken._id,
            email: decodedToken.email
        },
        ACCESS_TOKEN_SECRET as jwt.Secret,
        { expiresIn: ACCESS_EXPIRES }
    );

    const newRefreshToken = jwt.sign(
        {
            _id: decodedToken._id,
            email: decodedToken.email
        },
        REFRESH_TOKEN_SECRET as jwt.Secret,
        { expiresIn: REFRESH_EXPIRES }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', newRefreshToken, options)
        .json(
            new ApiResponse(200, { accessToken, refreshToken: newRefreshToken }, 'Tokens refreshed Successfully')
        );
});

export { generateTokens, refreshToken };