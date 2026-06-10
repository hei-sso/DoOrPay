const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { getUidFromRequest } = require("../utils/auth");

const db = admin.firestore();

exports.inviteChallengeMember = functions
  .region("asia-northeast3")
  .https.onRequest(async (req, res) => {
    try {
      const uid = await getUidFromRequest(req);
      const { challengeId, toUid } = req.body;

      if (!challengeId || !toUid) {
        return res.status(400).json({
          error: "challengeId and toUid are required",
        });
      }

      if (uid === toUid) {
        return res.status(400).json({
          error: "You cannot invite yourself",
        });
      }

      const challengeRef = db.collection("challenges").doc(challengeId);
      const targetUserRef = db.collection("users").doc(toUid);
      const memberRef = challengeRef.collection("members").doc(toUid);

      const [challengeDoc, targetUserDoc, memberDoc] = await Promise.all([
        challengeRef.get(),
        targetUserRef.get(),
        memberRef.get(),
      ]);

      if (!challengeDoc.exists) {
        return res.status(404).json({ error: "Challenge not found" });
      }

      if (!targetUserDoc.exists) {
        return res.status(404).json({ error: "Target user not found" });
      }

      if (memberDoc.exists) {
        return res.status(409).json({
          error: "User is already participating in this challenge",
        });
      }

      const challengeData = challengeDoc.data();

      if (challengeData.type !== "group") {
        return res.status(400).json({
          error: "Invalid group document type",
        });
      }

      if (challengeData.creatorId !== uid) {
        return res.status(403).json({
          error: "Only the challenge owner can invite members",
        });
      }

      if (challengeData.status !== "recruiting") {
        return res.status(400).json({
          error: "Invitations are only allowed while recruiting",
        });
      }

      const existingInviteSnapshot = await db
        .collection("invitations")
        .where("challengeId", "==", challengeId)
        .where("toUid", "==", toUid)
        .where("status", "==", "pending")
        .limit(1)
        .get();

      if (!existingInviteSnapshot.empty) {
        return res.status(409).json({
          error: "A pending invitation already exists for this user",
        });
      }

      const inviterUserDoc = await db.collection("users").doc(uid).get();
      const inviterData = inviterUserDoc.exists ? inviterUserDoc.data() : {};
      const fromNickname =
        inviterData.nickname && inviterData.nickname.trim()
          ? inviterData.nickname
          : "사용자";

      const invitationRef = db.collection("invitations").doc();

      await invitationRef.set({
        invitationId: invitationRef.id,
        challengeId,
        challengeTitle: challengeData.title || "",
        fromUid: uid,
        fromNickname,
        toUid,
        status: "pending",
        type: "group",
        createdAt: new Date(),
      });

      return res.status(200).json({
        message: "Invitation sent successfully",
        invitationId: invitationRef.id,
        challengeId,
        toUid,
        type: "group",
      });
    } catch (error) {
      console.error("inviteChallengeMember error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });