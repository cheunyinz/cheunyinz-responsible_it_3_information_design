const infoBtn = document.querySelector('#info-button');
const sunburstCenter = document.querySelector('#center-content');
const popUp = document.querySelector('#sunburst-pop-up');
const figureText = document.querySelector('#figure-text');
let popUpOpen = false;




infoBtn.addEventListener('click', () => {
    popUp.classList.toggle('open');
    sunburstCenter.classList.toggle('hide');
    if (popUpOpen == false) {
        popUpOpen = true;
        figureText.textContent = 'This is how much your CO2 ussage is in real life so start deleting emails to reduce your co2 footprint!';
    } else {
        popUpOpen = false;
        figureText.textContent = 'Click me to see how much C02 it is in comparison to real life things!';

    }
});









