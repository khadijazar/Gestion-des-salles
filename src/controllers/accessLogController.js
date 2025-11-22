import AccessLog from '../models/AccessLog.js';
import Schedule from '../models/Schedule.js'; // Assuming you have this model
import crypto from 'crypto';

// ------------------- TEMPORARY CODE STORAGE (In-memory) -------------------
const temporaryCodes = new Map();
const CODE_LIFETIME_MS = 5 * 60 * 1000; // 5 minutes

const generateCode = () => {
    return crypto.randomInt(100000, 999999).toString();
};
// -------------------------------------------------------------------------


/**
 * GET /api/access-logs
 * Retrieves all access logs (Admin view).
 */
export const getAccessLogs = async (req, res) => {
    try {
        const logs = await AccessLog.find()
            .populate('profId', 'name')
            .populate('roomId', 'name')
            .populate('scheduleEntryId', 'subject');
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: "Erreur lors de la récupération des logs d'accès.", error });
    }
};

/**
 * POST /api/access-logs (Standard creation)
 * Creates a new log entry (e.g., for generic failures).
 */
export const createAccessLog = async (req, res) => {
    const { profId, roomId, granted, reason, scheduleEntryId } = req.body;
    try {
        const newLog = new AccessLog({ profId, roomId, granted, reason, scheduleEntryId });
        await newLog.save();
        res.status(201).json(newLog);
    } catch (error) {
        res.status(400).json({ message: "Erreur lors de la création du log.", error });
    }
};


/**
 * POST /api/access-logs/generate-code
 * Generates a verification code, stores it temporarily, and creates a pending log entry.
 */
export const generateVerificationCode = async (req, res) => {
    const { scheduleId, profId, roomId } = req.body;

    if (!scheduleId || !profId || !roomId) {
        return res.status(400).json({ message: "Données de planification (scheduleId, profId, roomId) sont requises." });
    }

    try {
        const code = generateCode();
        const expiresAtDate = new Date(Date.now() + CODE_LIFETIME_MS);
        
        // 1. Store the code temporarily in memory for real-time verification
        temporaryCodes.set(scheduleId, { code, profId, roomId, expiresAt: expiresAtDate.getTime() });

        // 2. Create a pending log entry in the database (granted: false)
        const pendingLog = new AccessLog({
            profId,
            roomId,
            scheduleEntryId: scheduleId,
            granted: false,
            reason: "Code generated, waiting for verification.",
            verificationCode: code,
            codeExpiresAt: expiresAtDate
        });
        await pendingLog.save();

        res.status(200).json({ code });
    } catch (error) {
        console.error("Erreur lors de la génération du code:", error);
        res.status(500).json({ message: "Échec de la génération du code.", error });
    }
};

/**
 * POST /api/access-logs/grant
 * Verifies the code, marks schedule as occupied, and updates the access log.
 */
export const grantAccessAndOccupy = async (req, res) => {
    const { scheduleEntryId, profId, roomId, code } = req.body;
    const now = Date.now();

    if (!scheduleEntryId || !profId || !roomId || !code) {
        return res.status(400).json({ message: "Toutes les données de vérification sont requises." });
    }

    const tempEntry = temporaryCodes.get(scheduleEntryId);
    let success = false;
    let logReason;

    // 1. Code validation check (using in-memory map)
    if (tempEntry && tempEntry.code === code && tempEntry.profId === profId && tempEntry.roomId === roomId && tempEntry.expiresAt >= now) {
        success = true;
        logReason = "Présence enregistrée et accès accordé (Code vérifié).";
    } else {
        logReason = tempEntry ? "Code incorrect ou expiré." : "Code manquant ou non généré.";
    }

    // --- EXECUTION PATH ---

    if (success) {
        // 2. Mark the Schedule entry as occupied
        try {
            await Schedule.findByIdAndUpdate(scheduleEntryId, { occupied: true });
        } catch (e) {
            logReason = "Vérification réussie, mais échec de l'occupation de la salle dans la DB.";
            success = false;
        }
    }

    // 3. Log/Update the access log entry
    try {
        // Try to find the existing pending log entry
        let existingLog = await AccessLog.findOne({ 
            scheduleEntryId, 
            profId, 
            granted: false, 
            verificationCode: tempEntry?.code || null 
        });

        if (existingLog) {
            // Update the existing log entry
            existingLog.granted = success;
            existingLog.reason = logReason;
            existingLog.timestamp = Date.now();
            // Clear temporary code fields from DB entry
            existingLog.verificationCode = undefined;
            existingLog.codeExpiresAt = undefined;
            await existingLog.save();
        } else if (!success) {
            // Create a new failure log if verification failed and no pending log was found
            const failedLog = new AccessLog({
                profId, roomId, scheduleEntryId,
                granted: false,
                reason: logReason
            });
            await failedLog.save();
        }

    } catch (e) {
        console.warn("WARN: Access processing finished, but failed to update/save log:", e);
    }
    
    // 4. Clean up the temporary code from the in-memory map
    if (tempEntry) {
        temporaryCodes.delete(scheduleEntryId);
    }

    if (success) {
        res.status(200).json({ message: "Présence enregistrée et accès accordé." });
    } else {
        const status = logReason.includes("échec de l'occupation") ? 500 : 401;
        res.status(status).json({ message: logReason });
    }
};