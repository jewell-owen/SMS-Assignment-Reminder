const {onSchedule} = require("firebase-functions/v2/scheduler");
// const {onRequest} = require("firebase-functions/v2/https");
require("dotenv").config();
const axios = require("axios");
const twilio = require("twilio");

// Canvas Setup
const CANVAS_API_URL = "https://canvas.iastate.edu/api/v1/users/self/todo";
const CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN;

// Twilio Setup
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const TWILIO_PHONE = process.env.TWILIO_PHONE;
const USER_PHONE = process.env.USER_PHONE;

// Mapping of Course IDs to Names
const COURSE_MAP = {
  115083: "CPRE 489",
  118021: "CPRE 310",
  117614: "CPRE 308",
  117667: "AI 201",
  115076: "AI 202",
};

/**
 * Fetches all To-Do items from Canvas API.
 * @param {string} url - The API endpoint URL.
 * @param {Array} collectedItems - Accumulated items (for pagination).
 * @return {Promise<Array>} - List of To-Do items.
 */
async function getAllTodoItems(url, collectedItems = []) {
  try {
    const response = await axios.get(url, {
      headers: {Authorization: `Bearer ${CANVAS_API_TOKEN}`},
      params: {include: ["ungraded_quizzes"], per_page: 50},
    });

    const newItems = response.data;
    collectedItems = collectedItems.concat(newItems);

    const nextPageUrl = getNextPageUrl(response.headers.link);
    if (nextPageUrl) {
      return getAllTodoItems(nextPageUrl, collectedItems);
    }

    return collectedItems;
  } catch (error) {
    // console.error(
    //  "Error fetching todo:",
    //  error.response ? error.response.data : error.message
    // );
    return [];
  }
}

/**
 * Extracts the next page URL from the Canvas API response header.
 * @param {string} linkHeader - The `Link` header from the API response.
 * @return {string|null} - Next page URL or null if none.
 */
function getNextPageUrl(linkHeader) {
  if (!linkHeader) return null;
  const links = linkHeader.split(",").map((link) => link.trim());
  for (const link of links) {
    if (link.includes("rel=\"next\"")) {
      return link.match(/<(.*)>/)[1];
    }
  }
  return null;
}

/**
 * Formats the assignments into a user-friendly SMS message.
 * @param {Array} assignments - List of assignments with due dates.
 * @return {string} - Formatted SMS message.
 */
function formatAssignmentsMessage(assignments) {
  if (assignments.length === 0) {
    return `Hello Owen, you have no upcoming assignments. 
            Keep up the good work! 🎉`;
  }

  let message =
    `Hello Owen, there are ${assignments.length} ` +
    `assignments due soon.\n\n`;

  assignments.forEach((item) => {
    if (!item.assignment) return;

    const courseName = COURSE_MAP[item.course_id] || "Unknown Course";
    const assignmentName = item.assignment.name || "Unnamed Assignment";
    const dueDate = item.assignment.due_at ?
      new Date(item.assignment.due_at).toLocaleString() :
      "No Due Date";

    message += `📌 ${assignmentName} - ${dueDate} ` + `- ${courseName}\n`;
  });

  message += "\nGood Luck and Don't Procrastinate! 🚀";
  return message;
}

/**
 * Sends an SMS notification using Twilio.
 * @param {string} message - The message to be sent.
 * @return {Promise<void>}
 */
async function sendSms(message) {
  try {
    await client.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: USER_PHONE,
    });
    // console.log("✅ SMS sent successfully!");
  } catch (error) {
    // console.error("Error sending SMS:", error);
  }
}

// Firebase Cloud Function triggered by Pub/Sub
exports.sendDailyReminder = onSchedule(
    {schedule: "every day 08:00", timeZone: "America/Chicago"},
    async () => {
      const todoItems = await getAllTodoItems(CANVAS_API_URL);
      const assignmentsWithDueDates = todoItems.filter(
          (item) => item.assignment && item.assignment.due_at,
      );

      assignmentsWithDueDates.sort((a, b) => {
        return new Date(a.assignment.due_at) - new Date(b.assignment.due_at);
      });

      const message = formatAssignmentsMessage(assignmentsWithDueDates);
      await sendSms(message);
    },
);
