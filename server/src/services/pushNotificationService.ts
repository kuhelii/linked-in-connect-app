// import webpush from "web-push";
// import NotificationSubscription from "../models/NotificationSubscription";

// class PushNotificationService {
//   constructor() {
//     // Configure web-push with VAPID keys
//     webpush.setVapidDetails(
//       "mailto:your-email@example.com",
//       process.env.VAPID_PUBLIC_KEY!,
//       process.env.VAPID_PRIVATE_KEY!
//     );
//   }

//   async subscribeUser(userId: string, subscription: any) {
//     try {
//       // Save or update subscription
//       await NotificationSubscription.findOneAndUpdate(
//         { userId, endpoint: subscription.endpoint },
//         {
//           userId,
//           endpoint: subscription.endpoint,
//           keys: subscription.keys,
//         },
//         { upsert: true, new: true }
//       );

//       console.log(`User ${userId} subscribed to push notifications`);
//     } catch (error) {
//       console.error(
//         "Error subscribing user to push notifications:",
//         error
//       );
//       throw error;
//     }
//   }

//   async unsubscribeUser(userId: string, endpoint: string) {
//     try {
//       await NotificationSubscription.deleteOne({ userId, endpoint });
//       console.log(`User ${userId} unsubscribed from push notifications`);
//     } catch (error) {
//       console.error("Error unsubscribing user:", error);
//       throw error;
//     }
//   }

//   async sendNotificationToUser(
//     userId: string,
//     payload: {
//       title: string;
//       body: string;
//       icon?: string;
//       badge?: string;
//       data?: any;
//       actions?: Array<{ action: string; title: string; icon?: string }>;
//     }
//   ) {
//     try {
//       const subscriptions = await NotificationSubscription.find({ userId });

//       if (subscriptions.length === 0) {
//         console.log(`No push subscriptions found for user ${userId}`);
//         return;
//       }

//       const notificationPayload = JSON.stringify({
//         title: payload.title,
//         body: payload.body,
//         icon: payload.icon || "/icon-192x192.png",
//         badge: payload.badge || "/badge-72x72.png",
//         data: payload.data || {},
//         actions: payload.actions || [],
//         timestamp: Date.now(),
//       });

//       const promises = subscriptions.map(async (subscription) => {
//         try {
//           await webpush.sendNotification(
//             {
//               endpoint: subscription.endpoint,
//               keys: {
//                 p256dh: subscription.keys.p256dh,
//                 auth: subscription.keys.auth,
//               },
//             },
//             notificationPayload
//           );
//         } catch (error: any) {
//           console.error(
//             `Error sending notification to ${subscription.endpoint}:`,
//             error
//           );

//           // Remove invalid subscriptions
//           if (error.statusCode === 410 || error.statusCode === 404) {
//             await NotificationSubscription.deleteOne({ _id: subscription._id });
//             console.log(
//               `Removed invalid subscription: ${subscription.endpoint}`
//             );
//           }
//         }
//       });

//       await Promise.all(promises);
//       console.log(
//         `Sent notifications to ${subscriptions.length} devices for user ${userId}`
//       );
//     } catch (error) {
//       console.error("Error sending push notification:", error);
//       throw error;
//     }
//   }

//   async sendMessageNotification(
//     recipientId: string,
//     senderName: string,
//     message: string,
//     chatId: string
//   ) {
//     await this.sendNotificationToUser(recipientId, {
//       title: `New message from ${senderName}`,
//       body: message.length > 50 ? `${message.substring(0, 50)}...` : message,
//       icon: "/chat-icon.png",
//       data: {
//         type: "message",
//         chatId,
//         url: `/chat/${chatId}`,
//       },
//       actions: [
//         { action: "reply", title: "Reply" },
//         { action: "view", title: "View Chat" },
//       ],
//     });
//   }

//   async sendFriendRequestNotification(recipientId: string, senderName: string) {
//     await this.sendNotificationToUser(recipientId, {
//       title: "New Friend Request",
//       body: `${senderName} sent you a friend request`,
//       icon: "/friend-icon.png",
//       data: {
//         type: "friend_request",
//         url: "/friends",
//       },
//       actions: [{ action: "view", title: "View Requests" }],
//     });
//   }
// }

// export const pushNotificationService = new PushNotificationService();
