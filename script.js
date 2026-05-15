const GEMINI_API_KEY = "AIzaSyBcnQi6-7qlhcK7p_NsWRDrH_3D-rEHGPQ";

let points = parseInt(localStorage.getItem("xp") || "450");
let balance = parseFloat(localStorage.getItem("sync") || "0");
let isFile = !!localStorage.getItem("studentFileName");
let nameF = localStorage.getItem("studentFileName") || "";
const synth = window.speechSynthesis;

let completedTasks = { pod:false, map:false, flash:false, quiz:false };
let currentQuizQuestions = [];

function el(id){ 
    return document.getElementById(id); 
}

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

    if(el("studentPoints")) el("studentPoints").innerText = points;
    if(el("xpValue")) el("xpValue").innerText = points + " XP";

    document.querySelectorAll(".xpValue").forEach(x => x.innerText = points);

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

/* ===================== رفع وقراءة الملف ===================== */

async function handleFile(input) {
    if (!input || !input.files || !input.files[0]) {
        alert("لم يتم اختيار ملف");
        return;
    }

    const file = input.files[0];
    isFile = true;
    nameF = file.name.replace(/\.[^/.]+$/, "");

    localStorage.setItem("studentFileName", file.name);

    if (el("upStatus")) el("upStatus").innerHTML = "⏳ جاري قراءة محتوى الملف...";

    let extractedText = "";

    try {
        if (file.type === "application/pdf") {
    extractedText = await extractPDFText(file);

    if (!extractedText || extractedText.trim().length < 50) {
        localStorage.setItem("courseContent", "");

        if (el("upStatus")) {
            el("upStatus").innerHTML = "⚠️ 
} else {
    extractedText = await file.text();
}

        extractedText = (extractedText || "").trim();

        
        localStorage.setItem("courseContent", extractedText.slice(0, 12000));

        if (el("upStatus")) {
            el("upStatus").innerHTML = "✅ تم تحميل وقراءة: " + file.name;
        }

        if (el("mapTitle")) el("mapTitle").innerText = nameF;
        if (el("quizTitle")) el("quizTitle").innerText = nameF;

        if (el("aiCoachText")) {
            el("aiCoachText").innerText = "تم قراءة محتوى المنهج بنجاح. يمكنك الآن توليد بطاقات واختبارات من نفس الملف.";
        }

        addXP(50);
        alert("✅ تم تحليل محتوى المنهج بنجاح");

    } catch (err) {
        console.error(err);
        if (el("upStatus")) el("upStatus").innerHTML = "⚠️ تم رفع الملف لكن تعذر قراءة المحتوى";
        alert("تم رفع الملف، لكن قراءة PDF فشلت. جرّب ملف PDF نصي واضح.");
    }
}

async function extractPDFText(file) {
    if (typeof pdfjsLib === "undefined") {
        alert("مكتبة قراءة PDF غير مضافة في student.html");
        return "";
    }

    const arrayBuffer = await file.arrayBuffer();

    pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let text = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(" ");
        text += pageText + "\n";
    }

    return text;
}

function ensureFile(){
    if(!isFile && !localStorage.getItem("studentFileName")){
        alert("ارفع ملف أولاً!");
        return false;
    }
    return true;
}

function getCourseContent(){
    return (localStorage.getItem("courseContent") || "").trim();
}

/* ===================== Gemini ===================== */

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

function parseGeminiJSON(result){
    if(!result) throw new Error("empty result");

    let clean = result
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    const start = clean.indexOf("[");
    const end = clean.lastIndexOf("]");

    if(start !== -1 && end !== -1){
        clean = clean.slice(start, end + 1);
    }

    return JSON.parse(clean);
}

/* ===================== الأدوات التعليمية ===================== */

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

async function generateRealFlashcards(){
    if(!ensureFile()) return;

    const courseContent = getCourseContent();

    if(!courseContent || courseContent.length < 50){
        alert("محتوى الملف غير مقروء. جرّب PDF نصي وليس صورة ممسوحة.");
        return;
    }

    if(el("aiLoading")) el("aiLoading").style.display = "block";
    if(el("loadingText")) el("loadingText").innerText = "جاري إنشاء بطاقات تعليمية من محتوى الملف...";

    const result = await callGemini(`
اعتمد فقط على محتوى المنهج التالي، ولا تخترع معلومات من خارج النص:

${courseContent}

أنشئ 5 بطاقات تعليمية قصيرة باللغة العربية من هذا المحتوى.
أعد JSON فقط بهذا الشكل:
[
 {"question":"سؤال من المحتوى","answer":"إجابة من المحتوى"}
]
`);

    let cards;

    try{
        cards = parseGeminiJSON(result);
    } catch{
        cards = makeFallbackFlashcards(courseContent);
    }

    if(el("aiLoading")) el("aiLoading").style.display = "none";

    const flashRes = el("flashRes");
    if(!flashRes) return;

    flashRes.style.display = "block";
    flashRes.innerHTML = `
        <h4 style="color:var(--primary); margin-bottom:15px;">بطاقات مراجعة من المنهج</h4>
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

    const courseContent = getCourseContent();

    if(!courseContent || courseContent.length < 50){
        alert("محتوى الملف غير مقروء. جرّب PDF نصي وليس صورة ممسوحة.");
        return;
    }

    if(el("aiLoading")) el("aiLoading").style.display = "block";
    if(el("loadingText")) el("loadingText").innerText = "جاري توليد اختبار من محتوى الملف...";

    const result = await callGemini(`
اعتمد فقط على محتوى المنهج التالي، ولا تخترع معلومات من خارج النص:

${courseContent}

أنشئ 3 أسئلة اختيار من متعدد باللغة العربية من هذا المحتوى.
أعد JSON فقط بهذا الشكل:
[
 {
   "question":"السؤال",
   "options":["الخيار الأول","الخيار الثاني","الخيار الثالث"],
   "correct":0,
   "explanation":"شرح مختصر من محتوى المنهج"
 }
]
`);

    try{
        currentQuizQuestions = parseGeminiJSON(result);
    } catch{
        currentQuizQuestions = makeFallbackQuiz(courseContent);
    }

    if(el("aiLoading")) el("aiLoading").style.display = "none";

    renderInteractiveQuiz();
    markTaskDone("quiz");
    saveToMemory("quiz", "اختبار ذكي", "تم إنشاء اختبار من ملف: " + nameF);
}

function makeFallbackFlashcards(text){
    const parts = text
        .split(/[.؟!\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 40)
        .slice(0,5);

    return parts.map((p,i) => ({
        question: "ما الفكرة الأساسية في المقطع رقم " + (i + 1) + "؟",
        answer: p
    }));
}

function makeFallbackQuiz(text){
    const parts = text
        .split(/[.؟!\n]/)
        .map(s => s.trim())
        .filter(s => s.length > 40)
        .slice(0,3);

    return parts.map((p,i) => ({
        question: "أي عبارة ترتبط بالمحتوى في المقطع رقم " + (i + 1) + "؟",
        options: [
            p.slice(0,80) + "...",
            "معلومة غير مرتبطة بالمحتوى",
            "خيار عام لا يستند إلى النص"
        ],
        correct: 0,
        explanation: p
    }));
}

function renderInteractiveQuiz(){
    const quizRes = el("quizRes");
    if(!quizRes) return;

    quizRes.style.display = "block";
    quizRes.innerHTML = `
        <h4 style="color:var(--primary); margin-bottom:15px;">اختبار ذكي من المنهج</h4>
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

/* ===================== الذاكرة والدعم والمحفظة ===================== */

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

/* ===================== نوافذ وأزرار عامة ===================== */

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
    alert("تم تفعيل / إيقاف وضع الوصول الشامل");
}

function toggleSidebar(){
    const side = el("sidebar");
    if(side) side.classList.toggle("active");
    else goWallet();
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
    alert("المساعد الصوتي التجريبي مفعّل");
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

function goHome() {
    window.location.href = location.pathname.includes("/sections/") ? "../index.html" : "index.html";
}

function goStudent() {
    window.location.href = location.pathname.includes("/sections/") ? "student.html" : "sections/student.html";
}

function goLecturer() {
    window.location.href = location.pathname.includes("/sections/") ? "lecturer.html" : "sections/lecturer.html";
}

function goWallet() {
    window.location.href = location.pathname.includes("/sections/") ? "wallet.html" : "sections/wallet.html";
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
