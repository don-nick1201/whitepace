console.log("swiper1");
var swiper = new Swiper(".swiper", {
  slidesPerView: 'auto',
  centeredSlides: true,
  pagination: {
    el: ".swiper-pagination",
    clickable: true, // Делает пагинацию кликабельной
    },
    initialSlide: 1,
  });
console.log("swiper2");