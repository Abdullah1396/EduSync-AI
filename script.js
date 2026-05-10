
let points = 450;
let balance = 0.00;
let isFile = false;
let nameF = "";
const synth = window.speechSynthesis;
let completedTasks = { pod: false, map: false, flash: false, quiz: false };

const flashcardsData = [
    { q: "ما هي المهمة الأساسية لـ EduSync؟", a: "مزامنة المنهج مع قدرات الطالب باستخدام الذكاء الاصطناعي." },
    { q: "كيف يتم ضمان ملكية المحتوى؟", a: "عن طريق تسجيل هاش الملف على البلوكشين." },
    { q: "ما المقصود بـ Academic Vault؟", a: "هوية تعليمية رقمية تجمع النقاط والإنجازات والسمعة الأكاديمية." },
    { q: "ما فائدة Soulbound Badge؟", a: "توثيق إنجاز الطالب بشكل غير قابل للنقل أو التلاعب." }
];

let currentCardIndex = 0;

function updateProgress() {
    const total = 4;
    const count = Object.values(completedTasks).filter(v => v).length;
    const percentage = (count / total) * 100;

    document.getElementById('progress-text').innerText = percentage + "%";
    document.getElementById('progress-line').style.width = percentage + "%";

    if (percentage === 100) speak("تهانينا! لقد أنجزت جميع مهامك لليوم");
}

function markTaskDone(type) {
    if (!completedTasks[type]) {
        completedTasks[type] = true;
        const circle = document.getElementById('circle-' + type);
        circle.classList.add('completed');
        circle.innerHTML = '<i class="fa-solid fa-check"></i>';
        updateProgress();
    }
}

function speak(text) {
    if (synth.speaking) synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ar-SA';
    utter.rate = 0.9;
    synth.speak(utter);
}

function startPodcast() {
    if(!isFile) return alert("ارفع ملف أولاً!");

    document.getElementById('aiLoading').style.display = 'block';
    document.getElementById('loadingText').innerText = "جاري توليد البودكاست التعليمي...";

    setTimeout(() => {
        document.getElementById('aiLoading').style.display = 'none';
        markTaskDone('pod');

        points += 150;
        document.getElementById('studentPoints').innerText = points;

        saveToMemory(
            "podcast",
            "بودكاست تعليمي",
            "تم توليد بودكاست تعليمي من ملف: " + nameF
        );

        updateClaimButton();

        speak("تم توليد البودكاست التعليمي");
        alert("🎧 تم توليد بودكاست تعليمي وحفظه في Smart Review Vault");
    }, 1200);
}

function generateNextCard() {
    const container = document.querySelector('.flashcard');
    container.classList.remove('flipped');

    setTimeout(() => {
        currentCardIndex = (currentCardIndex + 1) % flashcardsData.length;
        document.getElementById('flashQ').innerText = flashcardsData[currentCardIndex].q;
        document.getElementById('flashA').innerText = flashcardsData[currentCardIndex].a;
    }, 300);
}

function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return alert("متصفحك لا يدعم التعرف على الصوت.");

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';

    const btn = document.getElementById('voiceAssistant');

    recognition.onstart = () => {
        btn.classList.add('voice-active');
        speak("أنا أسمعك، تفضل؟");
    };

    recognition.onresult = (event) => {
        processVoiceCommand(event.results[0][0].transcript);
    };

    recognition.onend = () => {
        btn.classList.remove('voice-active');
    };

    recognition.start();
}

function processVoiceCommand(cmd) {
    if (cmd.includes("طالب")) {
        showSection('student');
        speak("بوابة الطالب");
    } else if (cmd.includes("دكتور") || cmd.includes("محاضر")) {
        showSection('lecturer');
        speak("بوابة الدكتور");
    } else if (cmd.includes("إعدادات")) {
        showSection('settings');
        speak("الإعدادات");
    } else if (cmd.includes("اختبار")) {
        runAI('quiz');
    } else {
        speak("كرر الطلب من فضلك");
    }
}

function updateClaimButton() {
    const btn = document.getElementById('claimBtn');
    const xpValue = document.getElementById('xpValue');
    const repValue = document.getElementById('repValue');

    if (xpValue) xpValue.innerText = points + " XP";

    if (repValue) {
        if (points >= 1500) repValue.innerText = "Diamond";
        else if (points >= 1000) repValue.innerText = "Gold";
        else if (points >= 700) repValue.innerText = "Silver";
        else repValue.innerText = "Bronze";
    }

    if (points >= 1000) {
        btn.classList.add('ready');
        btn.innerHTML = '<i class="fa-solid fa-unlock-keyhole" id="claimIcon"></i> جاهز لتحويل المكافأة';
    } else {
        btn.classList.remove('ready');
        btn.innerHTML = '<i class="fa-solid fa-lock" id="claimIcon"></i> تحتاج 1000 نقطة';
    }
}

function awardPoints(amount, el) {
    if(el.classList.contains('used')) return;

    el.style.backgroundColor = '#10b981';
    el.classList.add('used');

    points += amount;
    document.getElementById('studentPoints').innerText = points;

    markTaskDone('quiz');
    updateClaimButton();

    if(points >= 1000) speak("يمكنك الآن تحويل النقاط إلى عملة سينك");
}

function mintFromSidebar() {
    if (points < 1000) {
        alert("تحتاج إلى 1000 نقطة على الأقل لتحويلها إلى SYNC");
        return;
    }

    const btn = document.getElementById('claimBtn');
    const balanceEl = document.getElementById('sidebarBalance');
    const pointsEl = document.getElementById('studentPoints');
    const txList = document.getElementById('txList');
    const emptyMsg = document.getElementById('emptyTx');

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحقق...';
    speak("بدء عملية التوثيق");

    setTimeout(() => {
        btn.innerHTML = '<i class="fa-solid fa-link fa-spin"></i> سك $SYNC...';

        setTimeout(() => {
            if(emptyMsg) emptyMsg.remove();

            balance = (parseFloat(balance) + 10.0).toFixed(2);
            points -= 1000;

            balanceEl.innerText = balance;
            pointsEl.innerText = points;

            const txId = '0x' + Math.random().toString(16).slice(2, 8).toUpperCase();

            const newItem = document.createElement('div');
            newItem.className = 'tx-item';
            newItem.innerHTML = `
                <div class="tx-id"><i class="fa-solid fa-link" style="color:var(--primary);"></i> ${txId}</div>
                <div class="tx-amount">+10.0 SYNC</div>
            `;

            txList.prepend(newItem);

            btn.innerHTML = '<i class="fa-solid fa-square-check"></i> تمت العملية';
            btn.style.background = "var(--success)";
            speak("تمت العملية بنجاح");

            setTimeout(() => {
                btn.disabled = false;
                btn.style.background = "";
                updateClaimButton();
            }, 1800);

        }, 1600);
    }, 800);
}

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];

function initParticles() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = [];

    const count = window.innerWidth < 600 ? 50 : 100;

    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.6,
            vy: (Math.random() - 0.5) * 0.6,
            size: Math.random() * 2 + 1
        });
    }
}

function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(34, 211, 238, 0.9)";
    ctx.strokeStyle = "rgba(34, 211, 238, 0.26)";
    ctx.lineWidth = 1;

    particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.sqrt((p.x - p2.x)**2 + (p.y - p2.y)**2);

            if (dist < 130) {
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    });

    requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', initParticles);
initParticles();
drawParticles();

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('active');
}

function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('sidebar').classList.remove('active');
}

function handleFile(input) {
    if(input.files[0]) {
        isFile = true;
        nameF = input.files[0].name.split('.')[0];

        document.getElementById('upStatus').innerHTML = "✅ " + input.files[0].name;
        document.getElementById('mapTitle').innerText = nameF;
        document.getElementById('quizTitle').innerText = nameF;

        const coach = document.getElementById('aiCoachText');
        if (coach) {
            coach.innerText = "تم تحليل المصدر مبدئيًا. ابدأ الآن بتوليد أدوات التعلم، وكل إنجاز سيزيد من نقاطك وهويتك التعليمية الموثقة.";
        }

        points += 50;
        document.getElementById('studentPoints').innerText = points;
        updateClaimButton();
    }
}

function handleDocUpload(input) {
    if(input.files[0]) {
        document.getElementById('docUpStatus').innerHTML = "✅ " + input.files[0].name + "<br><span style='font-size:0.65rem;color:#10b981;'>تم توليد SHA-256 Hash تجريبي وتوثيقه</span>";
        alert("تم رفع المرجع الرسمي وتوليد بصمة رقمية تجريبية");
    }
}

function saveToMemory(type, title, description) {
    let memory = JSON.parse(localStorage.getItem('edusyncMemory')) || [];

    const item = {
        type: type,
        title: title,
        description: description,
        date: new Date().toLocaleDateString('ar-SA'),
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
    };

    memory.unshift(item);

    if (memory.length > 8) memory = memory.slice(0, 8);

    localStorage.setItem('edusyncMemory', JSON.stringify(memory));
}

function runAI(type) {
    if(!isFile) return alert("ارفع ملف أولاً!");

    document.getElementById('aiLoading').style.display = 'block';
    document.getElementById('mapRes').style.display = 'none';
    document.getElementById('quizRes').style.display = 'none';
    document.getElementById('flashRes').style.display = 'none';

    const loadingText = document.getElementById('loadingText');

    if(type === 'map') loadingText.innerText = "جاري بناء الخريطة الذهنية...";
    if(type === 'quiz') loadingText.innerText = "جاري توليد الاختبار الذكي...";
    if(type === 'flash') loadingText.innerText = "جاري إنشاء البطاقات التعليمية...";

    setTimeout(() => {
        document.getElementById('aiLoading').style.display = 'none';

        if(type === 'map') {
            document.getElementById('mapRes').style.display = 'block';
            markTaskDone('map');
            points += 120;

            saveToMemory(
                "map",
                "خريطة ذهنية",
                "تم إنشاء خريطة ذهنية من ملف: " + nameF
            );
        }

        if(type === 'quiz') {
            document.getElementById('quizRes').style.display = 'block';

            saveToMemory(
                "quiz",
                "اختبار ذكي",
                "تم إنشاء اختبار ذكي لمراجعة ملف: " + nameF
            );
        }

        if(type === 'flash') {
            document.getElementById('flashRes').style.display = 'block';
            document.getElementById('flashQ').innerText = flashcardsData[0].q;
            document.getElementById('flashA').innerText = flashcardsData[0].a;
            markTaskDone('flash');
            points += 120;

            saveToMemory(
                "flash",
                "بطاقات تعليمية",
                "تم إنشاء بطاقات تعليمية من ملف: " + nameF
            );
        }

        document.getElementById('studentPoints').innerText = points;
        updateClaimButton();

    }, 1200);
}

function openModal(id) {
    const contents = {
        privacy: `<h3>الخصوصية 🔒</h3><p style="font-size:0.85rem; color:#94a3b8; margin-top:10px;">نحن نستخدم تقنيات التشفير والبلوكشين لضمان حماية بياناتك التعليمية وملكيتك الفكرية بالكامل.</p>`,
        guide: `<h3>إرشادات 📖</h3><p style="font-size:0.85rem; color:#94a3b8; margin-top:10px;">ارفع منهجك، ابدأ الاختبارات الذكية، اجمع نقاط XP، وقم بتحويلها إلى عملات SYNC داخل Academic Vault.</p>`,
        contact: `<h3>تواصل معنا 📞</h3><div style="text-align:center; margin-top:15px;"><p style="font-size:0.9rem; margin-bottom:10px;">للاستفسارات والشراكات:</p><div style="color:var(--primary); font-weight:bold; margin-bottom:15px; font-size:1.1rem;">support@edusync.ai</div><div style="display:flex; justify-content:center; gap:25px; font-size:1.8rem;"><i class="fa-brands fa-x-twitter"></i><i class="fa-brands fa-linkedin" style="color:#0a66c2;"></i><i class="fa-solid fa-envelope" style="color:var(--primary);"></i></div></div>`,
        league: `<div style="text-align:center;"><i class="fa-solid fa-trophy" style="font-size:3rem; color:var(--gold); margin-bottom:15px;"></i><h3 style="color:var(--gold);">الدوري الماسي</h3><p style="font-size:0.8rem; color:#94a3b8; margin-bottom:20px;">أنت ضمن أفضل 5% من طلاب الجامعة هذا الأسبوع!</p><div style="text-align:right; background:rgba(255,255,255,0.05); border-radius:10px; padding:10px;"><div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid var(--line); color:var(--gold);"><span>1. أحمد محمد</span> <span>2450 pts</span></div><div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid var(--line); background:rgba(34, 211, 238, 0.1);"><span>2. أنت</span> <span>${points} pts</span></div><div style="display:flex; justify-content:space-between; padding:8px;"><span>3. سارة خالد</span> <span>1200 pts</span></div></div></div>`
    };

    document.getElementById('modalBody').innerHTML = contents[id];
    document.getElementById('infoModal').style.display = 'flex';
}

function openBadgeModal(type) {
    let title = type === 'verified' ? 'Verified Learner' : '7-Day Study Streak';
    let icon = type === 'verified' ? 'fa-certificate' : 'fa-fire';
    let desc = type === 'verified'
        ? 'هذا الإنجاز يثبت أن الطالب أكمل نشاطًا تعليميًا موثقًا داخل EduSync AI.'
        : 'هذا الإنجاز يثبت استمرار الطالب في التعلم لمدة 7 أيام متتالية.';

    const html = `
        <div style="text-align:center;">
            <div style="
                width:86px;
                height:86px;
                margin:auto;
                border-radius:50%;
                background:rgba(245,158,11,0.12);
                border:1px solid rgba(245,158,11,0.45);
                display:flex;
                align-items:center;
                justify-content:center;
                color:#f59e0b;
                font-size:2rem;
                margin-bottom:18px;
                box-shadow:0 0 30px rgba(245,158,11,0.28);
            ">
                <i class="fa-solid ${icon}"></i>
            </div>

            <h2 style="margin-bottom:8px;">${title}</h2>

            <div style="color:#10b981; font-size:0.8rem; margin-bottom:15px;">
                ● Blockchain Verified
            </div>

            <p style="font-size:0.8rem; color:#cbd5e1; line-height:1.7; margin-bottom:18px;">
                ${desc}
            </p>
        </div>

        <div style="
            background:rgba(255,255,255,0.04);
            border:1px solid rgba(255,255,255,0.08);
            border-radius:16px;
            padding:14px;
            margin-bottom:15px;
            font-size:0.78rem;
        ">
            <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                <span style="color:#94a3b8;">Type</span>
                <strong>Soulbound Badge</strong>
            </div>

            <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                <span style="color:#94a3b8;">Wallet</span>
                <strong>0x8F3A...91C</strong>
            </div>

            <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
                <span style="color:#94a3b8;">Issued</span>
                <strong>09 MAY 2026</strong>
            </div>

            <div style="display:flex;justify-content:space-between;">
                <span style="color:#94a3b8;">SHA-256</span>
                <strong>A81X9B22</strong>
            </div>
        </div>

        <button onclick="simulateChain()" style="
            width:100%;
            padding:14px;
            border:none;
            border-radius:14px;
            background:linear-gradient(135deg,#22d3ee,#0ea5e9);
            color:#001018;
            font-weight:bold;
            cursor:pointer;
            margin-bottom:10px;
        ">
            عرض التحقق على البلوكشين
        </button>

        <div id="chainStatus" style="
            display:none;
            text-align:center;
            color:#10b981;
            font-size:0.8rem;
            margin-top:10px;
        ">
            ✅ تم التحقق من البصمة التعليمية بنجاح
        </div>
    `;

    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('infoModal').style.display = 'flex';
}

function simulateChain() {
    const status = document.getElementById('chainStatus');

    if (!status) return;

    status.style.display = 'none';

    setTimeout(() => {
        status.style.display = 'block';
        speak("تم التحقق من الهوية التعليمية عبر البلوكشين");
    }, 1000);
}
function openMemoryVault() {
    const memory = JSON.parse(localStorage.getItem('edusyncMemory')) || [];

    let memoryHTML = "";

    if (memory.length === 0) {
        memoryHTML = `
            <div style="text-align:center; color:#94a3b8; font-size:0.8rem; padding:20px;">
                لا توجد مراجعات محفوظة حتى الآن.<br>
                ارفع ملفًا ثم أنشئ خريطة أو بطاقات أو اختبار.
            </div>
        `;
    } else {
        memory.forEach(item => {
            let icon = "fa-clock-rotate-left";

            if(item.type === "map") icon = "fa-diagram-project";
            if(item.type === "flash") icon = "fa-layer-group";
            if(item.type === "quiz") icon = "fa-spell-check";
            if(item.type === "podcast") icon = "fa-headphones";

            memoryHTML += `
                <div class="memory-item">
                    <h4><i class="fa-solid ${icon}"></i> ${item.title}</h4>
                    <p>${item.description}</p>
                    <span class="memory-tag">${item.date} - ${item.time}</span>
                </div>
            `;
        });
    }

    const html = `
        <div style="text-align:center; margin-bottom:18px;">
            <div style="
                width:80px;
                height:80px;
                margin:auto;
                border-radius:22px;
                background:rgba(34,211,238,0.1);
                border:1px solid rgba(34,211,238,0.35);
                display:flex;
                align-items:center;
                justify-content:center;
                color:#22d3ee;
                font-size:2rem;
                margin-bottom:14px;
                box-shadow:0 0 28px rgba(34,211,238,0.18);
            ">
                <i class="fa-solid fa-clock-rotate-left"></i>
            </div>

            <h2 style="margin-bottom:6px;">Smart Review Vault</h2>
            <p style="font-size:0.78rem; color:#94a3b8; line-height:1.7;">
                أرشيف ذكي يحفظ مراجعاتك وملخصاتك وأدوات التعلم التي أنشأتها.
            </p>
        </div>

        <div class="memory-list">
            ${memoryHTML}
        </div>

        <div style="
            background:rgba(245,158,11,0.08);
            border:1px dashed rgba(245,158,11,0.35);
            border-radius:14px;
            padding:12px;
            margin-top:14px;
            color:#fbbf24;
            font-size:0.75rem;
            line-height:1.7;
        ">
            <strong>توصية الذكاء الاصطناعي:</strong><br>
            راجع آخر أداة تعلم محفوظة، ثم أعد الاختبار القصير لرفع مستوى الإتقان.
        </div>

        <button onclick="runSmartReview()" style="
            width:100%;
            padding:14px;
            border:none;
            border-radius:14px;
            background:linear-gradient(135deg,#22d3ee,#0ea5e9);
            color:#001018;
            font-weight:bold;
            cursor:pointer;
            margin-top:15px;
        ">
            بدء مراجعة ذكية
        </button>

        <button onclick="clearMemoryVault()" style="
            width:100%;
            padding:12px;
            border:1px solid rgba(244,63,94,0.35);
            border-radius:14px;
            background:rgba(244,63,94,0.08);
            color:#f43f5e;
            font-weight:bold;
            cursor:pointer;
            margin-top:10px;
        ">
            مسح سجل المراجعات
        </button>

        <div id="reviewStatus" style="
            display:none;
            text-align:center;
            color:#10b981;
            font-size:0.8rem;
            margin-top:12px;
        ">
            ✅ تم إنشاء جلسة مراجعة مخصصة لك
        </div>
    `;

    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('infoModal').style.display = 'flex';
}

function clearMemoryVault() {
    localStorage.removeItem('edusyncMemory');
    openMemoryVault();
}

function runSmartReview() {
    const status = document.getElementById('reviewStatus');
    if (!status) return;

    status.style.display = 'none';

    setTimeout(() => {
        status.style.display = 'block';
        speak("تم إنشاء جلسة مراجعة ذكية مخصصة لك");
    }, 900);
}

function runSmartReview() {
    const status = document.getElementById('reviewStatus');
    if (!status) return;

    status.style.display = 'none';

    setTimeout(() => {
        status.style.display = 'block';
        speak("تم إنشاء جلسة مراجعة ذكية مخصصة لك");
    }, 900);
}
updateClaimButton();
    function toggleAccessibility() {

    document.body.classList.toggle("access-mode");

    if(document.body.classList.contains("access-mode")){

        speak("تم تفعيل وضع الوصول الشامل");

        alert("✅ تم تفعيل وضع الوصول الشامل لذوي الإعاقة البصرية");

    } else {

        speak("تم إيقاف وضع الوصول الشامل");

        alert("تم إيقاف وضع الوصول الشامل");

    }
}

