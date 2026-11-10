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

    const photo = section.querySelector(".main-photo img");

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let photoRequest = 0;
    let photoTransition;
    let previousPhoto;


    const changePhoto = async ( slide ) => {
        const request = ++photoRequest;

        if (!photo || !slide?.dataset.image) {
            return;
        }

        const nextPhoto = new Image();

        nextPhoto.src = slide.dataset.image;

        if (photo.src === nextPhoto.src) {
            photo.alt = slide.dataset.imageAlt || "";
            return;
        }

        try {
            await nextPhoto.decode();
        } catch {
            return;
        }

        if (request !== photoRequest) {
            return;
        }

        photoTransition?.cancel();
        previousPhoto?.remove();

        if (!reducedMotion) {
            previousPhoto = photo.cloneNode();
            previousPhoto.alt = "";
            previousPhoto.setAttribute("aria-hidden", "true");
            photo.after(previousPhoto);
        }

        photo.src = nextPhoto.src;
        photo.alt = slide.dataset.imageAlt || "";

        if (!reducedMotion) {
            const outgoingPhoto = previousPhoto;

            photoTransition = outgoingPhoto.animate([
                { opacity: 1 },
                { opacity: 0 }
            ], { duration: 300, easing: "ease" });

            photoTransition.onfinish = () => outgoingPhoto.remove();
        }
    };


    const setActiveSlide = ( swiper ) => {
        const slide = slides[swiper.activeIndex];

        changePhoto(slide);

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

