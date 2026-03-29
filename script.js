const DB_USER = 'fitledger_user';
const DB_STATE = 'fitledger_state';

// State definitions
let user = JSON.parse(localStorage.getItem(DB_USER));
let state = JSON.parse(localStorage.getItem(DB_STATE)) || {
    water: 0,
    meals: [],
    activities: [],
    weightHistory: [] // {date, weight}
};

// Food Database
const foodDatabase = [
    { foodName: "Idli", caloriesPer100g: 148, protein: 4, carbs: 32, fat: 0.5 },
    { foodName: "Dosa", caloriesPer100g: 168, protein: 4, carbs: 29, fat: 3.7 },
    { foodName: "Masala dosa", caloriesPer100g: 208, protein: 4, carbs: 32, fat: 6.5 },
    { foodName: "Rava dosa", caloriesPer100g: 220, protein: 5, carbs: 35, fat: 5 },
    { foodName: "Pongal", caloriesPer100g: 212, protein: 5, carbs: 28, fat: 8 },
    { foodName: "Upma", caloriesPer100g: 180, protein: 4, carbs: 25, fat: 7 },
    { foodName: "Appam", caloriesPer100g: 155, protein: 3, carbs: 31, fat: 2 },
    { foodName: "Idiyappam", caloriesPer100g: 130, protein: 3, carbs: 28, fat: 0.5 },
    { foodName: "Puttu", caloriesPer100g: 160, protein: 4, carbs: 33, fat: 1 },
    { foodName: "Sambar rice", caloriesPer100g: 130, protein: 4, carbs: 22, fat: 3 },
    { foodName: "Curd rice", caloriesPer100g: 110, protein: 3, carbs: 18, fat: 3 },
    { foodName: "Lemon rice", caloriesPer100g: 150, protein: 3, carbs: 25, fat: 4 },
    { foodName: "Coconut rice", caloriesPer100g: 180, protein: 3, carbs: 26, fat: 7 },
    { foodName: "Avial", caloriesPer100g: 120, protein: 3, carbs: 12, fat: 7 },
    { foodName: "Thoran", caloriesPer100g: 100, protein: 3, carbs: 10, fat: 5 },
    { foodName: "Fish curry", caloriesPer100g: 140, protein: 12, carbs: 5, fat: 8 },
    { foodName: "Sadya items", caloriesPer100g: 150, protein: 4, carbs: 20, fat: 5 },
    { foodName: "Chicken biriyani", caloriesPer100g: 250, protein: 12, carbs: 30, fat: 8 },
    { foodName: "Mutton biriyani", caloriesPer100g: 280, protein: 14, carbs: 28, fat: 12 },
    { foodName: "Vegetable biriyani", caloriesPer100g: 180, protein: 4, carbs: 28, fat: 5 },
    { foodName: "Malabar biriyani", caloriesPer100g: 260, protein: 12, carbs: 32, fat: 9 },
    { foodName: "Medu vada", caloriesPer100g: 290, protein: 6, carbs: 25, fat: 18 },
    { foodName: "Bajji", caloriesPer100g: 310, protein: 5, carbs: 30, fat: 19 },
    { foodName: "Pakoda", caloriesPer100g: 330, protein: 7, carbs: 35, fat: 18 },
    { foodName: "Banana chips", caloriesPer100g: 519, protein: 2, carbs: 58, fat: 33 },
    { foodName: "Payasam", caloriesPer100g: 180, protein: 4, carbs: 28, fat: 6 },
    { foodName: "Ada pradhaman", caloriesPer100g: 210, protein: 3, carbs: 38, fat: 5 },
    { foodName: "Halwa", caloriesPer100g: 320, protein: 2, carbs: 50, fat: 12 },
    { foodName: "Filter coffee", caloriesPer100g: 35, protein: 1, carbs: 6, fat: 1 },
    { foodName: "Tea", caloriesPer100g: 38, protein: 1, carbs: 8, fat: 0.5 },
    { foodName: "Tender coconut", caloriesPer100g: 19, protein: 0.7, carbs: 4.8, fat: 0.2 }
];

function saveUser(u) { localStorage.setItem(DB_USER, JSON.stringify(u)); user = u; }
function saveState() { localStorage.setItem(DB_STATE, JSON.stringify(state)); }

// Calculations
function getBMI() { return (user.weight / Math.pow(user.height / 100, 2)).toFixed(1); }
function getBMR() { 
    return Math.round(user.gender === 'male' ? 
        10 * user.weight + 6.25 * user.height - 5 * user.age + 5 : 
        10 * user.weight + 6.25 * user.height - 5 * user.age - 161);
}
function getDailyCalorieGoal() { return Math.round(getBMR() * 1.2); }
function getNutritionTotals() {
    let p=0, c=0, f=0, cal=0;
    state.meals.forEach(m => { p+=m.protein; c+=m.carbs; f+=m.fat; cal+=m.calories;});
    return {p,c,f,cal};
}
function getBurnedCalories() {
    return state.activities.reduce((acc, a) => acc + a.calories, 0);
}
function getRemainingCalories() {
    let totals = getNutritionTotals();
    return getDailyCalorieGoal() - totals.cal + getBurnedCalories();
}

// Algo for Text matching
function strDistance(a, b) {
    if(!a.length) return b.length;
    if(!b.length) return a.length;
    const dp=[];
    for(let i=0; i<=b.length; i++) dp[i] = [i];
    for(let j=0; j<=a.length; j++) dp[0][j] = j;
    for(let i=1; i<=b.length; i++) {
        for(let j=1; j<=a.length; j++) {
            dp[i][j] = b[i-1]===a[j-1] ? dp[i-1][j-1] : Math.min(dp[i-1][j-1]+1, dp[i][j-1]+1, dp[i-1][j]+1);
        }
    }
    return dp[b.length][a.length];
}

function searchDB(query) {
    if(!query) return null;
    query = query.toLowerCase().trim();
    let best = null, minD = Infinity;
    for(let f of foodDatabase) {
        let name = f.foodName.toLowerCase();
        if(name.includes(query)) return f; // Highest priority
        let d = strDistance(query, name);
        if(d < minD) { minD = d; best = f; }
    }
    return minD <= 4 ? best : null;
}

document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname.toLowerCase();
    
    // Auth Check
    if (!user && !path.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    // Active Nav Update
    document.querySelectorAll('.nav-item').forEach(link => {
        let href = link.getAttribute('href').toLowerCase();
        if (path.includes(href) || (path.endsWith('/') && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    // Handle Signout
    const btnSignout = document.getElementById('btn-signout');
    if(btnSignout) {
        btnSignout.addEventListener('click', () => {
             alert('👋 See you again! Stay healthy and keep tracking!');
             localStorage.clear();
             window.location.href = 'login.html';
        });
    }

    if(document.getElementById('loginPage')) setupLogin();
    if(document.getElementById('homePage')) setupHome();
    if(document.getElementById('mealsPage')) setupMeals();
    if(document.getElementById('summaryPage')) setupSummary();
    if(document.getElementById('goalsPage')) setupGoals();
    if(document.getElementById('progressPage')) setupProgress();
});

function setupLogin() {
    document.getElementById('loginForm').addEventListener('submit', (e) => {
        e.preventDefault();
        let u = {
            name: document.getElementById('name').value,
            age: Number(document.getElementById('age').value),
            height: Number(document.getElementById('height').value),
            weight: Number(document.getElementById('weight').value),
            gender: document.getElementById('gender').value
        };
        saveUser(u);
        if(state.weightHistory.length === 0) {
            state.weightHistory.push({ date: new Date().toLocaleDateString(), weight: u.weight });
            saveState();
        }
        window.location.href = 'index.html';
    });
}

function setupHome() {
    document.getElementById('userName').textContent = user.name;
    document.getElementById('valBmi').textContent = getBMI();
    document.getElementById('valBmr').textContent = getBMR() + ' kcal';
    document.getElementById('valGoal').textContent = getDailyCalorieGoal() + ' kcal';

    let n = getNutritionTotals();
    let burned = getBurnedCalories();
    let rem = getRemainingCalories();

    document.getElementById('valConsumed').textContent = Math.round(n.cal) + ' kcal';
    document.getElementById('valBurned').textContent = burned + ' kcal';
    document.getElementById('valRemaining').textContent = Math.round(rem) + ' kcal';

    // Water
    updateWaterUI();
    document.getElementById('btnAddWater').addEventListener('click', () => {
        state.water++;
        saveState();
        updateWaterUI();
    });

    // Add Activity
    document.getElementById('formActivity').addEventListener('submit', (e) => {
        e.preventDefault();
        let name = document.getElementById('actName').value;
        let pDuration = Number(document.getElementById('actDuration').value);
        let cals = pDuration * 6; // roughly 6 cal/min
        state.activities.push({ name, duration: pDuration, calories: cals });
        saveState();
        alert('Activity Added! Burned ' + cals + ' kcal');
        window.location.reload();
    });

    // Nutrition details
    document.getElementById('valProtein').textContent = Math.round(n.p) + 'g';
    document.getElementById('valCarbs').textContent = Math.round(n.c) + 'g';
    document.getElementById('valFat').textContent = Math.round(n.f) + 'g';

    // AI Health Logic
    let aiBox = document.getElementById('aiSuggestion');
    if(n.cal === 0) {
        aiBox.innerHTML = "Start logging your meals to get insights!";
        aiBox.className = "alert alert-warn";
    } else {
        if(n.p < 40) {
            aiBox.innerHTML = "⚠️ Protein is low! Try eggs or dal.";
            aiBox.className = "alert alert-danger";
        } else if(n.f > 70) {
            aiBox.innerHTML = "🔥 High fat intake! Reduce fried food.";
            aiBox.className = "alert alert-warn";
        } else {
            aiBox.innerHTML = "💪 Great job! Balanced diet!";
            aiBox.className = "alert alert-good";
        }
    }
}

function updateWaterUI() {
    let w = state.water;
    document.getElementById('valWaterConsumed').textContent = w;
    document.getElementById('valWaterRem').textContent = Math.max(0, 8 - w);
    let msgBox = document.getElementById('waterAlert');
    if(w < 8) {
        msgBox.innerHTML = `⚠️ Water intake is low!<br>💧 Drink ${8-w} more glasses<br>🚰 Stay hydrated!`;
        msgBox.className = "alert alert-warn";
    } else {
        msgBox.innerHTML = "💧 Great hydration level!";
        msgBox.className = "alert alert-good";
    }
}

function setupMeals() {
    let currentFood = null;

    const fillFood = (food) => {
        currentFood = food;
        document.getElementById('detectedBox').classList.remove('hidden');
        document.getElementById('detName').textContent = food.foodName;
        document.getElementById('detCal').textContent = food.caloriesPer100g + ' kcal';
        document.getElementById('detProt').textContent = food.protein + 'g';
        document.getElementById('detCarb').textContent = food.carbs + 'g';
        document.getElementById('detFat').textContent = food.fat + 'g';
    };

    document.getElementById('btnSearch').addEventListener('click', () => {
        let q = document.getElementById('foodSearch').value;
        let obj = searchDB(q);
        if(obj) fillFood(obj);
        else alert('❌ Food not found. Try again.');
    });

    document.getElementById('btnAIUpload').addEventListener('click', () => {
        let det = prompt("Simulating AI Upload...\nEnter detected food name:");
        if(det) {
            let obj = searchDB(det);
            if(obj) {
                alert("Detected: " + obj.foodName + " 🍽");
                fillFood(obj);
            } else {
                alert('❌ Food not found. Try again.');
            }
        }
    });

    document.getElementById('btnAddMeal').addEventListener('click', () => {
        if(!currentFood) return alert('Select or detect food first!');
        let g = Number(document.getElementById('foodGrams').value);
        if(!g || g <= 0) return alert('Enter valid grams');
        let cat = document.getElementById('mealCat').value;

        let cal = (currentFood.caloriesPer100g * g) / 100;
        let p = (currentFood.protein * g) / 100;
        let c = (currentFood.carbs * g) / 100;
        let f = (currentFood.fat * g) / 100;

        state.meals.push({ category: cat, name: currentFood.foodName, grams: g, calories: cal, protein: p, carbs: c, fat: f });
        saveState();
        alert('Meal added! +' + Math.round(cal) + ' kcal');
        window.location.href = 'summary.html';
    });
}

function setupSummary() {
    let n = getNutritionTotals();
    let b = getBurnedCalories();
    let r = getRemainingCalories();

    document.getElementById('sumCalCons').textContent = Math.round(n.cal) + ' kcal';
    document.getElementById('sumCalBurn').textContent = Math.round(b) + ' kcal';
    document.getElementById('sumCalRem').textContent = Math.round(r) + ' kcal';

    document.getElementById('sumProt').textContent = Math.round(n.p) + 'g';
    document.getElementById('sumCarb').textContent = Math.round(n.c) + 'g';
    document.getElementById('sumFat').textContent = Math.round(n.f) + 'g';

    let rBox = document.getElementById('recentMealsList');
    rBox.innerHTML = '';
    state.meals.slice().reverse().forEach(m => {
        let div = document.createElement('div');
        div.className = 'stat-row';
        div.innerHTML = `<span class="stat-name">${m.category}: ${m.name} (${m.grams}g)</span><span class="stat-value">${Math.round(m.calories)} kcal</span>`;
        rBox.appendChild(div);
    });
}

function setupGoals() {
    let sw = state.weightHistory.length > 0 ? state.weightHistory[0].weight : 0;
    document.getElementById('startWeight').textContent = sw + ' kg';
    document.getElementById('currWeight').textContent = user.weight + ' kg';

    let logHtml = '';
    state.weightHistory.slice().reverse().forEach(w => {
        logHtml += `<div class="stat-row"><span class="stat-name">${w.date}</span><span class="stat-value">${w.weight} kg</span></div>`;
    });
    document.getElementById('weightLog').innerHTML = logHtml;

    document.getElementById('formWeight').addEventListener('submit', (e) => {
        e.preventDefault();
        let nw = Number(document.getElementById('newWeight').value);
        if(nw) {
            user.weight = nw;
            saveUser(user);
            state.weightHistory.push({ date: new Date().toLocaleDateString(), weight: nw });
            saveState();
            window.location.reload();
        }
    });
}

function setupProgress() {
    document.getElementById('progBmi').textContent = getBMI();
    document.getElementById('progBmr').textContent = getBMR() + ' kcal';
    document.getElementById('progGoal').textContent = getDailyCalorieGoal() + ' kcal';

    let cvs = document.getElementById('chartCanvas');
    if(!cvs) return;
    let ctx = cvs.getContext('2d');
    let w = cvs.width; let h = cvs.height;
    ctx.clearRect(0,0,w,h);
    
    let hist = state.weightHistory;
    if(hist.length < 2) {
        ctx.font = "14px Inter";
        ctx.fillStyle = "#666";
        ctx.fillText("Log more weight data for a graph 😊", 20, 50);
        return;
    }
    
    let wts = hist.map(e => e.weight);
    let minW = Math.min(...wts) - 2;
    let maxW = Math.max(...wts) + 2;
    let pad = 30;
    
    ctx.strokeStyle = '#2ECC71';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    hist.forEach((pt, i) => {
        let x = pad + (i / (hist.length-1)) * (w - 2*pad);
        let y = h - pad - ((pt.weight - minW) / (maxW - minW)) * (h - 2*pad);
        if(i===0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#27AE60';
    hist.forEach((pt, i) => {
        let x = pad + (i / (hist.length-1)) * (w - 2*pad);
        let y = h - pad - ((pt.weight - minW) / (maxW - minW)) * (h - 2*pad);
        ctx.beginPath();
        ctx.arc(x,y, 4, 0, Math.PI*2);
        ctx.fill();
        ctx.font = "12px Inter";
        ctx.fillText(pt.weight + 'kg', x-12, y-10);
    });
}
