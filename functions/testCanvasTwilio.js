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

// Function to fetch all pages of the to-do list
async function getAllTodoItems(url, collectedItems = []) {
  try {
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${CANVAS_API_TOKEN}` },
      params: { include: ["ungraded_quizzes"], per_page: 50 },
    });

    const newItems = response.data;
    collectedItems = collectedItems.concat(newItems);

    // Check for pagination (Canvas API includes next page link in headers)
    const nextPageUrl = getNextPageUrl(response.headers.link);
    if (nextPageUrl) {
      return getAllTodoItems(nextPageUrl, collectedItems); // Recursive call to get next page
    }

    return collectedItems;
  } catch (error) {
    //console.error(
    //  "Error fetching todo:",
    //  error.response ? error.response.data : error.message
    //);
    return [];
  }
}

// Function to extract next page URL from Canvas API response headers
function getNextPageUrl(linkHeader) {
  if (!linkHeader) return null;
  const links = linkHeader.split(",").map((link) => link.trim());
  for (const link of links) {
    if (link.includes('rel="next"')) {
      return link.match(/<(.*)>/)[1]; // Extract the URL inside <>
    }
  }
  return null;
}

// Format assignments into an SMS message
function formatAssignmentsMessage(assignments) {
  if (assignments.length === 0) {
    return "Hello Owen, you have no upcoming assignments. Keep up the good work! 🎉";
  }

  let message = `Hello Owen, there are ${assignments.length} assignments due soon.\n\n`;

  assignments.forEach((item) => {
    if (!item.assignment) return; // Skip if the assignment object is missing

    const courseName = COURSE_MAP[item.course_id] || "Unknown Course";
    const assignmentName = item.assignment.name || "Unnamed Assignment";
    const dueDate = item.assignment.due_at
      ? new Date(item.assignment.due_at).toLocaleString()
      : "No Due Date";

    message += `📌 ${assignmentName} - ${dueDate} - ${courseName}\n`;
  });

  message += "\nGood Luck and Don't Procrastinate! 🚀";

  return message;
}

// Send SMS notification
async function sendSms(message) {
  try {
    await client.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: USER_PHONE,
    });
    console.log("✅ SMS sent successfully!");
  } catch (error) {
    //console.error("Error sending SMS:", error);
  }
}

// Run the test
getAllTodoItems(CANVAS_API_URL).then((todoItems) => {
  // Filter out assignments without a due date
  const assignmentsWithDueDates = todoItems.filter(
    (item) => item.assignment?.due_at
  );

  // Sort assignments by due date (earliest first)
  assignmentsWithDueDates.sort(
    (a, b) => new Date(a.assignment.due_at) - new Date(b.assignment.due_at)
  );

  console.log(
    `📌 Retrieved ${assignmentsWithDueDates.length} assignments:`,
    assignmentsWithDueDates
  );

  const message = formatAssignmentsMessage(assignmentsWithDueDates);
  //console.log("📨 Sending SMS with message:\n", message);
  sendSms(message);
});
