// const infoIcon = document.querySelector('.info-icon');
// const openPop = document.getElementById('pop-up');
// function openPopup() {
//   openPop.classList.add('open-popup');
// }
// function closePopup() {
//   openPop.classList.remove('open-popup');
// }
// infoIcon.addEventListener('click', openPopup);
// openPop.addEventListener('click', closePopup);
const popUp = document.getElementById("popUp");
const infoIcon = document.getElementById("info-icon");





infoIcon.addEventListener("click", function() {
    this.src = "/images/illustrations/pop-up.png";
    this.classList.add("popimg");
});

var span = document.getElementsByClassName("close")[0];

span.onclick = function() {
    popUp.style.display = "none";
  }

