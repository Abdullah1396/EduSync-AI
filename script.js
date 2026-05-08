let points = 450;
let balance = 0.00;
let isFile = false;
let nameF = "";
const synth = window.speechSynthesis;
let completedTasks = { pod: false, map: false, flash: false, quiz: false };

const flashcardsData = [
    { q: "ما هي المهمة الأساسية لـ EduSync؟", a: "مزامنة المنهج مع قدرات الطالب باستخدام الذكاء الاصطناعي." },
    { q: "كيف يتم ضمان ملكية المحتوى؟", a: "عن طريق تسجيل هاش الملف على البلوكشين." },
    { q: "ما هي عملة المنصة؟", a: "عملة $SYNC الرقمية." }
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

function startPodcast() {
    if(!isFile) return alert("ارفع ملف أولاً!");
    alert('جاري توليد البودكاست التعليمي...');
    setTimeout(() => { markTaskDone('pod'); }, 1500);
}

function speak(text) {
    if (synth.speaking) synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ar-SA';
    utter.rate = 0.9;
    synth.speak(utter);
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
    recognition.onstart = () => { btn.classList.add('voice-active'); speak("أنا أسمعك، تفضل؟"); };
    recognition.onresult = (event) => { processVoiceCommand(event.results[0][0].transcript); };
    recognition.onend = () => { btn.classList.remove('voice-active'); };
    recognition.start();
}

function processVoiceCommand(cmd) {
    if (cmd.includes("طالب")) { showSection('student'); speak("بوابة الطالب"); }
    else if (cmd.includes("اختبار")) { runAI('quiz'); }
    else { speak("كرر الطلب من فضلك"); }
}

function updateClaimButton() {
    const btn = document.getElementById('claimBtn');
    const icon = document.getElementById('claimIcon');
    if (points >= 1000) { btn.classList.add('ready'); icon.className = 'fa-solid fa-unlock-keyhole'; } 
    else { btn.classList.remove('ready'); icon.className = 'fa-solid fa-lock'; }
}

function awardPoints(amount, el) {
    if(el.classList.contains('used')) return;
    el.style.backgroundColor = '#10b981';
    el.classList.add('used');
    points += amount;
    document.getElementById('studentPoints').innerText = points;
    markTaskDone('quiz');
    updateClaimButton();
    if(points >= 1000) speak("يمكنك الآن سحب العملات");
}

function mintFromSidebar() {
    if (points < 1000) return;
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
                <div class="tx-id"><i class="fa-solid fa-arrow-right-arrow-left" style="color:var(--primary);"></i> ${txId}</div>
                <div class="tx-amount">+10.0 SYNC</div>
            `;
            txList.prepend(newItem);
            btn.innerHTML = '<i class="fa-solid fa-square-check"></i> تمت المهمة';
            btn.style.background = "var(--success)";
            speak("تمت العملية بنجاح");

            setTimeout(() => {
                btn.disabled = false;
                btn.style.background = "";
                btn.innerHTML = '<i class="fa-solid fa-lock" id="claimIcon"></i> Claim (1000 pts)';
                updateClaimButton();
            }, 2500);
        }, 2000);
    }, 1000);
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
    ctx.strokeStyle = "rgba(34, 211, 238, 0.4)";
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

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('sidebar').classList.remove('active');
}

function handleFile(input) {
    if(input.files[0]) {
        isFile = true; nameF = input.files[0].name.split('.')[0];
        document.getElementById('upStatus').innerHTML = "✅ " + input.files[0].name;
        document.getElementById('mapTitle').innerText = nameF;
        document.getElementById('quizTitle').innerText = nameF;
    }
}

function handleDocUpload(input) {
    if(input.files[0]) document.getElementById('docUpStatus').innerHTML = "✅ " + input.files[0].name;
}

function runAI(type) {
    if(!isFile) return alert("ارفع ملف أولاً!");
    document.getElementById('aiLoading').style.display = 'block';
    document.getElementById('mapRes').style.display = 'none';
    document.getElementById('quizRes').style.display = 'none';
    document.getElementById('flashRes').style.display = 'none';

    setTimeout(() => {
        document.getElementById('aiLoading').style.display = 'none';
        if(type === 'map') {
            document.getElementById('mapRes').style.display = 'block';
            markTaskDone('map');
        }
        if(type === 'quiz') document.getElementById('quizRes').style.display = 'block';
        if(type === 'flash') {
            document.getElementById('flashRes').style.display = 'block';
            document.getElementById('flashQ').innerText = flashcardsData[0].q;
            document.getElementById('flashA').innerText = flashcardsData[0].a;
            markTaskDone('flash');
        }
    }, 1200);
}

function openModal(id) {
    const contents = { 
        privacy: `<h3>الخصوصية 🔒</h3><p style="font-size:0.85rem; color:#94a3b8; margin-top:10px;">نحن نستخدم تقنيات التشفير والبلوكشين لضمان حماية بياناتك التعليمية وملكيتك الفكرية بالكامل.</p>`, 
        guide: `<h3>إرشادات 📖</h3><p style="font-size:0.85rem; color:#94a3b8; margin-top:10px;">ارفع منهجك، ابدأ الاختبارات الذكية، اجمع نقاط $SYNC، وقم بتحويلها إلى عملات رقمية في محفظتك.</p>`, 
        contact: `<h3>تواصل معنا 📞</h3><div style="text-align:center; margin-top:15px;"><p style="font-size:0.9rem; margin-bottom:10px;">للاستفسارات والشراكات:</p><div style="color:var(--primary); font-weight:bold; margin-bottom:15px; font-size:1.1rem;">support@edusync.ai</div><div style="display:flex; justify-content:center; gap:25px; font-size:1.8rem;"><i class="fa-brands fa-x-twitter"></i><i class="fa-brands fa-linkedin" style="color:#0a66c2;"></i><i class="fa-solid fa-envelope" style="color:var(--primary);"></i></div></div>`,
        league: `<div style="text-align:center;"><i class="fa-solid fa-trophy" style="font-size:3rem; color:var(--gold); margin-bottom:15px;"></i><h3 style="color:var(--gold);">الدوري الماسي</h3><p style="font-size:0.8rem; color:#94a3b8; margin-bottom:20px;">أنت ضمن أفضل 5% من طلاب الجامعة هذا الأسبوع!</p><div style="text-align:right; background:rgba(255,255,255,0.05); border-radius:10px; padding:10px;"><div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid var(--line); color:var(--gold);"><span>1. أحمد محمد</span> <span>2450 pts</span></div><div style="display:flex; justify-content:space-between; padding:8px; border-bottom:1px solid var(--line); background:rgba(34, 211, 238, 0.1);"><span>2. أنت (مشارك)</span> <span>1850 pts</span></div><div style="display:flex; justify-content:space-between; padding:8px;"><span>3. سارة خالد</span> <span>1200 pts</span></div></div></div>`
    };
    document.getElementById('modalBody').innerHTML = contents[id];
    document.getElementById('infoModal').style.display = 'flex';
}
