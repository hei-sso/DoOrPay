const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");

const db = admin.firestore();

exports.createVerification = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const uid = await getUidFromRequest(req);

      const {
        targetId,
        targetType = null,
        imageUrl = null,
        fileName = "image.jpg",
      } = req.body;

      if (!targetId) {
        return res.status(400).json({
          error: "targetId is required",
        });
      }

      let resolvedType = targetType;

      if (resolvedType && !["goal", "challenge"].includes(resolvedType)) {
        return res.status(400).json({
          error: "targetType must be goal or challenge",
        });
      }

      if (!resolvedType) {
        const goalDoc = await db.collection("goals").doc(targetId).get();

        if (goalDoc.exists && goalDoc.data().type === "goal") {
          resolvedType = "goal";
        } else {
          const challengeDoc = await db
            .collection("challenges")
            .doc(targetId)
            .get();

          if (challengeDoc.exists && challengeDoc.data().type === "challenge") {
            resolvedType = "challenge";
          }
        }
      }

      if (!resolvedType) {
        return res.status(404).json({
          error: "Target goal or challenge not found",
        });
      }

      if (resolvedType === "goal") {
        const goalDoc = await db.collection("goals").doc(targetId).get();

        if (!goalDoc.exists) {
          return res.status(404).json({ error: "Goal not found" });
        }

        const goalData = goalDoc.data();

        if (goalData.type !== "goal") {
          return res.status(400).json({
            error: "Invalid goal document type",
          });
        }

        if (goalData.userId !== uid) {
          return res.status(403).json({ error: "Forbidden" });
        }

        if (goalData.status !== "ongoing") {
          return res.status(400).json({
            error: "Goal is not verifiable",
          });
        }
      }

      if (resolvedType === "challenge") {
        const challengeRef = db.collection("challenges").doc(targetId);
        const challengeDoc = await challengeRef.get();

        if (!challengeDoc.exists) {
          return res.status(404).json({ error: "Challenge not found" });
        }

        const challengeData = challengeDoc.data();

        if (challengeData.type !== "challenge") {
          return res.status(400).json({
            error: "Invalid challenge document type",
          });
        }

        const memberIds = Array.isArray(challengeData.memberIds)
          ? challengeData.memberIds
          : [];

        const memberDoc = await challengeRef
          .collection("members")
          .doc(uid)
          .get();

        if (!memberIds.includes(uid) && !memberDoc.exists) {
          return res.status(403).json({
            error: "Only challenge members can create verifications",
          });
        }

        if (!["recruiting", "active"].includes(challengeData.status)) {
          return res.status(400).json({
            error: "Challenge is not verifiable",
          });
        }
      }

      const safeFileName = String(fileName || "image.jpg")
        .replace(/[^\w.\-]/g, "_")
        .slice(0, 100);

      const verificationRef = db.collection("verifications").doc();

      const storagePath = `verifications/${uid}/${verificationRef.id}/${safeFileName}`;

      await verificationRef.set({
        id: verificationRef.id,
        userId: uid,
        targetId,
        targetType: resolvedType,
        imageUrl: imageUrl || storagePath,
        storagePath,
        pHash: null,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return res.status(200).json({
        message: "Verification created successfully",
        verificationId: verificationRef.id,
        userId: uid,
        targetId,
        targetType: resolvedType,
        imageUrl: imageUrl || storagePath,
        storagePath,
        status: "pending",
      });
    } catch (error) {
      console.error("createVerification error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });