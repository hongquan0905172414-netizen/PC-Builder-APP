document.addEventListener('DOMContentLoaded', () => {


    if (typeof WOW === 'function') {
        new WOW().init();
    }


    if (document.querySelector('.partner-swiper')) {
        var swiper = new Swiper(".partner-swiper", {
            slidesPerView: 2,
            spaceBetween: 30,
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false,
            },
            breakpoints: {
                500: { slidesPerView: 3, spaceBetween: 30 },
                768: { slidesPerView: 4, spaceBetween: 40 },
                1024: { slidesPerView: 5, spaceBetween: 50 },
            }
        });
    }

    const trigger = document.querySelectorAll('.offcanvaTragger');
    const closeBtn = document.querySelector('.offcanvaClose');
    const menu = document.querySelector('.offcanva');
    const overlay = document.querySelector('.offcanva-overlay');

    function toggleMenu() {

        if (menu.classList.contains('-right-full')) {
            menu.classList.remove('-right-full');
            menu.classList.add('right-0');


            overlay.classList.remove('invisible');
            overlay.classList.add('visible');
        } else {
            menu.classList.add('-right-full');
            menu.classList.remove('right-0');


            overlay.classList.add('invisible');
            overlay.classList.remove('visible');
        }
    }

    if (trigger && menu && overlay) {
        trigger.forEach(btn => btn.addEventListener('click', toggleMenu));
        if (closeBtn) closeBtn.addEventListener('click', toggleMenu);
        overlay.addEventListener('click', toggleMenu);
    }


    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const speed = 200;

        const updateCount = () => {
            const count = +counter.innerText.replace('+', '');
            const inc = target / speed;

            if (count < target) {
                counter.innerText = Math.ceil(count + inc) + "+";
                setTimeout(updateCount, 20);
            } else {
                counter.innerText = target + "+";
            }
        };
        updateCount();
    });


    const scrollUpBtn = document.getElementById('scroll-up');
    if (scrollUpBtn) {
        scrollUpBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});