// ...existing code...
async function insertItem(item) {
    const response = await fetch('http://varad-resume.ap-south-1.elasticbeanstalk.com/data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(item)
    });
    return response.json();
}

// ...existing code...
async function fetchItems() {
    const response = await fetch('http://varad-resume.ap-south-1.elasticbeanstalk.com/data');
    return response.json();
}

// Example usage: Insert item on button click
document.getElementById('insertBtn')?.addEventListener('click', async () => {
    const item = {
        name: document.getElementById('itemName').value,
        value: document.getElementById('itemValue').value
    };
    const result = await insertItem(item);
    alert('Inserted!');
});

// Example usage: Fetch items on button click
document.getElementById('fetchBtn')?.addEventListener('click', async () => {
    const items = await fetchItems();
    document.getElementById('itemsList').innerText = JSON.stringify(items, null, 2);
});
function switchTemplate(templateName) {
    const tabs = document.querySelectorAll('.template-tab');
    tabs.forEach(tab => tab.classList.remove('active'));
    document.querySelector(`.template-tab[data-template="${templateName}"]`).classList.add('active');
    const templates = document.querySelectorAll('.resume-template');
    templates.forEach(template => template.classList.remove('active'));
    document.getElementById(templateName + '-template').classList.add('active');
}

function toggleAuthMode() {
    const title = document.querySelector('.auth-card h2');
    const button = document.querySelector('.auth-card button');
    const linkText = document.querySelector('.auth-card p');

    if (title.textContent === 'Sign In') {
        title.textContent = 'Sign Up';
        button.textContent = 'Sign Up';
        linkText.innerHTML = 'Already have an account? <a href="#" id="auth-toggle">Sign in here</a>';
    } else {
        title.textContent = 'Sign In';
        button.textContent = 'Sign In';
        linkText.innerHTML = 'Don\'t have an account? <a href="#" id="auth-toggle">Sign up here</a>';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Resume upload and fetch logic for dashboard
    const uploadForm = document.getElementById('uploadResumeForm');
    const resumeGrid = document.getElementById('resumeGrid');
    // Replace with actual userId from session/auth
    const userId = localStorage.getItem('userId') || '1';

    async function fetchResumes() {
        const response = await fetch(`http://varad-resume.ap-south-1.elasticbeanstalk.com/resumes?userId=${userId}`);
        const resumes = await response.json();
        resumeGrid.innerHTML = '';
        resumes.forEach(resume => {
            const card = document.createElement('a');
            card.className = 'resume-card';
            card.href = resume.url;
            card.target = '_blank';
            card.innerHTML = `<h3>${resume.fileName}</h3><div class="resume-meta"><p>Uploaded: ${new Date(resume.uploadedAt).toLocaleString()}</p></div>`;
            resumeGrid.appendChild(card);
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const fileInput = document.getElementById('resumeFile');
            if (!fileInput.files.length) return alert('Please select a PDF file');
            const formData = new FormData();
            formData.append('resume', fileInput.files[0]);
            formData.append('userId', userId);
            const response = await fetch('http://varad-resume.ap-south-1.elasticbeanstalk.com/upload-resume', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (response.ok) {
                alert('Resume uploaded!');
                fetchResumes();
            } else {
                alert(result.error || 'Upload failed');
            }
        });
        // Initial fetch
        fetchResumes();
    }
    const authToggleLink = document.getElementById('auth-toggle');

    // Auth form logic
    const authForm = document.querySelector('.auth-card form');
    const title = document.querySelector('.auth-card h2');
    authForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        if (title.textContent === 'Sign Up') {
            // Sign Up
            const response = await fetch('http://varad-resume.ap-south-1.elasticbeanstalk.com/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();
            if (response.ok) {
                alert('Signup successful! Please sign in.');
                toggleAuthMode();
            } else {
                alert(result.error || 'Signup failed');
            }
        } else {
            // Sign In
            const response = await fetch('http://varad-resume.ap-south-1.elasticbeanstalk.com/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();
            if (response.ok) {
                // Store user information in localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('userId', result.user.id);
                localStorage.setItem('userEmail', result.user.email);
                alert('Login successful!');
                window.location.href = 'dashboard.html';
            } else {
                alert(result.error || 'Login failed');
            }
        }
    });
    if (authToggleLink) {
        authToggleLink.addEventListener('click', function(e) {
            e.preventDefault();
            toggleAuthMode();
        });
    }

    const templateTabs = document.querySelectorAll('.template-tab');
    if (templateTabs.length > 0) {
        templateTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                switchTemplate(this.dataset.template);
            });
        });
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.feature-card').forEach(card => {
        observer.observe(card);
    });


    document.querySelectorAll('.btn').forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = button.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');

            button.appendChild(ripple);

            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });

    // Function to update nav based on auth state
    function updateNavigation() {
        const navLinks = document.querySelectorAll('.nav-links');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const userEmail = localStorage.getItem('userEmail');

        navLinks.forEach(ul => {
            const loginLi = ul.querySelector('a[href="auth.html"]')?.parentElement;
            if (loginLi && isLoggedIn && userEmail) {
                loginLi.style.display = 'flex';
                loginLi.style.alignItems = 'center';
                loginLi.style.gap = '12px';
                loginLi.innerHTML = `
                    <a href="dashboard.html" style="display:flex;align-items:center;padding:4px;">
                        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='currentColor' viewBox='0 0 24 24' style='vertical-align:middle;'>
                            <circle cx='12' cy='8' r='4'/>
                            <path d='M12 14c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z'/>
                        </svg>
                    </a>
                    <button id='logoutBtn' style='padding:4px 12px;border:none;background:#d32f2f;color:#fff;border-radius:4px;cursor:pointer;font-size:14px;transition:background 0.3s'>Logout</button>`;
                
                // Attach logout handler
                const logoutBtn = loginLi.querySelector('#logoutBtn');
                logoutBtn.addEventListener('mouseover', () => logoutBtn.style.background = '#b71c1c');
                logoutBtn.addEventListener('mouseout', () => logoutBtn.style.background = '#d32f2f');
                logoutBtn.onclick = function() {
                    localStorage.removeItem('isLoggedIn');
                    localStorage.removeItem('userId');
                    localStorage.removeItem('userEmail');
                    localStorage.removeItem('resumeData');
                    alert('Logged out successfully!');
                    window.location.href = 'index.html';
                };
            } else if (loginLi && !isLoggedIn) {
                loginLi.style.display = 'block';
                loginLi.innerHTML = `<a href="auth.html">Login</a>`;
            }
        });
    }

    // Call on page load
    updateNavigation();

    // Listen for auth state changes (if any other part of your app changes auth state)
    window.addEventListener('storage', function(e) {
        if (e.key === 'isLoggedIn' || e.key === 'userEmail') {
            updateNavigation();
        }
    });
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', function() {
            document.querySelectorAll('.nav-links a').forEach(navLink => {
                navLink.classList.remove('active-nav');
            });
            this.classList.add('active-nav');
        });
    });

    const floatingBtn = document.querySelector('.btn-floating');
    if (floatingBtn) {
        floatingBtn.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.1) rotate(90deg)';
        });
        floatingBtn.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1) rotate(0deg)';
        });
    }

    // Logout function
    function logout() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('resumeData');
        alert('Logged out successfully!');
        window.location.href = 'index.html';
    }

    document.getElementById('logoutBtn')?.addEventListener('click', logout);
});