# lesson-plan-generator
Lesson plan generator for primary and secondary Visual Arts/Media Arts teachers.

A web-based tool for [unschooled.art](https://www.unschooled.art) that uses AI to help art teachers quickly generate high-quality, standards-aligned lesson plans.

---

## ✨ Key Features

This tool is designed to streamline the entire lesson planning process for art educators.

* **Dynamic Data:** National Standards, Essential Questions, and other data are pulled from a separate `database.js` file, making them easy to update.
* **Smart Filtering:** Dropdown menus for standards and questions automatically filter based on the selected grade level and artistic process.
* **AI-Powered Suggestions:** "Generate" buttons will be integrated to provide AI-powered ideas for:
    * Lesson Objectives & Overviews
    * Materials Lists (with adjustable class size)
    * Rubric Criteria
    * Art History Connections
    * Lesson Hooks & Differentiation Strategies
* **Curriculum Helpers:** Includes built-in checklists and identifiers for Studio Habits of Mind and Accommodations.
* **PDF & Print:** Finished lesson plans can be downloaded as a PDF or printed directly.

## 🛠️ Tech Stack & Tools

* **Frontend:** HTML, CSS, JavaScript
* **Data Source:** `database.js` file
* **Deployment & Backend:** Netlify (for hosting and serverless functions)
* **AI:** Google AI API (to be implemented in Phase 4)

## 🚀 Running the Project Locally

To run this project on your local machine for development:

1.  Ensure you have all project files (`index.html`, `style.css`, `script.js`, `database.js`) in the same folder.
2.  Open the folder in Visual Studio Code.
3.  Install the **"Live Server"** extension (by Ritwick Dey).
4.  Right-click on `index.html` and select "Open with Live Server". This will open the project in your browser and handle any local server requirements.

## 🗺️ Project Roadmap

* [✅] **Phase 1: Foundational UI/UX** - Complete
* [✅] **Phase 2: Data Integration** - Complete
* [⏳] **Phase 3: Secure Backend Setup** - In Progress
* [📋] **Phase 4: AI Feature Implementation** - To Do
