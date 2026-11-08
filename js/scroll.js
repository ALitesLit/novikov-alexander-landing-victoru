const initArticleNavigation = () => {
    const articleLinks = Array.from(document.querySelectorAll(".article-navigation-link"));

    const articleSections = articleLinks.map(( link ) => {
        const href = link.getAttribute("href");

        if (!href || !href.startsWith("#")) {
            return null;
        }

        try {
            return document.getElementById(decodeURIComponent(href.slice(1)));
        } catch {
            return null;
        }
    });

    const sections = articleSections.filter(Boolean);

    if (!sections.length) {
        return;
    }

    let scrollFrame = 0;


    const updateActiveSection = () => {
        scrollFrame = 0;

        const offset = window.innerHeight * 0.3;

        let activeSection = sections[0];

        sections.forEach(( section ) => {
            if (section.getBoundingClientRect().top <= offset) {
                activeSection = section;
            }
        });

        if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
            activeSection = sections[sections.length - 1];
        }

        articleLinks.forEach(( link, index ) => {
            const active = articleSections[index] === activeSection;

            link.classList.toggle("article-navigation-link-active", active);

            if (active) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    };


    const handleScroll = () => {
        if (!scrollFrame) {
            scrollFrame = window.requestAnimationFrame(updateActiveSection);
        }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    window.addEventListener("load", updateActiveSection);

    if (document.fonts) {
        document.fonts.ready.then(updateActiveSection);
    }

    updateActiveSection();
};

initArticleNavigation();
