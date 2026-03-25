const functions = require("firebase-functions");
const admin = require("firebase-admin");

const db = admin.firestore();

exports.onUserCreated = functions
  .region("asia-northeast3")
  .auth.user()
  .onCreate(async (user) => {
    const { uid, email, providerData } = user;

    const userRef = db.collection("users").doc(uid);
    const walletRef = db.collection("wallets").doc(uid);

    await db.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);

      if (!userDoc.exists) {
        tx.set(userRef, {
          uid,
          email: email || "",
          username: "",
          phone: "",
          birth: "",
          authProvider: providerData?.[0]?.providerId || "unknown",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      tx.set(walletRef, {
        uid,
        totalBalance: 0,
        lockedBalance: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    console.log("User initialized:", uid);
  });