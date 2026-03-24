import { Router } from 'express';
import { WalletsController } from '../controllers/wallets.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { asyncHandler } from '../utils/asyncHandler.utils';
import {
  payoutRequestSchema,
  trustlineRequestSchema,
  transactionQuerySchema,
  earningsQuerySchema,
  balanceQuerySchema,
} from '../validators/schemas/wallet.schemas';

const router = Router();

// All wallet routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /wallets/me:
 *   get:
 *     summary: Get authenticated user's wallet information
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: 123e4567-e89b-12d3-a456-426614174000
 *                         stellarPublicKey:
 *                           type: string
 *                           example: GCLWGQPMKXQSPF776IU33AH4PZNOOWNAWGGKVTBQMIC5IMKUNP3E6NVU
 *                         status:
 *                           type: string
 *                           enum: [active, inactive, suspended]
 *                           example: active
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         lastActivity:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', asyncHandler(WalletsController.getWalletInfo));

/**
 * @swagger
 * /wallets/me/balance:
 *   get:
 *     summary: Get real-time Stellar balance for authenticated user
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assetCode
 *         schema:
 *           type: string
 *           example: USD
 *         description: Filter by specific asset code (optional)
 *       - in: query
 *         name: assetIssuer
 *         schema:
 *           type: string
 *           example: GCKFBEIYTKP5RDBKPKDVQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQG
 *         description: Asset issuer public key (required for non-native assets)
 *     responses:
 *       200:
 *         description: Balance information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         balances:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               assetType:
 *                                 type: string
 *                                 example: native
 *                               assetCode:
 *                                 type: string
 *                                 example: XLM
 *                               assetIssuer:
 *                                 type: string
 *                                 example: GCKFBEIYTKP5RDBKPKDVQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQG
 *                               balance:
 *                                 type: string
 *                                 example: "1000.0000000"
 *                               limit:
 *                                 type: string
 *                                 example: "922337203685.4775807"
 *                         accountExists:
 *                           type: boolean
 *                           example: true
 *                         lastUpdated:
 *                           type: string
 *                           format: date-time
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       502:
 *         description: Stellar network error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/me/balance',
  validate(balanceQuerySchema),
  asyncHandler(WalletsController.getBalance)
);

/**
 * @swagger
 * /wallets/me/transactions:
 *   get:
 *     summary: Get on-chain transaction history for authenticated user
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Pagination cursor from previous response
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of transactions to return
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order for transactions
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         transactions:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "12884905984"
 *                               hash:
 *                                 type: string
 *                                 example: "2db4b22ca018119c5027a80578813ffcf582cda4aa9e31cd92b43cf1bda4fc5a"
 *                               ledger:
 *                                 type: integer
 *                                 example: 3000000
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                               sourceAccount:
 *                                 type: string
 *                                 example: GCLWGQPMKXQSPF776IU33AH4PZNOOWNAWGGKVTBQMIC5IMKUNP3E6NVU
 *                               operationCount:
 *                                 type: integer
 *                                 example: 1
 *                               successful:
 *                                 type: boolean
 *                                 example: true
 *                               memo:
 *                                 type: string
 *                                 example: "Payment memo"
 *                               memoType:
 *                                 type: string
 *                                 example: "text"
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             cursor:
 *                               type: string
 *                               example: "12884905984"
 *                             hasMore:
 *                               type: boolean
 *                               example: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       502:
 *         description: Stellar network error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/me/transactions',
  validate(transactionQuerySchema),
  asyncHandler(WalletsController.getTransactions)
);

/**
 * @swagger
 * /wallets/payout:
 *   post:
 *     summary: Request payout to external Stellar address
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - destinationAddress
 *             properties:
 *               amount:
 *                 type: string
 *                 pattern: '^\\d+(\\.\\d{1,7})?$'
 *                 example: "100.50"
 *                 description: Amount to payout (up to 7 decimal places)
 *               assetCode:
 *                 type: string
 *                 default: XLM
 *                 example: USD
 *                 description: Asset code (defaults to XLM)
 *               assetIssuer:
 *                 type: string
 *                 example: GCKFBEIYTKP5RDBKPKDVQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQG
 *                 description: Asset issuer (required for non-native assets)
 *               destinationAddress:
 *                 type: string
 *                 example: GCLWGQPMKXQSPF776IU33AH4PZNOOWNAWGGKVTBQMIC5IMKUNP3E6NVU
 *                 description: Destination Stellar public key
 *               memo:
 *                 type: string
 *                 maxLength: 28
 *                 example: "Payout for services"
 *                 description: Optional memo (max 28 characters)
 *           example:
 *             amount: "100.50"
 *             assetCode: "USD"
 *             assetIssuer: "GCKFBEIYTKP5RDBKPKDVQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQG"
 *             destinationAddress: "GCLWGQPMKXQSPF776IU33AH4PZNOOWNAWGGKVTBQMIC5IMKUNP3E6NVU"
 *             memo: "Monthly payout"
 *     responses:
 *       201:
 *         description: Payout request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         amount:
 *                           type: string
 *                           example: "100.50"
 *                         assetCode:
 *                           type: string
 *                           example: "USD"
 *                         assetIssuer:
 *                           type: string
 *                           example: "GCKFBEIYTKP5RDBKPKDVQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQG"
 *                         destinationAddress:
 *                           type: string
 *                           example: "GCLWGQPMKXQSPF776IU33AH4PZNOOWNAWGGKVTBQMIC5IMKUNP3E6NVU"
 *                         status:
 *                           type: string
 *                           enum: [pending, approved, rejected, completed, failed]
 *                           example: pending
 *                         requestedAt:
 *                           type: string
 *                           format: date-time
 *                         memo:
 *                           type: string
 *                           example: "Monthly payout"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Insufficient balance or conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/payout',
  validate(payoutRequestSchema),
  asyncHandler(WalletsController.requestPayout)
);

/**
 * @swagger
 * /wallets/trustline:
 *   post:
 *     summary: Add asset trustline to user's Stellar account
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetCode
 *               - assetIssuer
 *             properties:
 *               assetCode:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 12
 *                 pattern: '^[A-Z0-9]+$'
 *                 example: USD
 *                 description: Asset code (1-12 uppercase alphanumeric characters)
 *               assetIssuer:
 *                 type: string
 *                 example: GCKFBEIYTKP5RDBKPKDVQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQG
 *                 description: Asset issuer Stellar public key
 *               limit:
 *                 type: string
 *                 pattern: '^\\d+(\\.\\d{1,7})?$'
 *                 example: "1000000.0000000"
 *                 description: Trust limit (optional, defaults to maximum)
 *           example:
 *             assetCode: "USD"
 *             assetIssuer: "GCKFBEIYTKP5RDBKPKDVQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQG"
 *             limit: "1000000.0000000"
 *     responses:
 *       200:
 *         description: Trustline operation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: "Trustline operation created successfully"
 *                         operation:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               example: "change_trust"
 *                             assetCode:
 *                               type: string
 *                               example: "USD"
 *                             assetIssuer:
 *                               type: string
 *                               example: "GCKFBEIYTKP5RDBKPKDVQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQG"
 *                             limit:
 *                               type: string
 *                               example: "max"
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Trustline already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/trustline',
  validate(trustlineRequestSchema),
  asyncHandler(WalletsController.addTrustline)
);

/**
 * @swagger
 * /wallets/me/earnings:
 *   get:
 *     summary: Get platform earnings summary for authenticated user
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for earnings period (ISO datetime)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for earnings period (ISO datetime)
 *       - in: query
 *         name: assetCode
 *         schema:
 *           type: string
 *           default: USD
 *         description: Asset code filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Earnings summary retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalEarnings:
 *                           type: string
 *                           example: "1250.75"
 *                         currentPeriodEarnings:
 *                           type: string
 *                           example: "350.25"
 *                         recentTransactions:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 example: "123e4567-e89b-12d3-a456-426614174000"
 *                               amount:
 *                                 type: string
 *                                 example: "50.00"
 *                               assetCode:
 *                                 type: string
 *                                 example: "USD"
 *                               date:
 *                                 type: string
 *                                 format: date-time
 *                               type:
 *                                 type: string
 *                                 enum: [session_payment, bonus, referral]
 *                                 example: session_payment
 *                         periodSummary:
 *                           type: object
 *                           properties:
 *                             startDate:
 *                               type: string
 *                               format: date-time
 *                             endDate:
 *                               type: string
 *                               format: date-time
 *                             sessionCount:
 *                               type: integer
 *                               example: 15
 *                             averageEarning:
 *                               type: string
 *                               example: "23.35"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get(
  '/me/earnings',
  validate(earningsQuerySchema),
  asyncHandler(WalletsController.getEarnings)
);

/**
 * @swagger
 * /wallets/me/payouts:
 *   get:
 *     summary: Get user's payout request history
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Payout requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         payoutRequests:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                                 format: uuid
 *                               amount:
 *                                 type: string
 *                                 example: "100.50"
 *                               assetCode:
 *                                 type: string
 *                                 example: "USD"
 *                               assetIssuer:
 *                                 type: string
 *                                 example: "GCKFBEIYTKP5RDBKPKDVQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQGQG"
 *                               destinationAddress:
 *                                 type: string
 *                                 example: "GCLWGQPMKXQSPF776IU33AH4PZNOOWNAWGGKVTBQMIC5IMKUNP3E6NVU"
 *                               status:
 *                                 type: string
 *                                 enum: [pending, approved, rejected, completed, failed]
 *                               memo:
 *                                 type: string
 *                                 example: "Monthly payout"
 *                               requestedAt:
 *                                 type: string
 *                                 format: date-time
 *                               processedAt:
 *                                 type: string
 *                                 format: date-time
 *                               transactionHash:
 *                                 type: string
 *                                 example: "2db4b22ca018119c5027a80578813ffcf582cda4aa9e31cd92b43cf1bda4fc5a"
 *                               notes:
 *                                 type: string
 *                                 example: "Processed successfully"
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             page:
 *                               type: integer
 *                               example: 1
 *                             limit:
 *                               type: integer
 *                               example: 10
 *                             hasMore:
 *                               type: boolean
 *                               example: true
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me/payouts', asyncHandler(WalletsController.getPayoutRequests));

export default router;