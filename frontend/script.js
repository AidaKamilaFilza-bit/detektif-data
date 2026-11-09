const PLAYER_ID_KEY = "detektif_data_player_id";


function updateAIUsageBanner(used) {
    const count = document.getElementById("aiUsageCount");
    const progress = document.getElementById("aiUsageProgress");

    const safeUsed = Math.max(
        0,
        Math.min(Number(used) || 0, MAX_QUESTIONS)
    );

    if (count) {
        count.textContent =
            `${safeUsed} / ${MAX_QUESTIONS} USED`;
    }

    if (progress) {
        progress.style.width =
            `${(safeUsed / MAX_QUESTIONS) * 100}%`;
    }
}

async function loadPlayerQuestionStatus() {

    const counter = document.querySelector(".chat-notice");
    const sendButton = document.getElementById("sendChatBtn");
    const investigateButton = document.getElementById("investigateBtn");
    const coachButton = document.getElementById("coachBtn");

    // No authorized investigation session
    if (!playerId) {
        updateAIUsageBanner(0);

        if (counter) {
            counter.textContent =
                "🔐 Please ask staff to start a new investigation.";
        }

        if (sendButton) sendButton.disabled = true;
        if (investigateButton) investigateButton.disabled = true;
        if (coachButton) coachButton.disabled = true;

        return;
    }

    try {
        const response = await fetch(
            `https://detektif-data-backend.onrender.com/player/status/${playerId}`
        );

        // Session expired or unauthorized
        if (response.status === 403) {
            playerId = null;
            sessionStorage.removeItem(PLAYER_ID_KEY);
            updateAIUsageBanner(0);

            if (counter) {
                counter.textContent =
                    "🔐 Session expired. Please ask staff to start a new investigation.";
            }

            if (sendButton) sendButton.disabled = true;
            if (investigateButton) investigateButton.disabled = true;
            if (coachButton) coachButton.disabled = true;

            return;
        }

        if (!response.ok) {
            console.warn(
                "Unable to load player status:",
                response.status
            );
            return;
        }

        const data = await response.json();

        questionsUsed = data.questions_used;
        updateAIUsageBanner(questionsUsed);

        if (counter) {
            counter.textContent =
                `${questionsUsed}/${MAX_QUESTIONS} AI requests used`;
        }

        const limitReached =
            questionsUsed >= MAX_QUESTIONS;

        // Suspect interrogation
        if (sendButton) {
            sendButton.disabled =
                limitReached || interrogationBusy;
        }

        // Autonomous investigation
        if (investigateButton) {
            investigateButton.disabled = limitReached;
        }

        // AI Investigation Coach
        if (coachButton) {
            coachButton.disabled =
                limitReached || coachBusy;
        }

    } catch (error) {
        console.error(
            "Unable to load player status:",
            error
        );
    }
}

let playerId = sessionStorage.getItem(PLAYER_ID_KEY);

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

    // Hide suspect profile
    document.getElementById("suspectProfile")
        .classList.add("hidden");

    // Hide interrogation room
    document.getElementById("interrogationSection")
        .classList.add("hidden");

    // Hide autonomous investigation room
    document.getElementById("investigationSection")
        .classList.add("hidden");

    // Hide evidence board
    document.getElementById("evidenceSection")
        .classList.add("hidden");

    // Hide final accusation
    document.getElementById("accusationSection")
        .classList.add("hidden");

    // Show suspect list
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

    // Match each suspect to their original portrait
    const suspectImages = {
        "Alya": "images/suspect-alya.png",
        "Faris": "images/suspect-faris.png",
        "Daniel": "images/suspect-daniel.png",
        "Nadia": "images/suspect-nadia.png"
    };

    let photo = document.getElementById("suspectPhoto");

    if (!photo) {
        photo = document.createElement("img");
        photo.id = "suspectPhoto";
        photo.className = "suspect-photo";

        document.getElementById("suspectName")
            .insertAdjacentElement("afterend", photo);
    }

    photo.src = suspectImages[name] || "";
    photo.alt = name + " suspect case file";
    photo.style.display = suspectImages[name] ? "block" : "none";
    // Suspect dossier information
const suspectDetails = {
    Alya: {
        role: "Event Committee — Booth Operations"
    },
    Faris: {
        role: "Technical Team — AV & Equipment"
    },
    Daniel: {
        role: "Innovation Team — Prototype Lead"
    },
    Nadia: {
        role: "Logistics Team — Booth & Inventory"
    }
};

const details = suspectDetails[name];

document.getElementById("dossierName").textContent = name;

document.getElementById("dossierRole").textContent =
    details ? details.role : "Under investigation";

document.getElementById("dossierAlibi").textContent =
    "Statement pending review";
    // Automatically select this suspect for interrogation
const interrogationSelect =
    document.querySelector("#interrogationSection select");

if (interrogationSelect) {
    interrogationSelect.value = name;
}
}

function backToSuspects() {

    // Hide the suspect profile
    document.getElementById("suspectProfile")
        .classList.add("hidden");

    // Hide the interrogation room
    document.getElementById("interrogationSection")
        .classList.add("hidden");

    // Hide the evidence board
    document.getElementById("evidenceSection")
        .classList.add("hidden");

    // Hide the final accusation screen
    document.getElementById("accusationSection")
        .classList.add("hidden");

    // Show the suspect selection screen
    document.getElementById("suspectSection")
        .classList.remove("hidden");

    // Scroll back to the suspects
    document.getElementById("suspectSection")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
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
            `https://detektif-data-backend.onrender.com/evidence?${params}`
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


function showInvestigation() {

    // Hide suspect list
    document.getElementById("suspectSection")
        .classList.add("hidden");

    // Hide suspect profile
    document.getElementById("suspectProfile")
        .classList.add("hidden");

    // Hide evidence board
    document.getElementById("evidenceSection")
        .classList.add("hidden");

    // Hide interrogation room
    document.getElementById("interrogationSection")
        .classList.add("hidden");

    // Hide final accusation
    document.getElementById("accusationSection")
        .classList.add("hidden");

    // Show autonomous investigation room
    const investigation = document.getElementById(
        "investigationSection"
    );

    investigation.classList.remove("hidden");

    investigation.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

let questionsUsed = 0;
const MAX_QUESTIONS = 5;
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
        if (!playerId) {
        addChatMessage(
            "Please ask exhibition staff to start a new investigation before interrogating a suspect.",
            "system-message"
        );
        return;
    }

    if (interrogationBusy || questionsUsed >= MAX_QUESTIONS) {
        return;
    }

    const input = document.getElementById("chatInput");
    const button = document.getElementById("sendChatBtn");
    const suspect = document.getElementById("interrogationSuspect").value;
    const question = input.value.trim();

    if (!question) return;

    let sessionUnauthorized = false;

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
            "https://detektif-data-backend.onrender.com/interrogate",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
    suspect: suspect,
    question: question,
    player_id: playerId
})
            }
        );

        if (response.status === 403) {
            sessionUnauthorized = true;
    loading.remove();

    addChatMessage(
        "Your investigation session is not authorized. Please ask staff to start a new investigation.",
        "system-message"
    );

    button.disabled = true;
    return;
}

if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
}

        const data = await response.json();

        loading.remove();
        addChatMessage(
            `${suspect}: ${data.reply}`,
            "suspect-message"
        );


await loadPlayerQuestionStatus();

    } catch (error) {
        loading.remove();
        addChatMessage(
            "Unable to contact the suspect. Please try later.",
            "system-message"
        );
        console.error(error);


} finally {
    interrogationBusy = false;

    if (sessionUnauthorized) {
        playerId = null;
        sessionStorage.removeItem(PLAYER_ID_KEY);
    }

    await loadPlayerQuestionStatus();

    button.disabled =
        !playerId || questionsUsed >= MAX_QUESTIONS;
}

}

document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("sendChatBtn");
    const input = document.getElementById("chatInput");

    button.disabled = true;
loadPlayerQuestionStatus();

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
            "https://detektif-data-backend.onrender.com/accuse",
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

// NEW: Autonomous Investigation Agent

document.getElementById("staffResetBtn").addEventListener("click", async () => {
    const pin = prompt("Enter staff passphrase to start a new investigation:");

    if (pin === null || !pin.trim()) return;

    try {
        const response = await fetch("https://detektif-data-backend.onrender.com/staff/reset", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ pin })
        });

        if (!response.ok) {
            alert("Staff reset failed. Check your passphrase.");
            return;
        }

        const data = await response.json();

        playerId = data.player_id;
        sessionStorage.setItem(PLAYER_ID_KEY, playerId);

        questionsUsed = 0;

        document.querySelector(".chat-notice").textContent =
            `0/${MAX_QUESTIONS} AI questions used`;

        alert("New investigation started! The next visitor has 5 AI questions.");

        location.reload();

    } catch (error) {
        console.error(error);
        alert("Unable to connect to the backend.");
    }
});

document.addEventListener("DOMContentLoaded", () => {
    loadPlayerQuestionStatus();
});


async function runAutonomousInvestigation(question) {
    if (!playerId) {
        return {
            error: "Please ask exhibition staff to start a new investigation."
        };
    }

    try {
        const response = await fetch(
            "https://detektif-data-backend.onrender.com/investigate",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    question: question,
                    player_id: playerId
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return {
                error: data.detail || "Investigation failed."
            };
        }

        return data;

    } catch (error) {
        console.error("Autonomous investigation error:", error);

        return {
            error: "Unable to connect to the investigation agent."
        };
    }
}



document.getElementById("investigateBtn")
    .addEventListener("click", async () => {

        const input = document.getElementById("investigationQuestion");
        const button = document.getElementById("investigateBtn");
        const status = document.getElementById("investigationStatus");
        const results = document.getElementById("investigationResults");
        const findings = document.getElementById("investigationFindings");
        const actions = document.getElementById("investigationToolActions");

        const question = input.value.trim();

        if (!question) {
            status.textContent = "Please enter an investigation question.";
            return;
        }

        button.disabled = true;
        results.hidden = true;
        status.textContent = "🔎 AI detective is investigating evidence...";

        try {
            const data = await runAutonomousInvestigation(question);

            if (data.error) {
                status.textContent = data.error;
                return;
            }

            findings.textContent = data.findings || "No findings returned.";
            findings.style.whiteSpace = "pre-wrap";

            actions.replaceChildren();

            const toolActions = data.tool_actions || [];

            if (toolActions.length === 0) {
                actions.textContent = "No evidence searches were recorded.";
            } else {
                toolActions.forEach(action => {
                    const item = document.createElement("p");

                    item.textContent =
                        `${action.success ? "✓" : "✗"} ` +
                        `${action.tool}: ${action.table} | ` +
                        `Person: ${action.person} | ` +
                        `Records: ${action.records_found}`;

                    actions.appendChild(item);
                });
            }

            results.hidden = false;
            status.textContent = "Investigation completed.";

            if (typeof loadPlayerQuestionStatus === "function") {
                await loadPlayerQuestionStatus();
            }

        } catch (error) {
            console.error("Investigation UI error:", error);
            status.textContent = "An unexpected error occurred.";


} finally {
    if (typeof loadPlayerQuestionStatus === "function") {
        await loadPlayerQuestionStatus();
    }

    button.disabled =
        !playerId || questionsUsed >= MAX_QUESTIONS;
}


    });

/* =========================================
   AI INVESTIGATION COACH
========================================= */

let coachBusy = false;

function showCoach() {
    const sections = [
        "suspectSection",
        "suspectProfile",
        "evidenceSection",
        "interrogationSection",
        "investigationSection",
        "accusationSection"
    ];

    sections.forEach(id => {
        document.getElementById(id)
            ?.classList.add("hidden");
    });

    const coachSection =
        document.getElementById("coachSection");

    coachSection.classList.remove("hidden");

    coachSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

async function requestCoaching() {
    const button = document.getElementById("coachBtn");
    const status = document.getElementById("coachStatus");
    const results = document.getElementById("coachResults");
    const output = document.getElementById("coachResponse");

    const question = document
        .getElementById("coachQuestion")
        .value.trim();

    const hintLevel = Number(
        document.getElementById("coachHintLevel").value
    );

    if (coachBusy) return;

    if (!playerId) {
        status.textContent =
            "Please ask staff to start an investigation.";
        return;
    }

    if (questionsUsed >= MAX_QUESTIONS) {
        status.textContent =
            "You have used all 5 AI requests.";
        return;
    }

    if (!question) {
        status.textContent =
            "Please explain your reasoning first.";
        return;
    }

    coachBusy = true;
    button.disabled = true;
    results.hidden = true;

    status.textContent =
        "🧠 Your investigation coach is thinking...";

    try {
        const response = await fetch(
            "https://detektif-data-backend.onrender.com/coach",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    player_id: playerId,
                    question: question,
                    hint_level: hintLevel,
                    evidence_context: ""
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            status.textContent =
                data.detail || "Coaching unavailable.";
            return;
        }

        output.textContent =
            data.coaching || "No coaching response.";

        results.hidden = false;
        status.textContent =
            `Hint Level ${data.hint_level} completed.`;

    } catch (error) {
        console.error("Coach error:", error);
        status.textContent =
            "Unable to contact the Coach Agent.";
    } finally {
        coachBusy = false;

        await loadPlayerQuestionStatus();

        button.disabled =
            !playerId || questionsUsed >= MAX_QUESTIONS;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const button = document.getElementById("coachBtn");

    if (button) {
        button.addEventListener("click", requestCoaching);
    }
});


[
    "showSuspects",
    "showEvidence",
    "showInterrogation",
    "showInvestigation",
    "showAccusation",
    "selectSuspect",
    "backToSuspects"
].forEach(name => {
    const original = window[name];

    if (typeof original === "function") {
        window[name] = function (...args) {
            document.getElementById("coachSection")
                ?.classList.add("hidden");

            return original.apply(this, args);
        };
    }
});
