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
      const leaderMemberRef = challengeRef.collection("members").doc(uid);
      const targetMemberRef = challengeRef.collection("members").doc(toUid);

      const [challengeDoc, targetUserDoc, leaderMemberDoc, targetMemberDoc] = await Promise.all([
        challengeRef.get(),
        targetUserRef.get(),
        leaderMemberRef.get(),
        targetMemberRef.get(),
      ]);

      if (!challengeDoc.exists) {
        return res.status(404).json({ error: "Challenge not found" });
      }

      if (!targetUserDoc.exists) {
        return res.status(404).json({ error: "Target user not found" });
      }

      const challengeData = challengeDoc.data();
      const leaderMemberData = leaderMemberDoc.exists ? leaderMemberDoc.data() : null;
      const targetMemberData = targetMemberDoc.exists ? targetMemberDoc.data() : null;

      if (challengeData.creatorId !== uid || !leaderMemberData || leaderMemberData.role !== "leader") {
        return res.status(403).json({
          error: "Only the challenge leader can invite members",
        });
      }

      if (challengeData.status !== "recruiting") {
        return res.status(400).json({
          error: "Invitations are only allowed while recruiting",
        });
      }

      if (targetMemberData && targetMemberData.status !== "rejected") {
        return res.status(409).json({
          error: "User is already invited or participating in this challenge",
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

      const targetUserData = targetUserDoc.data();
      const targetNickname =
        targetUserData.nickname && targetUserData.nickname.trim()
          ? targetUserData.nickname
          : "";

      const invitationRef = db.collection("invitations").doc();

      await db.runTransaction(async (transaction) => {
        transaction.set(invitationRef, {
          invitationId: invitationRef.id,
          challengeId,
          challengeTitle: challengeData.title || "",
          fromUid: uid,
          fromNickname,
          toUid,
          status: "pending",
          createdAt: new Date(),
        });

        transaction.set(targetMemberRef, {
          nickname: targetNickname,
          role: "member",
          status: "invited",
          invitedAt: new Date(),
          invitationId: invitationRef.id,
        }, { merge: true });
      });

      return res.status(200).json({
        message: "Invitation sent successfully",
        invitationId: invitationRef.id,
        challengeId,
        toUid,
      });
    } catch (error) {
      console.error("inviteChallengeMember error:", error);
      return res.status(error.statusCode || 500).json({
        error: error.message || "Internal Server Error",
      });
    }
  });
