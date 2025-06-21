// Copyright 2025 unschooled.art

// --- Google Sheets CSV URLs ---
const STANDARDS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa_KVpvPbKTZgFqcrWqB04fXVEsS6Y0d7XzDzwA37DEGAW3qZ4rPwJbuRqNsAyRmX7c2kheEoGlRIJ/pub?gid=0&single=true&output=csv';
const QUESTIONS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa_KVpvPbKTZgFqcrWqB04fXVEsS6Y0d7XzDzwA37DEGAW3qZ4rPwJbuRqNsAyRmX7c2kheEoGlRIJ/pub?gid=1354885292&single=true&output=csv';
const ACCOMMODATIONS_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa_KVpvPbKTZgFqcrWqB04fXVEsS6Y0d7XzDzwA37DEGAW3qZ4rPwJbuRqNsAyRmX7c2kheEoGlRIJ/pub?gid=421890709&single=true&output=csv';
const YOUTUBE_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQa_KVpvPbKTZgFqcrWqB04fXVEsS6Y0d7XzDzwA37DEGAW3qZ4rPwJbuRqNsAyRmX7c2kheEoGlRIJ/pub?gid=2107013241&single=true&output=csv';

// --- Global Data Arrays ---
let allStandards = [];
let allEssentialQuestions = [];
let allAccommodations = [];
let allYouTubeChannels = [];

const disciplines = { "visual_arts": "Visual Arts" };
const artisticProcesses = { "creating": "Creating", "presenting": "Presenting", "responding": "Responding", "connecting": "Connecting" };
const gradeLevels = {
    "pre_k": "Pre-K", "kindergarten": "Kindergarten", "1st": "1st Grade", "2nd": "2nd Grade",
    "3rd": "3rd Grade", "4th": "4th Grade", "5th": "5th Grade", "6th": "6th Grade",
    "7th": "7th Grade", "8th": "8th Grade", "hs_proficient": "High School Proficient",
    "hs_accomplished": "High School Accomplished", "hs_advanced": "High School Advanced"
};
const assessmentData = {
    "formative": { name: "Formative", activities: ["Exit Ticket", "Peer Critique", "Sketchbook Check", "Think-Pair-Share"] },
    "summative": { name: "Summative", activities: ["Final Project", "Portfolio Review", "Rubric-based Assessment", "Artist Statement"] }
};
const studioHabits = ["Develop Craft", "Engage & Persist", "Envision", "Express", "Observe", "Reflect", "Stretch & Explore", "Understand Art Worlds"];

// --- Utility Functions ---
function getGeneralGradeLevel(specificGrade) {
    const elementary = ["pre_k", "kindergarten", "1st", "2nd", "3rd", "4th", "5th"];
    const middle = ["6th", "7th", "8th"];
    const high = ["hs_proficient", "hs_accomplished", "hs_advanced"];
    if (elementary.includes(specificGrade)) return "elementary";
    if (middle.includes(specificGrade)) return "middle_school";
    if (high.includes(specificGrade)) return "high_school";
    return null;
}

function populateDropdown(id, options, isSpecial = false) {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '';
    if (isSpecial) {
        for (const [value, obj] of Object.entries(options)) {
            select.add(new Option(obj.name, value));
        }
    } else if (Array.isArray(options)) {
        options.forEach(txt => select.add(new Option(txt, txt.toLowerCase().replace(/ /g, '_'))));
    } else {
        for (const [val, label] of Object.entries(options)) {
            select.add(new Option(label, val));
        }
    }
}

function populateChecklist(id, items) {
    const container = document.getElementById(id);
    if (!container) return;
    container.innerHTML = '';
    items.forEach(item => {
        if (!item) return;
        const label = document.createElement('label');
        label.className = 'checklist-item';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = item;
        checkbox.name = id;
        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(` ${item}`));
        container.appendChild(label);
    });
}

function updateSpecificAssessments() {
    const type = document.getElementById('assessmentType').value;
    const activities = assessmentData[type]?.activities || [];
    populateDropdown('specificAssessmentActivity', activities);
}

function filterEssentialQuestions() {
    const questionsDropdown = document.getElementById('essentialQuestionBank');
    if (!questionsDropdown) return;
    questionsDropdown.innerHTML = '';
    const selectedProcess = document.getElementById('artisticProcessSelect').value;
    const filtered = allEssentialQuestions.filter(q =>
        Array.isArray(q.artistic_process) && q.artistic_process.includes(selectedProcess)
    );
    filtered.forEach(q => {
        const option = document.createElement('option');
        option.textContent = q.question;
        option.value = q.question;
        questionsDropdown.appendChild(option);
    });
}

function filterYouTubeChannels() {
    const textarea = document.getElementById('youtubeResources');
    if (!textarea) return;
    const grade = document.getElementById('gradeLevelSelect').value;
    const level = getGeneralGradeLevel(grade);
    const matches = allYouTubeChannels.filter(channel =>
        Array.isArray(channel.grade_levels) &&
        (channel.grade_levels.includes(level) || channel.grade_levels.includes("all_levels"))
    );
    textarea.value = matches.length
        ? matches.map(c => `• ${c.channel_name}: ${c.link}`).join("\n")
        : "No matching channels found.";
}

function filterStandards() {
    const dropdown = document.getElementById('standardsSelect');
    if (!dropdown) return;
    dropdown.innerHTML = '';

    const discipline = document.getElementById('disciplineSelect').value;
    const grade = document.getElementById('gradeLevelSelect').value;
    const process = document.getElementById('artisticProcessSelect').value;

    const filtered = allStandards.filter(s =>
        s.discipline === discipline &&
        s.process === process &&
        Array.isArray(s.grade_levels) &&
        s.grade_levels.includes(grade)
    );

    console.log("Matching standards:", filtered);

    filtered.forEach(s => {
        const code = s.anchor_std_code?.toUpperCase() || '[No Code]';
        const text = s.text || '[No Description]';
        const label = `${code} — ${text}`;
        const option = document.createElement('option');
        option.textContent = label;
        option.value = text; // optionally store full description
        dropdown.appendChild(option);
    });
}

// --- App Initialization Function ---
function initializeApp() {
    populateDropdown('gradeLevelSelect', gradeLevels);
    populateDropdown('disciplineSelect', disciplines);
    populateDropdown('artisticProcessSelect', artisticProcesses);
    populateChecklist('studioHabitsChecklist', studioHabits);
    populateDropdown('assessmentType', assessmentData, true);
    populateChecklist('accommodationsChecklist', allAccommodations.map(a => a.accommodation_text));
    updateSpecificAssessments();
    filterEssentialQuestions();
    filterStandards();
    filterYouTubeChannels();
    document.getElementById('disciplineSelect').addEventListener('change', filterStandards);
    document.getElementById('gradeLevelSelect').addEventListener('change', () => {
        filterStandards();
        filterYouTubeChannels();
    });
    document.getElementById('artisticProcessSelect').addEventListener('change', () => {
        filterStandards();
        filterEssentialQuestions();
    });
    document.getElementById('assessmentType').addEventListener('change', updateSpecificAssessments);
    const slider = document.getElementById('classSizeSlider');
    const sliderValue = document.getElementById('classSizeValue');
    if (slider && sliderValue) {
        slider.addEventListener('input', (e) => {
            sliderValue.textContent = e.target.value;
        });
    }
    document.querySelectorAll('.ai-button, .ai-button-inline').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            alert("✨ This AI-powered feature is coming soon!");
        });
    });
}

// --- Sheet Loader ---
function loadDataFromSheet(url) {
    return new Promise((resolve, reject) => {
        Papa.parse(url, {
            download: true,
            skipEmptyLines: true,
            complete: (results) => {
                const [headers, ...dataRows] = results.data;
                const processed = dataRows.map(row => {
                    let obj = {};
                    headers.forEach((h, i) => {
                        const key = h.trim().toLowerCase();
                        const val = (row[i] || '').trim();
                        if (key === 'grade_levels' || key === 'artistic_process') {
                            obj[key] = val.toLowerCase().split(',').map(x => x.trim());
                        } else {
                            obj[key] = val.toLowerCase();
                        }
                    });
                    return obj;
                });
                resolve(processed);
            },
            error: reject
        });
    });
}

async function loadAllData() {
    try {
        [allStandards, allEssentialQuestions, allAccommodations, allYouTubeChannels] = await Promise.all([
            loadDataFromSheet(STANDARDS_URL),
            loadDataFromSheet(QUESTIONS_URL),
            loadDataFromSheet(ACCOMMODATIONS_URL),
            loadDataFromSheet(YOUTUBE_URL)
        ]);
        initializeApp();
    } catch (error) {
        console.error("Error loading data:", error);
        alert("Error loading data: " + error.message);
    }
}

// --- DOM Ready ---
document.addEventListener('DOMContentLoaded', () => {
    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    window.openTab = (event, tabName) => {
        tabContents.forEach(tab => tab.style.display = 'none');
        tabLinks.forEach(link => link.classList.remove('active'));
        document.getElementById(tabName).style.display = 'block';
        event.currentTarget.classList.add('active');
    };
    tabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            const tabName = link.getAttribute('onclick').split("'")[1];
            window.openTab(event, tabName);
        });
    });
    document.querySelector('.tab-link').click();
    loadAllData();
});
