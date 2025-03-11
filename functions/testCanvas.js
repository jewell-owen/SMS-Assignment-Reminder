// File to Test Canvas API
//----------------------------------------------------------------------------------

//Test to fetch all Canvas Courses
// require("dotenv").config();
// const axios = require("axios");

// const CANVAS_API_URL = "https://canvas.iastate.edu/api/v1/courses?per_page=50";
// const CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN;

// async function getCourses() {
//   try {
//     const response = await axios.get(CANVAS_API_URL, {
//       headers: { Authorization: `Bearer ${CANVAS_API_TOKEN}` }
//     });

//     console.log("Your Courses:", response.data);
//   } catch (error) {
//     console.error("Error fetching courses:", error.response ? error.response.data : error.message);
//   }
// }

// getCourses();

//Test to fetch all assignments for one course (requires course ID)
require("dotenv").config();
const axios = require("axios");

const CANVAS_API_URL = "https://canvas.iastate.edu/api/v1/courses";
const CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN;
const COURSE_ID = "117614"; // Replace with your actual course ID

// Fetch assignments from Canvas
async function getAssignments(courseId) {
  try {
    const response = await axios.get(
      `${CANVAS_API_URL}/${courseId}/assignments`,
      {
        headers: { Authorization: `Bearer ${CANVAS_API_TOKEN}` },
      }
    );

    console.log("Raw Canvas API Response:", response.data); // Pretty print the JSON JSON.stringify(response.data, null, 2)
    return response.data;
  } catch (error) {
    console.error(
      "Error fetching assignments:",
      error.response ? error.response.data : error.message
    );
    return [];
  }
}

// Run the test
getAssignments(COURSE_ID);
