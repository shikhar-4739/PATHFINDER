import {asyncHandler, ApiResponse, ApiError} from 'utils';
import { prismaClient } from 'db';
import type { RequestHandler } from 'express';

const generateAccessAndRefreshTokens = async(userId: string) => {
    try {
        const user = await prismaClient.user.findUnique({ where: { id: userId } })
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})

        return {accessToken, refreshToken}

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const loginUser: RequestHandler = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if(!email || !password) {
        throw new ApiError(400, 'Email and password are required');
    }
    const user = await prismaClient.user.findUnique({ where: { email } });

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid user Credentials');
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user.id);

    const loggedInUser = await prismaClient.user.findUnique({ where: { id: user.id } }).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
        new ApiResponse(200, { user: loggedInUser, accessToken, refreshToken }, 'User logged In Successfully')
    )
});

export { loginUser };