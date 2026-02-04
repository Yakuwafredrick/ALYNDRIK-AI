const navToggle = document.getElementById("nav-toggle");
const sideNav = document.getElementById("side-nav");
const navClose = document.getElementById("nav-close");
const navOverlay = document.getElementById("nav-overlay");

function openNav() {
  sideNav.classList.add("open");
  navOverlay.classList.add("show");
}

function closeNav() {
  sideNav.classList.remove("open");
  navOverlay.classList.remove("show");
}

navToggle.addEventListener("click", openNav);
navClose.addEventListener("click", closeNav);
navOverlay.addEventListener("click", closeNav);

// 🔗 Open Tools
//document.getElementById("open-tools").onclick = () => {
  //closeNav();
  //window.open("https://chat-app-ubma.onrender.com/", "_blank");
//};

// 💬 Send Feedback
document.getElementById("send-feedback").onclick = () => {
  closeNav();
  window.location.href =
    "mailto:yakuwafredrick@gmail.com?subject=User's%20feedback%20from%20Alyndrik%20Lite";
};

// 🏥 Open Clinic dropdown
const clinicItem = document.querySelector(".clinic-item");

clinicItem.addEventListener("click", (e) => {
  e.stopPropagation();
  clinicItem.classList.toggle("open");
});

// 🩺 MUAC
document.getElementById("open-muac").onclick = (e) => {
  e.stopPropagation();
  closeNav();
  window.location.href = "Program2/MUAC Calc/index.html";
};

// ⚖️ BMI
document.getElementById("open-bmi").onclick = (e) => {
  e.stopPropagation();
  closeNav();
  window.location.href = "Program2/Health Calc/index.html";
};

//==========================================

//🛠 Open Tools
const clinicItem2 = document.querySelector(".clinic-item2");

clinicItem2.addEventListener("click", (e) => {
  e.stopPropagation();
  clinicItem2.classList.toggle("open");
});

// IMAGE
document.getElementById("open-images").onclick = (e) => {
  e.stopPropagation();
  closeNav();
  window.location.href = "Program2/gemini-chatbot - uploader/index.html";
};

// Real-time Chat
document.getElementById("open-chat").onclick = (e) => {
  e.stopPropagation();
  closeNav();
  window.location.href = "Program2/Chat/index.html";
};