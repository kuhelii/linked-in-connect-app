// import express, { Response, Request } from "express";
// import { body, validationResult } from "express-validator";
// import { pushNotificationService } from "../services/pushNotificationService";
// import { authenticateJWT } from "../middleware/auth";

// const router = express.Router();

// // Subscribe to push notifications
// router.post(
//   "/subscribe",
//   authenticateJWT,
//   [
//     body("endpoint").isURL().withMessage("Valid endpoint URL is required"),
//     body("keys.p256dh").notEmpty().withMessage("p256dh key is required"),
//     body("keys.auth").notEmpty().withMessage("auth key is required"),
//   ],
//   async (req: Request, res: Response) => {
//     try {
//       const errors = validationResult(req);
//       if (!errors.isEmpty()) {
//         return res.status(400).json({ errors: errors.array() });
//       }

//       const userId = (req.user as any).userId;
//       const { endpoint, keys } = req.body;

//       await pushNotificationService.subscribeUser(userId, { endpoint, keys });

//       res.json({ message: "Successfully subscribed to push notifications" });
//     } catch (error) {
//       console.error("Error subscribing to push notifications:", error);
//       res
//         .status(500)
//         .json({ error: "Failed to subscribe to push notifications" });
//     }
//   }
// );

// // Unsubscribe from push notifications
// router.post(
//   "/unsubscribe",
//   authenticateJWT,
//   async (req: Request, res: Response) => {
//     try {
//       const userId = (req.user as any).userId;
//       const { endpoint } = req.body;

//       await pushNotificationService.unsubscribeUser(userId, endpoint);

//       res.json({
//         message: "Successfully unsubscribed from push notifications",
//       });
//     } catch (error) {
//       console.error("Error unsubscribing from push notifications:", error);
//       res
//         .status(500)
//         .json({ error: "Failed to unsubscribe from push notifications" });
//     }
//   }
// );

// // Get VAPID public key
// router.get("/vapid-public-key", (req: Request, res: Response) => {
//   res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
// });

// // Test notification (development only)
// router.post("/test", authenticateJWT, async (req: Request, res: Response) => {
//   try {
//     if (process.env.NODE_ENV === "production") {
//       return res
//         .status(403)
//         .json({ error: "Test notifications not available in production" });
//     }

//     const userId = (req.user as any).userId;
//     await pushNotificationService.sendNotificationToUser(userId, {
//       title: "Test Notification",
//       body: "This is a test push notification",
//       data: { type: "test" },
//     });

//     res.json({ message: "Test notification sent" });
//   } catch (error) {
//     console.error("Error sending test notification:", error);
//     res.status(500).json({ error: "Failed to send test notification" });
//   }
// });

// export default router;
