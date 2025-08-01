/**
 * Authentication Routes
 * Handles OAuth authentication, token management, and user session endpoints
 */

import { Router } from 'express';
import { body, query } from 'express-validator';
import { AuthController } from '../../../controllers/auth.controller';
import { authenticate, optionalAuthenticate, rateLimitAuth } from '../../../middleware/auth.middleware';
import { authRateLimit, generateCSRFToken, validateOrigin } from '../../../middleware/security.middleware';
import { validationMiddleware } from '../../../middleware/validation.middleware';

const router = Router();
const authController = new AuthController();

// Apply rate limiting to all auth routes
router.use(authRateLimit);

// Apply origin validation in production
if (process.env.NODE_ENV === 'production') {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  router.use(validateOrigin(allowedOrigins));
}

/**
 * @swagger
 * /api/v1/auth/urls:
 *   get:
 *     tags: [Authentication]
 *     summary: Get OAuth authentication URLs
 *     description: Returns OAuth URLs for Google and Microsoft authentication
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Optional state parameter for OAuth flow
 *     responses:
 *       200:
 *         description: OAuth URLs generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     google:
 *                       type: string
 *                       example: "https://accounts.google.com/o/oauth2/v2/auth?..."
 *                     microsoft:
 *                       type: string
 *                       example: "https://login.microsoftonline.com/..."
 */
router.get('/urls',
  [
    query('state').optional().isString().isLength({ max: 500 }),
  ],
  validationMiddleware,
  authController.getAuthUrls
);

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     tags: [Authentication]
 *     summary: Initiate Google OAuth authentication
 *     description: Redirects to Google OAuth consent screen
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Optional state parameter
 *     responses:
 *       302:
 *         description: Redirect to Google OAuth
 */
router.get('/google',
  [
    query('state').optional().isString().isLength({ max: 500 }),
  ],
  validationMiddleware,
  authController.googleAuth
);

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     tags: [Authentication]
 *     summary: Google OAuth callback handler
 *     description: Handles Google OAuth callback and creates user session
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Google
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter
 *     responses:
 *       302:
 *         description: Redirect to frontend with authentication result
 */
router.get('/google/callback', authController.googleCallback);

/**
 * @swagger
 * /api/v1/auth/microsoft:
 *   get:
 *     tags: [Authentication]
 *     summary: Initiate Microsoft OAuth authentication
 *     description: Redirects to Microsoft OAuth consent screen
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Optional state parameter
 *     responses:
 *       302:
 *         description: Redirect to Microsoft OAuth
 */
router.get('/microsoft',
  [
    query('state').optional().isString().isLength({ max: 500 }),
  ],
  validationMiddleware,
  authController.microsoftAuth
);

/**
 * @swagger
 * /api/v1/auth/microsoft/callback:
 *   get:
 *     tags: [Authentication]
 *     summary: Microsoft OAuth callback handler
 *     description: Handles Microsoft OAuth callback and creates user session
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code from Microsoft
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: State parameter
 *     responses:
 *       302:
 *         description: Redirect to frontend with authentication result
 */
router.get('/microsoft/callback', authController.microsoftCallback);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh access token
 *     description: Refresh expired access token using refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token (optional if provided in cookie)
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     expiresIn:
 *                       type: number
 *                       example: 900
 *                     tokenType:
 *                       type: string
 *                       example: "Bearer"
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh',
  [
    body('refreshToken').optional().isString().isLength({ min: 10 }),
  ],
  validationMiddleware,
  rateLimitAuth(10, 5 * 60 * 1000), // 10 attempts per 5 minutes
  authController.refreshToken
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     tags: [Authentication]
 *     summary: Get current user information
 *     description: Returns authenticated user's profile and permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     permissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     activeSessions:
 *                       type: number
 *       401:
 *         description: Not authenticated
 */
router.get('/me',
  authenticate,
  authController.getMe
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout from current device
 *     description: Invalidates current session and clears cookies
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token (optional if provided in cookie)
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout',
  optionalAuthenticate,
  authController.logout
);

/**
 * @swagger
 * /api/v1/auth/logout-all:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout from all devices
 *     description: Invalidates all user sessions across all devices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
 *       401:
 *         description: Not authenticated
 */
router.post('/logout-all',
  authenticate,
  authController.logoutAll
);

/**
 * @swagger
 * /api/v1/auth/sessions:
 *   get:
 *     tags: [Authentication]
 *     summary: Get active sessions
 *     description: Returns list of user's active sessions across all devices
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active sessions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     sessions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           deviceInfo:
 *                             type: string
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     total:
 *                       type: number
 *       401:
 *         description: Not authenticated
 */
router.get('/sessions',
  authenticate,
  authController.getActiveSessions
);

/**
 * @swagger
 * /api/v1/auth/validate:
 *   post:
 *     tags: [Authentication]
 *     summary: Validate access token
 *     description: Validates JWT access token and returns user information
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT access token to validate
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                       example: true
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: number
 *                         email:
 *                           type: string
 *                         name:
 *                           type: string
 *                         role:
 *                           type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Invalid or expired token
 */
router.post('/validate',
  [
    body('token').optional().isString().isLength({ min: 10 }),
  ],
  validationMiddleware,
  rateLimitAuth(20, 5 * 60 * 1000), // 20 attempts per 5 minutes
  authController.validateToken
);

/**
 * @swagger
 * /api/v1/auth/csrf-token:
 *   get:
 *     tags: [Authentication]
 *     summary: Get CSRF token
 *     description: Returns CSRF token for form submissions
 *     responses:
 *       200:
 *         description: CSRF token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     csrfToken:
 *                       type: string
 */
router.get('/csrf-token',
  generateCSRFToken,
  (req, res) => {
    res.json({
      success: true,
      data: {
        csrfToken: res.locals.csrfToken || null,
      },
      message: 'CSRF token generated successfully',
    });
  }
);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           example: 1
 *         email:
 *           type: string
 *           example: "user@example.com"
 *         name:
 *           type: string
 *           example: "John Doe"
 *         firstName:
 *           type: string
 *           example: "John"
 *         lastName:
 *           type: string
 *           example: "Doe"
 *         avatar:
 *           type: string
 *           nullable: true
 *           example: "https://example.com/avatar.jpg"
 *         role:
 *           type: string
 *           enum: [admin, manager, user]
 *           example: "user"
 *         emailVerified:
 *           type: boolean
 *           example: true
 *         domain:
 *           type: string
 *           nullable: true
 *           example: "company.com"
 *         oauthProvider:
 *           type: string
 *           enum: [google, microsoft]
 *           nullable: true
 *           example: "google"
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

export default router;