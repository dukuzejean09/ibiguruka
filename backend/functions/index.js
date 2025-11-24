const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// ==========================================
// AUTHENTICATION TRIGGERS
// ==========================================

/**
 * Triggered when a new user is created in Firebase Auth.
 * Creates a corresponding document in the 'users' collection.
 */
exports.onUserCreated = functions.auth.user().onCreate((user) => {
    return admin.firestore().collection("users").doc(user.uid).set({
        email: user.email || "",
        phone: user.phoneNumber || "",
        role: "citizen", // Default role
        verified: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        blocked: false
    });
});

/**
 * Triggered when a user is deleted in Firebase Auth.
 * Deletes the corresponding document in the 'users' collection.
 */
exports.onUserDeleted = functions.auth.user().onDelete((user) => {
    return admin.firestore().collection("users").doc(user.uid).delete();
});

// ==========================================
// REPORTING APIs
// ==========================================

/**
 * Submit a new incident report.
 * Expected body: { category, description, location: {lat, lng}, photoUrl, userId (optional) }
 */
exports.submitReport = functions.https.onCall(async (data, context) => {
    // Basic validation
    if (!data.category || !data.description || !data.location) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields.');
    }

    const report = {
        category: data.category,
        description: data.description,
        location: data.location,
        photoUrl: data.photoUrl || null,
        userId: context.auth ? context.auth.uid : 'anonymous',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'new', // new, verified, resolved
        credibilityScore: 0, // Initial score
        flagged: false
    };

    try {
        const docRef = await admin.firestore().collection('reports').add(report);
        return { id: docRef.id, message: 'Report submitted successfully.' };
    } catch (error) {
        console.error("Error submitting report:", error);
        throw new functions.https.HttpsError('internal', 'Unable to submit report.');
    }
});

/**
 * Fetch reports for the dashboard (Admin/Police only).
 * This is an example; usually client SDK is used directly with security rules.
 * But this can be used for complex filtering or aggregation.
 */
exports.getReports = functions.https.onCall(async (data, context) => {
    // Check if user is police or admin
    // In a real app, you'd check context.auth.token.role (custom claims)
    // For now, we'll allow authenticated users for demo purposes
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    try {
        const snapshot = await admin.firestore().collection('reports')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

        const reports = [];
        snapshot.forEach(doc => {
            reports.push({ id: doc.id, ...doc.data() });
        });

        return reports;
    } catch (error) {
        console.error("Error fetching reports:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch reports.');
    }
});

// ==========================================
// CHAT APIs
// ==========================================

/**
 * Start a new chat session for a specific report.
 */
exports.startChat = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const reportId = data.reportId;
    if (!reportId) {
        throw new functions.https.HttpsError('invalid-argument', 'Report ID is required.');
    }

    const chatId = reportId; // One chat per report for simplicity

    try {
        await admin.firestore().collection('chats').doc(chatId).set({
            reportId: reportId,
            participants: [context.auth.uid], // Add police ID later
            lastMessage: "Chat started",
            lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        return { chatId: chatId };
    } catch (error) {
        console.error("Error starting chat:", error);
        throw new functions.https.HttpsError('internal', 'Unable to start chat.');
    }
});

/**
 * Send a message in a chat.
 * Expected body: { chatId, text }
 */
exports.sendMessage = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { chatId, text } = data;
    if (!chatId || !text) {
        throw new functions.https.HttpsError('invalid-argument', 'Chat ID and text are required.');
    }

    try {
        // Add message to subcollection
        await admin.firestore().collection('chats').doc(chatId).collection('messages').add({
            senderId: context.auth.uid,
            text: text,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            read: false
        });

        // Update chat metadata
        await admin.firestore().collection('chats').doc(chatId).update({
            lastMessage: text,
            lastMessageTime: admin.firestore.FieldValue.serverTimestamp()
        });

        return { status: 'success' };
    } catch (error) {
        console.error("Error sending message:", error);
        throw new functions.https.HttpsError('internal', 'Unable to send message.');
    }
});

// ==========================================
// ALERT APIs
// ==========================================

/**
 * Broadcast an alert to citizens (Police only).
 * Expected body: { message, area: {lat, lng, radius} }
 */
exports.broadcastAlert = functions.https.onCall(async (data, context) => {
    // Verify police role (omitted for prototype)
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { message, area } = data;
    if (!message || !area) {
        throw new functions.https.HttpsError('invalid-argument', 'Message and area are required.');
    }

    try {
        // Save alert to Firestore
        await admin.firestore().collection('alerts').add({
            message: message,
            area: area,
            senderId: context.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        });

        // Send FCM notification (Placeholder)
        // const payload = { notification: { title: 'Safety Alert', body: message } };
        // await admin.messaging().sendToTopic('all_citizens', payload);

        return { status: 'success', message: 'Alert broadcasted.' };
    } catch (error) {
        console.error("Error broadcasting alert:", error);
        throw new functions.https.HttpsError('internal', 'Unable to broadcast alert.');
    }
});

// ==========================================
// ADMIN APIs
// ==========================================

/**
 * Get list of users (Admin only).
 */
exports.getUsers = functions.https.onCall(async (data, context) => {
    // Verify admin role (omitted for prototype)
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    try {
        const snapshot = await admin.firestore().collection('users').get();
        const users = [];
        snapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    } catch (error) {
        console.error("Error fetching users:", error);
        throw new functions.https.HttpsError('internal', 'Unable to fetch users.');
    }
});

/**
 * Update user role or status (Admin only).
 * Expected body: { userId, role, verified, blocked }
 */
exports.updateUser = functions.https.onCall(async (data, context) => {
    // Verify admin role (omitted for prototype)
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
    }

    const { userId, role, verified, blocked } = data;
    if (!userId) {
        throw new functions.https.HttpsError('invalid-argument', 'User ID is required.');
    }

    try {
        const updateData = {};
        if (role !== undefined) updateData.role = role;
        if (verified !== undefined) updateData.verified = verified;
        if (blocked !== undefined) updateData.blocked = blocked;

        await admin.firestore().collection('users').doc(userId).update(updateData);

        // If blocking, you might want to disable the auth user too
        if (blocked === true) {
            await admin.auth().updateUser(userId, { disabled: true });
        } else if (blocked === false) {
            await admin.auth().updateUser(userId, { disabled: false });
        }

        return { status: 'success', message: 'User updated.' };
    } catch (error) {
        console.error("Error updating user:", error);
        throw new functions.https.HttpsError('internal', 'Unable to update user.');
    }
});


