function toggleSidebar() {
    document.getElementById('sidebar')
    .classList.toggle('active');
}

function showSection(id){

    document.querySelectorAll('.section')
    .forEach(sec => sec.classList.remove('active'));

    document.getElementById(id)
    .classList.add('active');

    toggleSidebar();
}

let isFile = false;

function handleFile(input){

    if(input.files[0]){

        isFile = true;

        document.getElementById('upStatus')
        .innerText = "✅ " + input.files[0].name;
    }
}

function runAI(type){

    if(!isFile){
        alert("ارفع ملف أولاً");
        return;
    }

    document.getElementById('aiLoading')
    .style.display = 'block';

    setTimeout(() => {

        document.getElementById('aiLoading')
        .style.display = 'none';

        if(type === 'map'){
            document.getElementById('mapRes')
            .style.display = 'block';
        }

        if(type === 'quiz'){
            document.getElementById('quizRes')
            .style.display = 'block';
        }

        if(type === 'flash'){
            document.getElementById('flashRes')
            .style.display = 'block';
        }

    },1500);
}

function startPodcast(){

    if(!isFile){
        alert("ارفع ملف أولاً");
        return;
    }

    alert("جاري إنشاء البودكاست...");
}

let points = 450;
let balance = 0;

function mintFromSidebar(){

    if(points < 1000){
        alert("النقاط غير كافية");
        return;
    }

    balance += 10;

    document.getElementById('sidebarBalance')
    .innerText = balance.toFixed(2);

    points -= 1000;

    document.getElementById('studentPoints')
    .innerText = points;
}

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let particles = [];

function initParticles(){

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particles = [];

    for(let i=0; i<80; i++){

        particles.push({
            x:Math.random()*canvas.width,
            y:Math.random()*canvas.height,
            vx:(Math.random()-0.5)*0.5,
            vy:(Math.random()-0.5)*0.5,
            size:Math.random()*2
        });
    }
}

function animateParticles(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    particles.forEach(p=>{

        p.x += p.vx;
        p.y += p.vy;

        if(p.x<0 || p.x>canvas.width) p.vx *= -1;
        if(p.y<0 || p.y>canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x,p.y,p.size,0,Math.PI*2);

        ctx.fillStyle = '#22d3ee';
        ctx.fill();
    });

    requestAnimationFrame(animateParticles);
}

window.addEventListener('resize',initParticles);

initParticles();
animateParticles();

function startVoiceRecognition(){

    const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

    if(!SpeechRecognition){
        alert("المتصفح لا يدعم الأوامر الصوتية");
        return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = 'ar-SA';

    recognition.onresult = function(event){

        const command =
        event.results[0][0].transcript;

        if(command.includes("طالب")){
            showSection('student');
        }

        if(command.includes("رئيسية")){
            showSection('home');
        }
    };

    recognition.start();
}
