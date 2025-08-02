document.addEventListener('DOMContentLoaded', () => {

    // --- THEME SWITCHER ---
    const themeToggle = document.getElementById('themeToggle');
    const htmlEl = document.documentElement;

    function setTheme(theme) {
        htmlEl.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        if (themeToggle) {
            themeToggle.checked = theme === 'dark';
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('change', () => {
            setTheme(themeToggle.checked ? 'dark' : 'light');
        });
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // --- SIDEBAR LOGIC ---
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
            closeSidebar('glassSidebar');
            closeSidebar('neumorphismSidebar');
        });
    }

    // --- ANIMATE ON SCROLL ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.anim-on-scroll').forEach(el => observer.observe(el));

    // --- DROPDOWN (CLICK-BASED) LOGIC ---
    document.addEventListener('click', e => {
        const isDropdownButton = e.target.closest('.dropdown-toggle');
        
        if (!isDropdownButton && e.target.closest('.dropdown') === null) {
            document.querySelectorAll('.dropdown-content').forEach(d => d.classList.remove('show'));
            document.querySelectorAll('.dropdown-toggle').forEach(b => b.setAttribute('aria-expanded', 'false'));
        } else if (isDropdownButton) {
            const currentDropdownContent = isDropdownButton.nextElementSibling;
            const isExpanded = currentDropdownContent.classList.toggle('show');
            isDropdownButton.setAttribute('aria-expanded', isExpanded);
            document.querySelectorAll('.dropdown-content').forEach(d => {
                if (d !== currentDropdownContent) {
                    d.classList.remove('show');
                    if (d.previousElementSibling) {
                        d.previousElementSibling.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        }
    });

    // --- ACCORDION LOGIC ---
    document.querySelectorAll('.accordion-header').forEach(button => {
        button.addEventListener('click', () => {
            button.parentElement.classList.toggle('active');
        });
    });

    // --- TABS LOGIC ---
    document.querySelectorAll('.tabs').forEach(tabsContainer => {
        tabsContainer.addEventListener('click', e => {
            if (e.target.classList.contains('tab-link')) {
                const tabId = e.target.dataset.tab;
                tabsContainer.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));
                e.target.classList.add('active');
                tabsContainer.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                    if (content.id === tabId) content.classList.add('active');
                });
            }
        });
    });
    
    // --- PAGINATION LOGIC ---
    function handlePagination(paginationContainer) {
        paginationContainer.addEventListener('click', e => {
            e.preventDefault();
            const clicked = e.target.closest('a');
            if (!clicked) return;

            const links = Array.from(paginationContainer.querySelectorAll('a'));
            let currentActive = paginationContainer.querySelector('a.active');
            let currentIndex = links.indexOf(currentActive);

            if (clicked.innerHTML.includes('«')) { // Prev button
                if (currentIndex > 1) { // Stop at first number
                    links[currentIndex].classList.remove('active');
                    links[currentIndex - 1].classList.add('active');
                }
            } else if (clicked.innerHTML.includes('»')) { // Next button
                if (currentIndex < links.length - 2) { // Stop at last number
                    links[currentIndex].classList.remove('active');
                    links[currentIndex + 1].classList.add('active');
                }
            } else { // Number button
                if (clicked !== currentActive) {
                    currentActive.classList.remove('active');
                    clicked.classList.add('active');
                }
            }
        });
    }
    document.querySelectorAll('.pagination').forEach(handlePagination);

    // --- FILE UPLOAD LOGIC ---
    document.querySelectorAll('input[type="file"]').forEach(input => {
        input.addEventListener('change', e => {
            const fileName = e.target.files[0] ? e.target.files[0].name : 'Вибрати файл';
            const label = e.target.closest('.file-upload-wrapper').querySelector('.file-name');
            label.textContent = fileName;
        });
    });

    // --- TOOLTIP LOGIC (RELIABLE VERSION) ---
    const tooltipElement = document.getElementById('tooltip');
    document.querySelectorAll('[data-tooltip]').forEach(el => {
        el.addEventListener('mouseenter', e => {
            tooltipElement.textContent = el.getAttribute('data-tooltip');
            const elRect = el.getBoundingClientRect();
            
            tooltipElement.style.left = `${elRect.left + elRect.width / 2}px`;
            tooltipElement.style.top = `${elRect.top}px`;
            
            tooltipElement.classList.add('visible');
        });
        
        el.addEventListener('mouseleave', () => {
            tooltipElement.classList.remove('visible');
        });
    });

    // --- RATING STARS LOGIC ---
    document.querySelectorAll('.rating-stars').forEach(starsContainer => {
        const stars = Array.from(starsContainer.children);
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                stars.forEach((s, i) => {
                    s.classList.toggle('fas', i <= index);
                    s.classList.toggle('far', i > index);
                });
            });
        });
    });

});

// --- GLOBAL FUNCTIONS ---
function openSidebar(sidebarId) {
    document.getElementById(sidebarId)?.classList.add('open');
    document.getElementById('sidebar-overlay')?.classList.add('visible');
}

function closeSidebar(sidebarId) {
    document.getElementById(sidebarId)?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('visible');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('visible');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('visible');
}

window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
});