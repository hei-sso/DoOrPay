const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

// 초기화 안전장치
if (!admin.apps.length) {
  admin.initializeApp();
}

const { getFirestore, Timestamp } = require("firebase-admin/firestore");
const db = getFirestore();

exports.onUserCreated = functions
  .region("asia-northeast3")
  .auth.user()
  .onCreate(async (user) => {
    const { uid, email, providerData } = user;

    const userRef = db.collection("users").doc(uid);
    const now = Timestamp.now();

    await db.runTransaction(async (tx) => {
      const userDoc = await tx.get(userRef);

      if (!userDoc.exists) {
        tx.set(userRef, {
          uid,
          email: email || "",
          nickname: "",
          phone: "",
          birth: "",
          authProvider: (providerData && providerData.length > 0 && providerData[0].providerId) || "unknown",
          wallet: {
            balance: 0,
            locked: 0,
          },
          createdAt: now,
          updatedAt: now,
        });
      }
    });


    console.log("User initialized:", uid);
  });