let points = 450;
let balance = 0.00;
let isFile = false;

// وظائف التنقل
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('active'); }
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.getElementById('sidebar').classList.remove('active');
}

// وظيفة شراء العناصر من المتجر
function buyItem(name, price) {
    if (points >= price) {
        points -= price;
        document.getElementById('studentPoints').innerText = points;
        alert(`تم شراء ${name} بنجاح!`);
    } else {
        alert("نقاطك لا تكفي للشراء!");
    }
}

// وظيفة سحب العملات (Minting)
function mintFromSidebar() {
    if (points < 1000) return alert("تحتاج إلى 1000 نقطة للسحب!");
    balance += 10.0;
    points -= 1000;
    document.getElementById('sidebarBalance').innerText = balance.toFixed(2);
    document.getElementById('studentPoints').innerText = points;
    alert("تم تحويل النقاط إلى 10 عملات $SYNC بنجاح!");
}

// تأثير الجسيمات في الخلفية
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
function initParticles() {
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < 60; i++) {
        particles.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, vx: (Math.random()-0.5)*0.5, vy: (Math.random()-0.5)*0.5, size: 2 });
    }
}
function drawParticles() {
    ctx.clearRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = "#22d3ee";
    particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if(p.x<0 || p.x>canvas.width) p.vx*=-1;
        if(p.y<0 || p.y>canvas.height) p.vy*=-1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI*2); ctx.fill();
    });
    requestAnimationFrame(drawParticles);
}
initParticles(); drawParticles();
