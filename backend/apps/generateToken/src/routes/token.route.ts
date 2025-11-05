import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { generateTokens, refreshToken } from '../controller/token.controller.js';

const router = Router();

router.route("/generate-tokens").post(generateTokens);
router.route("/refresh-token").post(verifyJWT, refreshToken);

export default router;