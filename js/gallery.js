const initGallery = () => {
    const dialog = document.createElement("dialog");
    dialog.className = "photo-gallery";
    dialog.setAttribute("aria-label", "Просмотр фотографий");
    dialog.innerHTML = `
        <button class="photo-gallery-close" type="button" aria-label="Закрыть">×</button>
        <button class="photo-gallery-prev" type="button" aria-label="Предыдущая фотография">‹</button>
        <figure class="photo-gallery-content">
            <img class="photo-gallery-image" alt="" draggable="false">
            <figcaption class="photo-gallery-caption"></figcaption>
        </figure>
        <button class="photo-gallery-next" type="button" aria-label="Следующая фотография">›</button>
    `;
    document.body.append(dialog);

    const photo = dialog.querySelector(".photo-gallery-image");
    const caption = dialog.querySelector(".photo-gallery-caption");
    const previous = dialog.querySelector(".photo-gallery-prev");
    const next = dialog.querySelector(".photo-gallery-next");

    let images = [];
    let active = 0;
    let startX = null;
    let savedOverflow = "";


    const showPhoto = ( index ) => {
        active = (index + images.length) % images.length;
        photo.src = images[active].currentSrc || images[active].src;
        photo.alt = images[active].alt;
        caption.textContent = `${active + 1} / ${images.length} — ${photo.alt}`;
        previous.hidden = images.length < 2;
        next.hidden = images.length < 2;
    };


    document.addEventListener("click", ( event ) => {
        if (!(event.target instanceof Element)) {
            return;
        }

        const button = event.target.closest(".gallery-open");

        if (!button) {
            return;
        }

        const group = button.closest(".gallery") || button;
        images = Array.from(group.querySelectorAll(".gallery-open img"));

        if (!images.length) {
            images = Array.from(button.querySelectorAll("img"));
        }

        if (!images.length) {
            return;
        }

        showPhoto(Math.max(0, images.indexOf(button.querySelector("img"))));
        savedOverflow = document.documentElement.style.overflow;
        dialog.showModal();
        document.documentElement.style.overflow = "hidden";
    });

    dialog.querySelector(".photo-gallery-close").addEventListener("click", () => dialog.close());
    previous.addEventListener("click", () => showPhoto(active - 1));
    next.addEventListener("click", () => showPhoto(active + 1));

    dialog.addEventListener("click", ( event ) => {
        if (event.target === dialog) {
            dialog.close();
        }
    });

    dialog.addEventListener("close", () => {
        document.documentElement.style.overflow = savedOverflow;
        startX = null;
    });

    dialog.addEventListener("keydown", ( event ) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            showPhoto(active + (event.key === "ArrowRight" ? 1 : -1));
        }
    });

    photo.addEventListener("pointerdown", ( event ) => {
        if (event.isPrimary && event.button === 0) {
            startX = event.clientX;
            photo.setPointerCapture(event.pointerId);
        }
    });

    photo.addEventListener("pointerup", ( event ) => {
        if (startX !== null && Math.abs(event.clientX - startX) > 50) {
            showPhoto(active + (event.clientX < startX ? 1 : -1));
        }

        startX = null;
    });

    photo.addEventListener("pointercancel", () => {
        startX = null;
    });
};

initGallery();
