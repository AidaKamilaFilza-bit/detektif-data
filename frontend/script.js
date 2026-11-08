
document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startBtn");
    const hero = document.querySelector(".hero");
    const investigation = document.getElementById("investigation");

    startButton.addEventListener("click", () => {
        // Hide the welcome screen
        hero.classList.add("hidden");

        // Display the investigation dashboard
        investigation.classList.remove("hidden");

        // Scroll to the dashboard
        investigation.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});


function showSuspects() {
    document.getElementById("suspectProfile")
        .classList.add("hidden");

    document.getElementById("suspectSection")
        .classList.remove("hidden");
}

function selectSuspect(name) {
    document.getElementById("suspectSection")
        .classList.add("hidden");

    document.getElementById("suspectProfile")
        .classList.remove("hidden");

    document.getElementById("suspectName")
        .textContent = "SUSPECT FILE: " + name;
}

function backToSuspects() {
    document.getElementById("suspectProfile")
        .classList.add("hidden");

    document.getElementById("suspectSection")
        .classList.remove("hidden");
}



function showEvidence() {
    document.getElementById("suspectSection")
        .classList.add("hidden");

    document.getElementById("suspectProfile")
        .classList.add("hidden");

    document.getElementById("evidenceSection")
        .classList.remove("hidden");

    document.getElementById("evidenceSection")
        .scrollIntoView({ behavior: "smooth" });
}

async function loadEvidence() {
    const person = document.getElementById("evidencePerson").value;
    const table = document.getElementById("evidenceType").value;
    const results = document.getElementById("evidenceResults");

    results.textContent = "Searching evidence database...";

    const params = new URLSearchParams({
        table: table,
        person: person,
        limit: "100"
    });

    try {
        const response = await fetch(
            `http://127.0.0.1:8000/evidence?${params}`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        results.replaceChildren();

        const heading = document.createElement("h3");
        heading.textContent = `${data.count} RECORD(S) FOUND`;
        results.appendChild(heading);

        if (!data.records.length) {
            const message = document.createElement("p");
            message.textContent = "No matching evidence found.";
            results.appendChild(message);
            return;
        }

        const tableElement = document.createElement("table");
        tableElement.className = "evidence-table";

        const header = document.createElement("tr");

        Object.keys(data.records[0]).forEach(column => {
            const th = document.createElement("th");
            th.textContent = column.replaceAll("_", " ").toUpperCase();
            header.appendChild(th);
        });

        tableElement.appendChild(header);

        data.records.forEach(record => {
            const row = document.createElement("tr");

            Object.values(record).forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value ?? "—";
                row.appendChild(cell);
            });

            tableElement.appendChild(row);
        });

        results.appendChild(tableElement);

    } catch (error) {
        results.textContent =
            "Unable to load evidence. Check that FastAPI is running.";
        console.error(error);
    }
}



function showInterrogation() {
    // Hide other investigation sections
    document.getElementById("suspectSection")
        .classList.add("hidden");

    document.getElementById("suspectProfile")
        .classList.add("hidden");

    document.getElementById("evidenceSection")
        .classList.add("hidden");

    // Show interrogation room
    const interrogation = document.getElementById(
        "interrogationSection"
    );

    interrogation.classList.remove("hidden");

    interrogation.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


let questionsUsed = 0;
const MAX_QUESTIONS = 3;
let interrogationBusy = false;

function addChatMessage(message, type) {
    const chat = document.getElementById("chatMessages");

    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${type}`;
    bubble.textContent = message;

    chat.appendChild(bubble);
    chat.scrollTop = chat.scrollHeight;

    return bubble;
}

async function sendInterrogation() {
    if (interrogationBusy || questionsUsed >= MAX_QUESTIONS) {
        return;
    }

    const input = document.getElementById("chatInput");
    const button = document.getElementById("sendChatBtn");
    const suspect = document.getElementById("interrogationSuspect").value;
    const question = input.value.trim();

    if (!question) return;

    interrogationBusy = true;
    button.disabled = true;

    addChatMessage(question, "player-message");
    input.value = "";

    const loading = addChatMessage(
        `${suspect} is responding...`,
        "system-message"
    );

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/interrogate",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    suspect: suspect,
                    question: question
                })
            }
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        loading.remove();
        addChatMessage(
            `${suspect}: ${data.reply}`,
            "suspect-message"
        );

        questionsUsed++;

        document.querySelector(".chat-notice").textContent =
            `${questionsUsed}/${MAX_QUESTIONS} AI questions used`;

    } catch (error) {
        loading.remove();
        addChatMessage(
            "Unable to contact the suspect. Please try later.",
            "system-message"
        );
        console.error(error);

    } finally {
        interrogationBusy = false;
        button.disabled = questionsUsed >= MAX_QUESTIONS;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("sendChatBtn");
    const input = document.getElementById("chatInput");

    button.disabled = false;

    button.addEventListener("click", sendInterrogation);

    input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            sendInterrogation();
        }
    });
});



function showAccusation() {
    // Hide the other investigation sections
    document.getElementById("suspectSection")
        .classList.add("hidden");

    document.getElementById("suspectProfile")
        .classList.add("hidden");

    document.getElementById("evidenceSection")
        .classList.add("hidden");

    document.getElementById("interrogationSection")
        .classList.add("hidden");

    // Display the Final Accusation screen
    const accusation = document.getElementById(
        "accusationSection"
    );

    accusation.classList.remove("hidden");

    accusation.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}



async function submitFinalAccusation() {
    const suspect = document.getElementById("accusedSuspect").value;
    const reasoning = document.getElementById("accusationReason").value.trim();
    const button = document.getElementById("submitAccusationBtn");
    const result = document.getElementById("accusationResult");

    // Check the form before submitting
    if (!suspect) {
        result.textContent = "Please select a suspect.";
        return;
    }

    if (reasoning.length < 10) {
        result.textContent = "Please explain your reasoning (at least 10 characters).";
        return;
    }

    button.disabled = true;
    result.textContent = "Checking your accusation...";

    try {
        const response = await fetch(
            "http://127.0.0.1:8000/accuse",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    suspect: suspect,
                    reasoning: reasoning
                })
            }
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        result.replaceChildren();

        const heading = document.createElement("h3");
        heading.textContent = data.correct
            ? "CASE SOLVED!"
            : "INVESTIGATION INCOMPLETE";

        heading.style.color = data.correct
            ? "#00e5ff"
            : "#ffb454";

        const message = document.createElement("p");
        message.textContent = data.message;

        const score = document.createElement("p");
        score.textContent = `Score: ${data.score}/100`;

        result.append(heading, message, score);

    } catch (error) {
        result.textContent =
            "Unable to check accusation. Please check the backend.";
        console.error(error);

    } finally {
        button.disabled = false;
    }
}

// Connect the Submit button
document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("submitAccusationBtn");

    if (button) {
        button.addEventListener("click", submitFinalAccusation);
    }
});
