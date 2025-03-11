/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// My code
//-----------------------------------------------------------------------------------------------------
const functions = require("firebase-functions");
const axios = require("axios");
const twilio = require("twilio");
require("dotenv").config();

// Twilio Setup
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_PHONE = process.env.TWILIO_PHONE;
const USER_PHONE = process.env.USER_PHONE;

// Canvas API Config
const CANVAS_API_URL = "https://canvas.iastate.edu/api/v1/courses";
const CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN;

// Fetch assignments from Canvas
async function getAssignments(courseId) {
  try {
    const response = await axios.get(`${CANVAS_API_URL}/${courseId}/assignments`, {
      headers: { Authorization: `Bearer ${CANVAS_API_TOKEN}` }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return [];
  }
}

// Send SMS notification
async function sendSms(message) {
  try {
    await client.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: USER_PHONE
    });
  } catch (error) {
    console.error("Error sending SMS:", error);
  }
}

// Scheduled function to run twice a day
exports.assignmentReminder = functions.pubsub.schedule("0 8,20 * * *") // 8 AM and 8 PM UTC
  .timeZone("America/Chicago")
  .onRun(async () => {
    const courseId = "<your-course-id>"; // Replace with actual course ID
    const assignments = await getAssignments(courseId);
    
    const upcoming = assignments
      .filter(a => new Date(a.due_at) > new Date())
      .map(a => `${a.name}: Due ${new Date(a.due_at).toLocaleString()}`)
      .join("\n");

    if (upcoming) {
      await sendSms(`Upcoming Assignments:\n${upcoming}`);
    }
  });
