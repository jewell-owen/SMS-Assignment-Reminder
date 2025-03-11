require("dotenv").config();
const axios = require("axios");

const CANVAS_API_URL = "https://canvas.iastate.edu/api/v1/courses";
const CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN;

async function getCourses() {
  try {
    const response = await axios.get(CANVAS_API_URL, {
      headers: { Authorization: `Bearer ${CANVAS_API_TOKEN}` }
    });

    console.log("Your Courses:", response.data);
  } catch (error) {
    console.error("Error fetching courses:", error.response ? error.response.data : error.message);
  }
}

getCourses();



// require("dotenv").config();
// const axios = require("axios");

// const CANVAS_API_URL = "https://canvas.iastate.edu/api/v1/courses";
// const CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN;
// const COURSE_ID = "<your-course-id>"; // Replace with your actual course ID

// // Fetch assignments from Canvas
// async function getAssignments(courseId) {
//   try {
//     const response = await axios.get(`${CANVAS_API_URL}/${courseId}/assignments`, {
//       headers: { Authorization: `Bearer ${CANVAS_API_TOKEN}` }
//     });

//     console.log("Raw Canvas API Response:", JSON.stringify(response.data, null, 2)); // Pretty print the JSON
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching assignments:", error.response ? error.response.data : error.message);
//     return [];
//   }
// }

// // Run the test
// getAssignments(COURSE_ID);