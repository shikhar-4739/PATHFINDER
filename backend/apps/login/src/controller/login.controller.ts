import { asyncHandler, ApiResponse, ApiError } from "utils";
import { prismaClient } from "db";
import type { RequestHandler } from "express";
import axios from "axios";

const GENERATE_TOKEN_SERVICE_URL = process.env.GENERATE_TOKEN_SERVICE_URL || 'http://localhost:3002';

const loginUser: RequestHandler = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }
  const user = await prismaClient.user.findUnique({ where: { email } });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user Credentials");
  }

  try {
    const tokenResponse = await axios.post(
      `${GENERATE_TOKEN_SERVICE_URL}/api/v1/generate-tokens`,
      {
        userId: user.id,
        email: user.email,
      }
    );

    const { accessToken, refreshToken } = tokenResponse.data.data;

    await prismaClient.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const loggedInUser = await prismaClient.user
      .findUnique({ where: { id: user.id } })
      .select("-password -refreshToken");

    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { user: loggedInUser, accessToken, refreshToken },
          "User logged In Successfully"
        )
      );
  } catch (error) {
    console.error("Error calling token generation service:", error);
    throw new ApiError(500, "Failed to generate tokens");
  }
});

export { loginUser };
