const initMainSlider = () => {
    const slider = document.querySelector(".main-swiper");

    if (!slider || typeof Swiper === "undefined") {
        return;
    }

    const slides = slider.querySelectorAll(".swiper-slide");

    if (!slides.length) {
        return;
    }

    const section = slider.closest(".main-section") || slider.parentElement;

    const pagination = section.querySelector(".main-pagination");

    const dots = pagination ? pagination.querySelectorAll("button[data-slide]") : [];

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;


    const setActiveSlide = ( swiper ) => {
        dots.forEach(( button ) => {
            const active = Number(button.dataset.slide) === swiper.activeIndex;

            button.classList.toggle("main-dot-active", active);

            if (active) {
                button.setAttribute("aria-current", "true");
            } else {
                button.removeAttribute("aria-current");
            }
        });

        slides.forEach(( slide, index ) => {
            slide.setAttribute("aria-hidden", String(index !== swiper.activeIndex));
        });
    };


    const swiper = new Swiper(slider, {
        slidesPerView: 1,
        speed: reducedMotion ? 0 : 300,
        keyboard: { enabled: true, onlyInViewport: true },
        navigation: {
            prevEl: section.querySelector(".main-prev"),
            nextEl: section.querySelector(".main-next")
        },
        a11y: {
            containerMessage: "Истории памятников",
            itemRoleDescriptionMessage: "Слайд",
            slideLabelMessage: "{{index}} из {{slidesLength}}",
            prevSlideMessage: "Предыдущий слайд",
            nextSlideMessage: "Следующий слайд",
            firstSlideMessage: "Первый слайд",
            lastSlideMessage: "Последний слайд"
        },
        on: {
            init: setActiveSlide,
            slideChange: setActiveSlide
        }
    });


    if (pagination) {
        pagination.addEventListener("click", ( event ) => {
            if (!(event.target instanceof Element)) {
                return;
            }

            const button = event.target.closest("button[data-slide]");

            if (!button || !pagination.contains(button)) {
                return;
            }

            const index = Number(button.dataset.slide);

            if (Number.isInteger(index) && index >= 0 && index < slides.length) {
                swiper.slideTo(index);
            }
        });
    }
};

initMainSlider();

