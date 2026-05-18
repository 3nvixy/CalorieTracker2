// ----- State -----

function getTodayISO() {
    const d = new Date();
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().split("T")[0];
}

let currentDate = getTodayISO();
let allDays = JSON.parse(localStorage.getItem("allDays")) || {}; // { [date]: { foods: [], goal: number|null } }

// Ensure structure for a date
function ensureDay(date) {
    if (!allDays[date]) {
        allDays[date] = { foods: [], goal: null };
    }
}

// ----- Dark mode -----

function applyDarkModeFromStorage() {
    const mode = localStorage.getItem("darkMode");
    if (mode === "on") {
        document.body.classList.add("dark");
    }
}

function toggleDarkMode() {
    document.body.classList.toggle("dark");
    const isOn = document.body.classList.contains("dark");
    localStorage.setItem("darkMode", isOn ? "on" : "off");
}

// ----- Core display -----

function updateDisplay() {
    ensureDay(currentDate);
    const dayData = allDays[currentDate];
    const foods = dayData.foods;
    const goal = dayData.goal;

    const list = document.getElementById("foodList");
    const totalSpan = document.getElementById("totalCalories");
    const goalDisplay = document.getElementById("goalDisplay");
    const dateLabel = document.getElementById("dateLabel");

    list.innerHTML = "";
    let totalCalories = 0;

    foods.forEach((item, index) => {
        totalCalories += item.calories;

        const li = document.createElement("li");
        li.innerHTML = `
            <span>${item.name} - ${item.calories} cal</span>
            <button class="delete-btn" onclick="deleteFood(${index})">X</button>
        `;
        list.appendChild(li);
    });

    totalSpan.textContent = totalCalories;
    dateLabel.textContent = currentDate;

    if (goal) {
        goalDisplay.textContent = `Goal: ${goal} calories`;
        const percent = Math.min((totalCalories / goal) * 100, 100);
        document.getElementById("progressBar").style.width = percent + "%";
    } else {
        goalDisplay.textContent = "No goal set";
        document.getElementById("progressBar").style.width = "0%";
    }
}

// ----- Date handling -----

function changeDate() {
    const input = document.getElementById("dateInput").value;
    if (!input) return;
    currentDate = input;
    ensureDay(currentDate);
    updateDisplay();
}

// ----- Goal -----

function setGoal() {
    const val = document.getElementById("goalInput").value;
    if (!val) return alert("Enter a goal");
    ensureDay(currentDate);
    allDays[currentDate].goal = parseInt(val);
    localStorage.setItem("allDays", JSON.stringify(allDays));
    updateDisplay();
}

// ----- Foods -----

function addFood() {
    const name = document.getElementById("foodName").value.trim();
    const caloriesVal = document.getElementById("foodCalories").value;

    if (!name || !caloriesVal) {
        alert("Enter food name and calories");
        return;
    }

    const calories = parseInt(caloriesVal);
    ensureDay(currentDate);
    allDays[currentDate].foods.push({ name, calories });
    localStorage.setItem("allDays", JSON.stringify(allDays));

    document.getElementById("foodName").value = "";
    document.getElementById("foodCalories").value = "";
    document.getElementById("searchResult").textContent = "";

    updateDisplay();
}

function deleteFood(index) {
    ensureDay(currentDate);
    allDays[currentDate].foods.splice(index, 1);
    localStorage.setItem("allDays", JSON.stringify(allDays));
    updateDisplay();
}

// ----- Food database search (USDA) -----

async function searchFood() {
    const query = document.getElementById("foodName").value.trim();
    const resultEl = document.getElementById("searchResult");

    if (!query) {
        alert("Enter a food name to search");
        return;
    }

    const apiKey = "YOUR_USDA_API_KEY_HERE"; // <-- replace with your real key

    try {
        resultEl.textContent = "Searching...";
        const res = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=1&api_key=${apiKey}`
        );
        if (!res.ok) throw new Error("API error");
        const data = await res.json();

        if (!data.foods || data.foods.length === 0) {
            resultEl.textContent = "No results found";
            return;
        }

        const food = data.foods[0];
        const energy = food.foodNutrients.find(
            n => n.nutrientName === "Energy" || n.nutrientName === "Energy, kcal"
        );

        if (!energy) {
            resultEl.textContent = "Calories not found for this item";
            return;
        }

        const calories = Math.round(energy.value);
        document.getElementById("foodCalories").value = calories;
        resultEl.textContent = `Found: ~${calories} calories (${food.description})`;
    } catch (err) {
        console.error(err);
        resultEl.textContent = "Error searching food";
    }
}

// ----- Init -----

window.onload = function () {
    applyDarkModeFromStorage();

    const dateInput = document.getElementById("dateInput");
    dateInput.value = currentDate;

    ensureDay(currentDate);
    updateDisplay();
};
