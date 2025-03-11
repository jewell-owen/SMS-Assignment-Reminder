// File to Test Canvas API and Twilio API together
//----------------------------------------------------------------------------------

//Test to fetch all assignments for one course (requires course ID)
require("dotenv").config();
const axios = require("axios");

const CANVAS_API_URL =
  "https://canvas.iastate.edu/api/v1/users/self/todo?per_page=50";
const CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN;

// Fetch assignments from Canvas (excluding submitted ones and including ungraded quizzes)
async function getTodo() {
  try {
    const response = await axios.get(CANVAS_API_URL, {
      headers: {
        Authorization: `Bearer ${CANVAS_API_TOKEN}`,
      },
      params: {
        include: ["ungraded_quizzes"], // Include ungraded quizzes
      },
    });

    const todoItems = response.data;

    // Filter out assignments that have already been submitted
    const pendingAssignments = todoItems.filter(
      (item) => !item.has_submitted_submissions // Exclude ignored or completed items !item.ignore &&
    );

    console.log("Filtered Assignments (Not Submitted):", pendingAssignments);

    return pendingAssignments;
  } catch (error) {
    console.error(
      "Error fetching todo:",
      error.response ? error.response.data : error.message
    );
    return [];
  }
}

// Run the test
getTodo();
