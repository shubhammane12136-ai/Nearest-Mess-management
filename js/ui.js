class UIService {
    constructor() {
        this.initTheme();
    }

    // Theme Management System
    initTheme() {
        const savedTheme = localStorage.getItem('smartmess-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        // Expose globally for inline onclick handlers
        window.toggleTheme = () => this.toggleTheme();

        // Wait for DOM to load buttons and update them
        window.addEventListener('DOMContentLoaded', () => {
            this.updateThemeIcon(savedTheme);
        });
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('smartmess-theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const toggleBtns = document.querySelectorAll('.theme-toggle');
        toggleBtns.forEach(btn => {
            if (theme === 'dark') {
                btn.innerHTML = '<i class="fas fa-sun" style="color: #FFE66D;"></i>';
            } else {
                btn.innerHTML = '<i class="fas fa-moon" style="color: #2A363B;"></i>';
            }
        });
    }

    // Lively App-like Toast System
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container') || this.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast-lively toast-${type}`;

        const icon = type === 'success' ? 'fa-check-circle' : 'fa-times-circle';

        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(100%)';
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    }

    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            align-items: center;
        `;
        document.body.appendChild(container);
        return container;
    }

    // Modal Manager
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';

            // Add bounce animation to modal content
            const content = modal.querySelector('.glass-card');
            if (content) {
                content.style.animation = 'popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }
}

export const uiService = new UIService();
