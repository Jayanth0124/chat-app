import webpush from 'web-push';
import PushSubscription from '../models/PushSubscription.js';
import dotenv from 'dotenv';

dotenv.config();

let publicKey = process.env.VAPID_PUBLIC_KEY;
let privateKey = process.env.VAPID_PRIVATE_KEY;

// Generate keys automatically if not defined in .env (for ease of local setup)
if (!publicKey || !privateKey) {
  console.log('[PUSH] No VAPID keys found in .env, generating a temporary pair...');
  const keys = webpush.generateVAPIDKeys();
  publicKey = keys.publicKey;
  privateKey = keys.privateKey;
  console.log(`[PUSH] Generated Public Key: ${publicKey}`);
  console.log(`[PUSH] Generated Private Key: ${privateKey}`);
  console.log('[PUSH] Store these in your .env file to make them persistent.');
}

webpush.setVapidDetails(
  'mailto:support@orbit.chat',
  publicKey,
  privateKey
);

export const getPublicKey = () => publicKey;

/**
 * Sends a background push notification to all devices registered to a specific user
 * @param {string} userId 
 * @param {object} payload - { title, body, icon, badge, data }
 */
export const sendPushNotification = async (userId, payload) => {
  try {
    const subscriptions = await PushSubscription.find({ userId });
    if (!subscriptions || subscriptions.length === 0) return;

    const payloadString = JSON.stringify({
      title: payload.title || 'Orbit',
      body: payload.body || '',
      icon: payload.icon || '/logo.png',
      badge: payload.badge || '/logo.png',
      data: payload.data || {}
    });

    const sendPromises = subscriptions.map(async (subDoc) => {
      try {
        await webpush.sendNotification({
          endpoint: subDoc.subscription.endpoint,
          keys: {
            p256dh: subDoc.subscription.keys.p256dh,
            auth: subDoc.subscription.keys.auth
          }
        }, payloadString);
      } catch (err) {
        // If the subscription is expired or invalid, delete it
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[PUSH] Cleaning up expired subscription for endpoint: ${subDoc.subscription.endpoint}`);
          await PushSubscription.deleteOne({ _id: subDoc._id });
        } else {
          console.error(`[PUSH ERROR] Failed to send push to endpoint: ${subDoc.subscription.endpoint}`, err);
        }
      }
    });

    await Promise.all(sendPromises);
  } catch (error) {
    console.error(`[PUSH ERROR] Failed to send notifications for user ${userId}:`, error);
  }
};
