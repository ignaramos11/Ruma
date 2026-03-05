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
