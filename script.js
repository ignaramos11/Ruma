(() => {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
        const current = window.scrollY;
        const goingDown = current > lastScrollY;

        if (current < 60) {
            navbar.classList.remove("nav-hidden");
        } else if (goingDown) {
            navbar.classList.add("nav-hidden");
        } else {
            navbar.classList.remove("nav-hidden");
        }

        lastScrollY = current;
        ticking = false;
    };

    window.addEventListener("scroll", () => {
        if (!ticking) {
            window.requestAnimationFrame(onScroll);
            ticking = true;
        }
    });
})();

(() => {
    const sliders = document.querySelectorAll("[data-slider]");
    if (!sliders.length) return;

    sliders.forEach((slider) => {
        const track = slider.querySelector(".slider-track");
        const slides = Array.from(track?.querySelectorAll("img") || []);
        const prevBtn = slider.querySelector(".slider-prev");
        const nextBtn = slider.querySelector(".slider-next");
        const dotsWrap = slider.querySelector(".slider-dots");

        if (!track || slides.length < 2 || !prevBtn || !nextBtn || !dotsWrap) return;

        let currentIndex = 0;
        let touchStartX = 0;
        let touchEndX = 0;

        const dots = slides.map((_, index) => {
            const dot = document.createElement("button");
            dot.type = "button";
            dot.className = "slider-dot";
            dot.setAttribute("aria-label", `Ir a imagen ${index + 1}`);
            dot.addEventListener("click", () => goTo(index));
            dotsWrap.appendChild(dot);
            return dot;
        });

        const render = () => {
            track.style.transform = `translateX(-${currentIndex * 100}%)`;
            slider.dataset.currentIndex = String(currentIndex);
            dots.forEach((dot, index) => {
                dot.classList.toggle("is-active", index === currentIndex);
            });
        };

        const goTo = (index) => {
            currentIndex = (index + slides.length) % slides.length;
            render();
        };

        prevBtn.addEventListener("click", () => goTo(currentIndex - 1));
        nextBtn.addEventListener("click", () => goTo(currentIndex + 1));

        slider.addEventListener("touchstart", (event) => {
            touchStartX = event.changedTouches[0].clientX;
        }, { passive: true });

        slider.addEventListener("touchend", (event) => {
            touchEndX = event.changedTouches[0].clientX;
            const delta = touchEndX - touchStartX;
            if (Math.abs(delta) < 30) return;
            if (delta > 0) goTo(currentIndex - 1);
            else goTo(currentIndex + 1);
        }, { passive: true });

        render();
    });
})();

(() => {
    const modal = document.getElementById("catalogModal");
    if (!modal) return;

    const modalClose = document.getElementById("catalogModalClose");
    const modalPrev = document.getElementById("modalPrev");
    const modalNext = document.getElementById("modalNext");
    const modalMainImage = document.getElementById("modalMainImage");
    const modalImageFrame = document.getElementById("modalImageFrame");
    const modalThumbs = document.getElementById("modalThumbs");
    const modalTitle = document.getElementById("catalogModalTitle");
    const modalDesc = document.getElementById("catalogModalDesc");
    const modalDetail = document.getElementById("catalogModalDetail");

    const cards = Array.from(document.querySelectorAll(".catalog .card"));
    if (!cards.length) return;

    const products = cards.map((card) => {
        const title = card.querySelector(".card-info h3")?.textContent?.trim() || "Producto";
        const desc = card.querySelector(".card-info p")?.textContent?.trim() || "";
        const detail = card.dataset.detail || "[Agrega aquí la información detallada de este producto.]";
        const sliderImages = Array.from(card.querySelectorAll(".slider-track img"));
        const singleImage = card.querySelector(".card-img > img");
        const images = sliderImages.length ? sliderImages : (singleImage ? [singleImage] : []);

        return {
            title,
            desc,
            detail,
            images: images.map((img) => ({
                src: img.getAttribute("src") || "",
                alt: img.getAttribute("alt") || title
            }))
        };
    });

    let currentProduct = 0;
    let currentImage = 0;
    let zoomLevel = 1;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let panStartX = 0;
    let panStartY = 0;

    const resetZoom = () => {
        zoomLevel = 1;
        panX = 0;
        panY = 0;
        modalImageFrame.style.setProperty("--zoom-level", "1");
        modalImageFrame.style.setProperty("--zoom-x", "0px");
        modalImageFrame.style.setProperty("--zoom-y", "0px");
        modalImageFrame.classList.remove("zoomed");
    };

    const applyZoom = () => {
        modalImageFrame.style.setProperty("--zoom-level", String(zoomLevel));
        modalImageFrame.style.setProperty("--zoom-x", `${panX}px`);
        modalImageFrame.style.setProperty("--zoom-y", `${panY}px`);
        modalImageFrame.classList.toggle("zoomed", zoomLevel > 1);
    };

    const renderModal = () => {
        const product = products[currentProduct];
        if (!product || !product.images.length) return;

        if (currentImage < 0) currentImage = product.images.length - 1;
        if (currentImage >= product.images.length) currentImage = 0;

        const active = product.images[currentImage];
        modalMainImage.src = active.src;
        modalMainImage.alt = active.alt;
        modalTitle.textContent = product.title;
        modalDesc.textContent = product.desc;
        modalDetail.textContent = product.detail;
        resetZoom();

        modalThumbs.innerHTML = "";
        product.images.forEach((image, index) => {
            const thumbBtn = document.createElement("button");
            thumbBtn.type = "button";
            thumbBtn.className = `modal-thumb${index === currentImage ? " is-active" : ""}`;
            thumbBtn.setAttribute("aria-label", `Ver imagen ${index + 1}`);
            thumbBtn.innerHTML = `<img src="${image.src}" alt="${image.alt}">`;
            thumbBtn.addEventListener("click", () => {
                currentImage = index;
                renderModal();
            });
            modalThumbs.appendChild(thumbBtn);
        });
    };

    const openModal = (productIndex, imageIndex = 0) => {
        currentProduct = productIndex;
        currentImage = imageIndex;
        renderModal();
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
        modal.classList.remove("open");
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        resetZoom();
    };

    cards.forEach((card, productIndex) => {
        const media = card.querySelector(".card-img");
        if (!media) return;

        media.addEventListener("click", (event) => {
            if (event.target.closest(".slider-btn")) return;

            const slider = media.closest("[data-slider]");
            const startIndex = slider ? Number(slider.dataset.currentIndex || "0") : 0;
            openModal(productIndex, Number.isNaN(startIndex) ? 0 : startIndex);
        });
    });

    modalPrev?.addEventListener("click", () => {
        currentImage -= 1;
        renderModal();
    });

    modalNext?.addEventListener("click", () => {
        currentImage += 1;
        renderModal();
    });

    modalImageFrame?.addEventListener("click", () => {
        zoomLevel = zoomLevel > 1 ? 1 : 3;
        panX = 0;
        panY = 0;
        applyZoom();
    });

    modalImageFrame?.addEventListener("wheel", (event) => {
        event.preventDefault();
        const step = event.deltaY > 0 ? -0.35 : 0.35;
        zoomLevel = Math.max(1, Math.min(5, zoomLevel + step));
        if (zoomLevel === 1) {
            panX = 0;
            panY = 0;
        }
        applyZoom();
    }, { passive: false });

    modalImageFrame?.addEventListener("pointerdown", (event) => {
        if (zoomLevel <= 1) return;
        isDragging = true;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        panStartX = panX;
        panStartY = panY;
        modalImageFrame.setPointerCapture(event.pointerId);
    });

    modalImageFrame?.addEventListener("pointermove", (event) => {
        if (!isDragging || zoomLevel <= 1) return;
        const deltaX = event.clientX - dragStartX;
        const deltaY = event.clientY - dragStartY;
        panX = panStartX + deltaX;
        panY = panStartY + deltaY;
        applyZoom();
    });

    modalImageFrame?.addEventListener("pointerup", (event) => {
        isDragging = false;
        try {
            modalImageFrame.releasePointerCapture(event.pointerId);
        } catch (_) {
            // Ignore if pointer capture was not set
        }
    });

    modalImageFrame?.addEventListener("pointercancel", () => {
        isDragging = false;
    });

    modalClose?.addEventListener("click", closeModal);

    modal.addEventListener("click", (event) => {
        if (event.target === modal) closeModal();
    });

    window.addEventListener("keydown", (event) => {
        if (!modal.classList.contains("open")) return;
        if (event.key === "Escape") closeModal();
        if (event.key === "ArrowLeft") {
            currentImage -= 1;
            renderModal();
        }
        if (event.key === "ArrowRight") {
            currentImage += 1;
            renderModal();
        }
    });
})();
