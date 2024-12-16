// -- Code goes here --
const timers = {};
const start = {};
const timeelapsed = {};
let activityCount = 3; // Starting with 3 since there are already 3 activities

// Add event listeners for start/stop buttons
document.querySelectorAll(".start").forEach((button) => {
  button.addEventListener("click", (e) => {
    const activityid = e.target.getAttribute("data-activity");
    startTimer(activityid);
  });
});

document.querySelectorAll(".stop").forEach((button) => {
  button.addEventListener("click", (e) => {
    const activityid = e.target.getAttribute("data-activity");
    stopTimer(activityid);
  });
});

// Event listener for Add Activity button
document
  .getElementById("addActivity")
  .addEventListener("click", addNewActivity);

// Function to dynamically add a new activity card
function addNewActivity() {
  activityCount++;

  // Create a new list item for the new activity
  const li = document.createElement("li");
  li.innerHTML = `
    <div class="activity-info card p-3 shadow-sm text-center" data-activity="${activityCount}">
      <h5 class="card-title mb-4">Activity ${activityCount}</h5>
      <p id="currentTime-${activityCount}" class="card-text"><b>00:00.00</b></p>
      <div class="buttons d-flex justify-content-center mt-3 gap-2">
        <button class="stop btn btn-danger" data-activity="${activityCount}">Stop</button>
        <button class="start btn btn-success" data-activity="${activityCount}">Start</button>
      </div>
      <p class="target-time mt-4 mb-0">Target time: 01:10.28</p>
    </div>
  `;

  document.querySelector(".container__current_activity ul").appendChild(li);

  // Add event listeners to the new start/stop buttons
  li.querySelector(".start").addEventListener("click", (e) => {
    const activityid = e.target.getAttribute("data-activity");
    startTimer(activityid);
  });

  li.querySelector(".stop").addEventListener("click", (e) => {
    const activityid = e.target.getAttribute("data-activity");
    stopTimer(activityid);
  });
}

// Start the timer for a specific activity
function startTimer(activityid) {
  if (!timers[activityid]) {
    start[activityid] = Date.now() - (timeelapsed[activityid] || 0);
    timers[activityid] = setInterval(() => updateTime(activityid), 100);
  }
}

// Stop the timer for a specific activity
function stopTimer(activityid) {
  if (timers[activityid]) {
    clearInterval(timers[activityid]);
    timeelapsed[activityid] = Date.now() - start[activityid];
    delete timers[activityid];

    // Get the target time from the DOM
    const targetTimeStr = document
      .querySelector(
        `.activity-info[data-activity="${activityid}"] .target-time`
      )
      .textContent.replace("Target time: ", "");
    const targetTimeMs = parseTargetTime(targetTimeStr);

    // Calculate performance based on actual and target times
    const timetaken = formatTime(timeelapsed[activityid]);
    const performance = calculatePerformance(
      timeelapsed[activityid],
      targetTimeMs
    );

    saveActivity(
      `Activity ${activityid}`,
      targetTimeStr,
      timetaken,
      performance
    );
    storeActivity(activityid, targetTimeStr, timetaken, performance);

    timeelapsed[activityid] = 0; // Reset for the next activity
    document.getElementById(`currentTime-${activityid}`).textContent =
      "00:00.00";
  }
}

// Update the displayed time for a specific activity
function updateTime(activityid) {
  const elapsed = Date.now() - start[activityid];
  document.getElementById(`currentTime-${activityid}`).textContent =
    formatTime(elapsed);
}

// Format time as mm:ss.SS
function formatTime(ms) {
  const time = new Date(ms);
  const minutes = String(time.getUTCMinutes()).padStart(2, "0");
  const seconds = String(time.getUTCSeconds()).padStart(2, "0");
  const milliseconds = String(
    Math.floor(time.getUTCMilliseconds() / 10)
  ).padStart(2, "0");
  return `${minutes}:${seconds}.${milliseconds}`;
}

// Calculate performance based on time taken
function calculatePerformance(ms, target) {
  const performance = (target / ms) * 100;
  return `${Math.round(performance)}%`;
}

function parseTargetTime(targetTimeStr) {
  const [minutes, seconds] = targetTimeStr.split(":");
  const [secs, millisecs] = seconds.split(".");
  return (
    parseInt(minutes) * 60 * 1000 +
    parseInt(secs) * 1000 +
    (parseInt(millisecs) || 0)
  );
}

// Save activity to the table
function saveActivity(activity, target, time, performance) {
  const row = document.createElement("tr");
  row.innerHTML = `<td class="border border-light p-2">${activity}</td><td class="border border-light p-2">${target}</td><td class="border border-light p-2">${time}</td><td class="border border-light p-2">${performance}</td>`;
  document.querySelector("#activityTable tbody").appendChild(row);
}

// Persist activity data in localStorage
function storeActivity(activityid, target, time, performance) {
  const activityData = JSON.parse(localStorage.getItem("activities")) || [];
  activityData.push({
    activityid,
    activity: `Activity ${activityid}`,
    target,
    time,
    performance,
  });
  localStorage.setItem("activities", JSON.stringify(activityData));
}

// Load activities from localStorage on page load
function activities() {
  const savedActivities = JSON.parse(localStorage.getItem("activities")) || [];
  savedActivities.forEach(({ activity, time, performance }) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td class="border border-light p-2">${activity}</td><td class="border border-light p-2">${time}</td><td class="border border-light p-2">${performance}</td><td class="border border-light p-2">${performance}</td>`;
    document.querySelector("#activityTable tbody").appendChild(row);
  });
}

// Sorting functionality
const tableHeaders = document.querySelectorAll("#activityTable th");
tableHeaders.forEach((header) => {
  header.addEventListener("click", () => {
    const sort = header.getAttribute("data-sort");
    sortTable(sort);
  });
});

function sortTable(key) {
  const rows = Array.from(
    document.querySelector("#activityTable tbody").querySelectorAll("tr")
  );
  const sort = rows.sort((a, b) => {
    const cellA = a.querySelector(
      `td:nth-child(${columnindex(key)})`
    ).textContent;
    const cellB = b.querySelector(
      `td:nth-child(${columnindex(key)})`
    ).textContent;

    if (key === "time") {
      return time(cellA) - time(cellB);
    } else if (key === "performance") {
      return parseInt(cellB) - parseInt(cellA);
    } else {
      return cellA.localeCompare(cellB);
    }
  });

  document.querySelector("#activityTable tbody").innerHTML = "";
  sort.forEach((row) =>
    document.querySelector("#activityTable tbody").appendChild(row)
  );
}

function time(timeStr) {
  const [minutes, seconds] = timeStr.split(":");
  const [secs, millisecs] = seconds.split(".");
  return (
    parseInt(minutes) * 60000 + parseInt(secs) * 1000 + parseInt(millisecs) * 10
  );
}

function columnindex(key) {
  switch (key) {
    case "activity":
      return 1;
    case "time":
      return 2;
    case "performance":
      return 3;
    default:
      return 1;
  }
}

// Load activities when the page is loaded
document.addEventListener("DOMContentLoaded", activities);

module.exports = {
  startTimer,
  stopTimer,
  formatTime,
  calculatePerformance,
  parseTargetTime,
  saveActivity,
  storeActivity,
  activities,
  sortTable,
  time,
  columnindex,
};
