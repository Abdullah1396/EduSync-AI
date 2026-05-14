const GEMINI_API_KEY = "AIzaSyBcnQi6-7qlhcK7p_NsWRDrH_3D-rEHGPQ";

let points = parseInt(localStorage.getItem("xp") || "450");
let balance = parseFloat(localStorage.getItem("sync") || "0");
let isFile = !!localStorage.getItem("studentFileName");
let nameF = localStorage.getItem("studentFileName") || "";
const synth = window.speechSynthesis;

let completedTasks = { pod:false, map:false, flash:false, quiz:false };
let currentCardIndex = 0;
let currentQuizQuestions = [];

const flashcardsData = [
    { q:"ما هي المهمة الأساسية لـ EduSync؟", a:"مزامنة المنهج مع قدرات الطالب باستخدام الذكاء الاصطناعي." },
    { q:"كيف يتم ضمان ملكية المحتوى؟", a:"عن طريق تسجيل هاش الملف على البلوكشين." },
    { q:"ما المقصود بـ Academic Vault؟", a:"هوية تعليمية رقمية تجمع النقاط والإنجازات والسمعة الأكاديمية." },
    { q:"ما فائدة Soulbound Badge؟", a:"توثيق إنجاز الطالب بشكل غير قابل للنقل أو التلاعب." }
];

function el(id){ return document.getElementById(id); }

function speak(text){
    if(!synth) return;
    if(synth.speaking) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ar-SA";
    u.rate = 0.9;
    synth.speak(u);
}

function saveVault(){
    localStorage.setItem("xp", points);
    localStorage.setItem("sync", balance);
}

function updateAllXP(){
    localStorage.setItem("xp", points);

    const studentPoints = el("studentPoints");
    if(studentPoints) studentPoints.innerText = points;

    document.querySelectorAll(".xpValue").forEach(x => x.innerText = points);

    const xpValue = el("xpValue");
    if(xpValue) xpValue.innerText = points + " XP";

    updateClaimButton();
    checkMint();
}

function addXP(amount){
    points = parseInt(localStorage.getItem("xp") || points || "0");
    points += amount;
    saveVault();
    updateAllXP();
}

function updateProgress(){
    const total = 4;
    const done = Object.values(completedTasks).filter(Boolean).length;
    const percent = Math.round((done / total) * 100);

    if(el("progress-text")) el("progress-text").innerText = percent + "%";
    if(el("progress-line")) el("progress-line").style.width = percent + "%";
}

function markTaskDone(type){
    if(completedTasks[type]) return;

    completedTasks[type] = true;

    const circle = el("circle-" + type);
    if(circle){
        circle.classList.add("completed");
        circle.innerHTML = '<i class="fa-solid fa-check"></i>';
    }

    updateProgress();
}

function updateClaimButton(){
    const btn = el("claimBtn");
    if(!btn) return;

    if(points >= 1000){
        btn.classList.add("ready");
        btn.innerHTML = '<i class="fa-solid fa-unlock-keyhole"></i> جاهز لتحويل المكافأة';
    } else {
        btn.classList.remove("ready");
        btn.innerHTML = '<i class="fa-solid fa-lock"></i> تحتاج 1000 نقطة';
    }
}

function checkMint(){
    const mintBtn = el("mintBtn");
    if(!mintBtn) return;

    if(points >= 1000){
        mintBtn.disabled = false;
        mintBtn.innerHTML = "⚡ سك 1 SYNC";
        mintBtn.style.background = "#10b981";
        mintBtn.style.color = "#fff";
    } else {
        mintBtn.disabled = true;
        mintBtn.innerHTML = "🔒 تحتاج 1000 XP لعملية السك";
    }
}

function handleFile(input){
    if(!input || !input.files || !input.files[0]){
        alert("لم يتم اختيار ملف");
        return;
    }

    const file = input.files[0];

    isFile = true;
    nameF = file.name.replace(/\.[^/.]+$/, "");

    localStorage.setItem("studentFileName", file.name);
    localStorage.setItem("uploadedCourseFile", file.name);

    if(el("upStatus")) el("upStatus").innerHTML = "✅ تم تحميل: " + file.name;
    if(el("mapTitle")) el("mapTitle").innerText = nameF;
    if(el("quizTitle")) el("quizTitle").innerText = nameF;

    if(el("aiCoachText")){
        el("aiCoachText").innerText = "تم تحميل المنهج بنجاح. يمكنك الآن توليد بودكاست، بطاقات، خرائط ذهنية واختبار ذكي.";
    }

    addXP(50);
    alert("✅ تم تحميل مصدر المنهج بنجاح");
}

function ensureFile(){
    if(!isFile && !localStorage.getItem("studentFileName")){
        alert("ارفع ملف أولاً!");
        return false;
    }
    return true;
}

function startPodcast(){
    if(!ensureFile()) return;

    if(el("aiLoading")) el("aiLoading").style.display = "block";
    if(el("loadingText")) el("loadingText").innerText = "جاري توليد البودكاست التعليمي...";

    setTimeout(() => {
        if(el("aiLoading")) el("aiLoading").style.display = "none";

        markTaskDone("pod");
        addXP(150);
        saveToMemory("podcast", "بودكاست تعليمي", "تم توليد بودكاست من ملف: " + nameF);

        alert("🎧 تم توليد بودكاست تعليمي بنجاح");
    }, 900);
}

function runAI(type){
    if(!ensureFile()) return;

    if(type === "map"){
        if(el("aiLoading")) el("aiLoading").style.display = "block";
        if(el("loadingText")) el("loadingText").innerText = "جاري بناء الخريطة الذهنية...";

        setTimeout(() => {
            if(el("aiLoading")) el("aiLoading").style.display = "none";
            if(el("mapRes")) el("mapRes").style.display = "block";

            markTaskDone("map");
            addXP(120);
            saveToMemory("map", "خريطة ذهنية", "تم إنشاء خريطة ذهنية من ملف: " + nameF);
        }, 900);
    }

    if(type === "quiz") generateRealQuiz();
    if(type === "flash") generateRealFlashcards();
}

async function callGemini(promptText){
    try{
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
            {
                method:"POST",
                headers:{
                    "Content-Type":"application/json",
                    "x-goog-api-key": GEMINI_API_KEY
                },
                body:JSON.stringify({
                    contents:[{ parts:[{ text:promptText }] }]
                })
            }
        );

        const data = await response.json();

        if(!response.ok) throw new Error(data.error?.message || "Gemini Error");

        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch(e){
        console.error(e);
        return "";
    }
}

async function generateRealFlashcards(){
    if(!ensureFile()) return;

    if(el("aiLoading")) el("aiLoading").style.display = "block";
    if(el("loadingText")) el("loadingText").innerText = "جاري إنشاء بطاقات تعليمية...";

    const result = await callGemini(`
أنشئ 5 بطاقات تعليمية قصيرة باللغة العربية عن ${nameF}.
أعد JSON فقط:
[
 {"question":"سؤال","answer":"إجابة"}
]
`);

    let cards;

    try{
        cards = JSON.parse(result.replace(/```json|```/g,"").trim());
    } catch{
        cards = [
            {question:"ما الفكرة الأساسية في EduSync AI؟", answer:"تحويل المنهج إلى تجربة تعلم تفاعلية ذكية."},
            {question:"ما فائدة XP؟", answer:"تحفيز الطالب على الاستمرار وإنجاز المهام."},
            {question:"ما فائدة البطاقات؟", answer:"مراجعة سريعة ومركزة للمفاهيم."},
            {question:"ما معنى التوثيق الرقمي؟", answer:"حفظ إنجازات الطالب وبصمتها التعليمية."}
        ];
    }

    if(el("aiLoading")) el("aiLoading").style.display = "none";

    const flashRes = el("flashRes");
    if(!flashRes) return;

    flashRes.style.display = "block";
    flashRes.innerHTML = `
        <h4 style="color:var(--primary); margin-bottom:15px;">بطاقات مراجعة ذكية</h4>
        <div style="display:grid; gap:14px;">
            ${cards.map((card,i)=>`
                <div class="smart-flash-card" onclick="this.classList.toggle('flipped')">
                    <div class="smart-card-inner">
                        <div class="smart-card-front">
                            <small>بطاقة ${i+1}</small>
                            <h3>${card.question}</h3>
                            <p>اضغط لعرض الإجابة</p>
                        </div>
                        <div class="smart-card-back">
                            <small>الإجابة</small>
                            <h3>${card.answer}</h3>
                        </div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;

    markTaskDone("flash");
    addXP(120);
    saveToMemory("flash", "بطاقات تعليمية", "تم إنشاء بطاقات من ملف: " + nameF);
}

async function generateRealQuiz(){
    if(!ensureFile()) return;

    if(el("aiLoading")) el("aiLoading").style.display = "block";
    if(el("loadingText")) el("loadingText").innerText = "جاري توليد اختبار ذكي...";

    const result = await callGemini(`
أنشئ 3 أسئلة اختيار من متعدد باللغة العربية عن ${nameF}.
أعد JSON فقط:
[
 {"question":"السؤال","options":["أ","ب","ج"],"correct":0,"explanation":"تفسير قصير"}
]
`);

    try{
        currentQuizQuestions = JSON.parse(result.replace(/```json|```/g,"").trim());
    } catch{
        currentQuizQuestions = [
            {
                question:"ما الهدف الأساسي من EduSync AI؟",
                options:["تحويل التعلم إلى تجربة تفاعلية","عرض ملفات فقط","إلغاء دور المحاضر"],
                correct:0,
                explanation:"المنصة تحول المحتوى إلى أدوات تعلم تفاعلية ومحفزة."
            },
            {
                question:"ما فائدة نظام XP؟",
                options:["زيادة حجم الملفات","تحفيز الطالب على الاستمرار","إغلاق المنصة"],
                correct:1,
                explanation:"XP يحفز السلوك التعليمي ويزيد الاستمرارية."
            },
            {
                question:"لماذا نستخدم التوثيق الرقمي؟",
                options:["لتوثيق الإنجازات","لتغيير الألوان","لتقليل سرعة التطبيق"],
                correct:0,
                explanation:"التوثيق الرقمي يحفظ إنجازات الطالب."
            }
        ];
    }

    if(el("aiLoading")) el("aiLoading").style.display = "none";

    renderInteractiveQuiz();
    markTaskDone("quiz");
    saveToMemory("quiz", "اختبار ذكي", "تم إنشاء اختبار من ملف: " + nameF);
}

function renderInteractiveQuiz(){
    const quizRes = el("quizRes");
    if(!quizRes) return;

    quizRes.style.display = "block";
    quizRes.innerHTML = `
        <h4 style="color:var(--primary); margin-bottom:15px;">اختبار ذكي تفاعلي</h4>
        <div class="smart-quiz-list">
            ${currentQuizQuestions.map((q,qIndex)=>`
                <div class="smart-quiz-card">
                    <div class="quiz-question">
                        <small>سؤال ${qIndex+1}</small>
                        <h3>${q.question}</h3>
                    </div>
                    <div class="quiz-options">
                        ${q.options.map((op,i)=>`
                            <button onclick="checkQuizAnswer(this,${qIndex},${i})">${op}</button>
                        `).join("")}
                    </div>
                    <div class="quiz-feedback" id="quizFeedback${qIndex}"></div>
                </div>
            `).join("")}
        </div>
    `;
}

function checkQuizAnswer(btn,qIndex,selectedIndex){
    const q = currentQuizQuestions[qIndex];
    const feedback = el("quizFeedback" + qIndex);
    const buttons = btn.parentElement.querySelectorAll("button");

    buttons.forEach(b => b.disabled = true);

    if(selectedIndex === q.correct){
        btn.classList.add("correct");
        if(feedback){
            feedback.innerHTML = `<div class="feedback-correct">✅ إجابة صحيحة<p>${q.explanation}</p></div>`;
        }
        addXP(50);
    } else {
        btn.classList.add("wrong");
        buttons[q.correct].classList.add("correct");
        if(feedback){
            feedback.innerHTML = `<div class="feedback-wrong">❌ إجابة غير صحيحة<p>الإجابة الصحيحة: <strong>${q.options[q.correct]}</strong></p><p>${q.explanation}</p></div>`;
        }
    }
}

function saveToMemory(type,title,description){
    let memory = JSON.parse(localStorage.getItem("edusyncMemory") || "[]");

    memory.unshift({
        type,
        title,
        description,
        date:new Date().toLocaleDateString("ar-SA"),
        time:new Date().toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"})
    });

    memory = memory.slice(0,8);
    localStorage.setItem("edusyncMemory", JSON.stringify(memory));
}

function openMemoryVault(){
    const memory = JSON.parse(localStorage.getItem("edusyncMemory") || "[]");

    let html = `<h2>Smart Review Vault</h2>`;

    if(memory.length === 0){
        html += `<p style="color:#94a3b8;">لا توجد مراجعات محفوظة حتى الآن.</p>`;
    } else {
        html += memory.map(item=>`
            <div class="memory-item">
                <h4>${item.title}</h4>
                <p>${item.description}</p>
                <span class="memory-tag">${item.date} - ${item.time}</span>
            </div>
        `).join("");
    }

    html += `<button onclick="runSmartReview()" style="width:100%;padding:14px;border-radius:14px;margin-top:15px;">بدء مراجعة ذكية</button>
             <div id="reviewStatus" style="display:none;color:#10b981;margin-top:12px;">✅ تم إنشاء جلسة مراجعة مخصصة لك</div>`;

    if(el("modalBody")) el("modalBody").innerHTML = html;
    if(el("infoModal")) el("infoModal").style.display = "flex";
}

function runSmartReview(){
    const status = el("reviewStatus");
    if(status) status.style.display = "block";
}

function clearMemoryVault(){
    localStorage.removeItem("edusyncMemory");
    openMemoryVault();
}

function giveBoost(btn, boostId){
    let usedBoosts = JSON.parse(localStorage.getItem("usedBoosts") || "[]");

    if(usedBoosts.includes(boostId)){
        alert("لقد دعمت هذا الإنجاز مسبقًا");
        return;
    }

    usedBoosts.push(boostId);
    localStorage.setItem("usedBoosts", JSON.stringify(usedBoosts));

    const card = btn.closest(".boost-card");
    const count = card?.querySelector(".boost-count");

    if(count) count.innerText = parseInt(count.innerText) + 1;

    btn.classList.add("used");
    btn.innerHTML = '<i class="fa-solid fa-check"></i> تم الدعم';

    const notice = el("boostNotice");
    if(notice){
        notice.style.display = "flex";
        setTimeout(()=> notice.style.display = "none", 3500);
    }

    addXP(10);
}

function mintSYNC(){
    if(points < 1000){
        alert("تحتاج 1000 XP للسك");
        return;
    }

    points -= 1000;
    balance = parseFloat(balance || 0) + 1;

    localStorage.setItem("sync", balance);
    localStorage.setItem("lastTx", JSON.stringify({
        tx:"0x" + Math.random().toString(16).slice(2,10).toUpperCase(),
        hash:"EDU-" + Math.random().toString(36).slice(2,12).toUpperCase(),
        date:new Date().toLocaleString("ar-SA")
    }));

    saveVault();
    updateAllXP();

    alert("تم سك 1 SYNC وتوثيق العملية");
}

function mintFromSidebar(){
    mintSYNC();
}

function awardPoints(amount, element){
    if(element && element.classList.contains("used")) return;

    if(element){
        element.classList.add("used");
        element.style.backgroundColor = "#10b981";
    }

    addXP(amount);
    markTaskDone("quiz");
}

function openModal(id){
    const data = {
        privacy:"<h3>الخصوصية 🔒</h3><p>نستخدم التشفير والتوثيق الرقمي لحماية بياناتك.</p>",
        guide:"<h3>إرشادات 📖</h3><p>ارفع منهجك، أنشئ أدوات تعلم، اجمع XP، ثم وثّق إنجازك.</p>",
        contact:"<h3>تواصل معنا 📞</h3><p>support@edusync.ai</p>",
        league:`<h3>الدوري الماسي 🏆</h3><p>أنت ضمن أفضل الطلاب هذا الأسبوع.</p>`
    };

    if(el("modalBody")) el("modalBody").innerHTML = data[id] || "";
    if(el("infoModal")) el("infoModal").style.display = "flex";
}

function openBadgeModal(type){
    openModal("league");
}

function simulateChain(){
    alert("✅ تم التحقق من البصمة التعليمية بنجاح");
}

function toggleAccessibility(){
    document.body.classList.toggle("access-mode");
}

function toggleSidebar(){
    const side = el("sidebar");
    if(side) side.classList.toggle("active");
}

function showSection(id){
    document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
    if(el(id)) el(id).classList.add("active");
}

function handleDocUpload(input){
    if(input.files && input.files[0]){
        if(el("docUpStatus")) el("docUpStatus").innerHTML = "✅ " + input.files[0].name;
        alert("تم رفع المرجع وتوليد بصمة رقمية تجريبية");
    }
}

function startVoiceRecognition(){
    alert("ميزة الصوت التجريبية مفعلة");
}

function generateLecturerRecommendation(){
    if(el("lecturerRecommendation")){
        el("lecturerRecommendation").innerText = "يوصي EduSync AI بتوليد اختبار قصير وإرسال مراجعة مركزة للطلاب الأقل أداءً.";
    }
}

function initParticles(){
    const canvas = el("bg-canvas");
    if(!canvas) return;
}

window.addEventListener("load", () => {
    updateAllXP();

    const savedFile = localStorage.getItem("studentFileName");
    if(savedFile && el("upStatus")){
        isFile = true;
        nameF = savedFile.replace(/\.[^/.]+$/, "");
        el("upStatus").innerHTML = "✅ تم تحميل: " + savedFile;
    }
});
