const API_URL = '../backend/api';

// --- MOCK API (LOCAL STORAGE) ---
// This allows the app to work without a PHP server
const USE_MOCK_API = true;

const MockAPI = {
    // ... (init, login, register remain the same, I will target the insertion point carefully)
    
    // Inserting new methods before getBooks or similar
    getUsers: async function() {
        const users = JSON.parse(localStorage.getItem('lib_users')) || [];
        // Simulate API response structure
        return { success: true, data: users };
    },

    getAuthors: async function() {
        const authors = JSON.parse(localStorage.getItem('lib_authors')) || [];
        return { success: true, data: authors };
    },

    init: function() {
        if(!localStorage.getItem('lib_users')) {
            localStorage.setItem('lib_users', JSON.stringify([
                { user_id: 1, name: 'Admin', email: 'admin@library.com', password: 'password', role: 'librarian' },
                { user_id: 2, name: 'John Doe', email: 'john@example.com', password: 'password', role: 'member', mobile: '555-0199', address: { house_no: '221B', street_no: 'Baker St', zip_code: 'NW1' } }
            ]));
        } else {
            // Hotfix: Ensure Member exists for existing data
            const users = JSON.parse(localStorage.getItem('lib_users'));
            if(!users.find(u => u.role === 'member')) {
                 users.push({ user_id: 2, name: 'John Doe', email: 'john@example.com', password: 'password', role: 'member', mobile: '555-0199', address: { house_no: '221B', street_no: 'Baker St', zip_code: 'NW1' } });
                 localStorage.setItem('lib_users', JSON.stringify(users));
            }
        }
        if(!localStorage.getItem('lib_books')) {
            localStorage.setItem('lib_books', JSON.stringify([
                { book_id: 1, title: 'The Great Gatsby', author_name: 'F. Scott Fitzgerald', category_name: 'Fiction', quantity: 5 },
                { book_id: 2, title: '1984', author_name: 'George Orwell', category_name: 'Dystopian', quantity: 8 },
                { book_id: 3, title: 'Clean Code', author_name: 'Robert Martin', category_name: 'Tech', quantity: 3, reviews: [] }
            ]));
        }
        const existingTxns = localStorage.getItem('lib_transactions');
        if(!existingTxns || existingTxns === '[]') {
            localStorage.setItem('lib_transactions', JSON.stringify([
                {
                    transaction_id: 1,
                    user_id: 2, // Member
                    book_id: 1, // Great Gatsby
                    issue_date: '2023-11-01',
                    return_date: '2023-11-08',
                    status: 'returned',
                    notes: ' returned on time'
                },
                {
                    transaction_id: 2,
                    user_id: 2,
                    book_id: 2, // 1984
                    issue_date: new Date().toISOString().split('T')[0],
                    return_date: new Date(Date.now() + 7*86400000).toISOString().split('T')[0],
                    status: 'issued',
                    notes: 'School project'
                }
            ]));
        }
        if(!localStorage.getItem('lib_authors')) {
            localStorage.setItem('lib_authors', JSON.stringify([
                { author_id: 101, name: 'F. Scott Fitzgerald', dob: '1896-09-24', country: 'USA', book_count: 1 },
                { author_id: 102, name: 'George Orwell', dob: '1903-06-25', country: 'UK', book_count: 1 },
                { author_id: 103, name: 'Robert Martin', dob: '1952-12-05', country: 'USA', book_count: 1 }
            ]));
        }
    },
    
    login: async function(email, password) {
        const users = JSON.parse(localStorage.getItem('lib_users'));
        // Relaxed comparison: Lowercase email check
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        if(user) return { success: true, user: user };
        return { success: false, message: 'Invalid credentials' };
    },

    register: async function(userData) {
        const users = JSON.parse(localStorage.getItem('lib_users'));
        // Prevent strictly case-insensitive duplicates
        if(users.find(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
            return { success: false, message: 'Email already exists' };
        }
        
        // Save as lowercase to keep data clean
        const newUser = { 
            ...userData,
            user_id: users.length + 1, 
            email: userData.email.toLowerCase() 
        };
        
        // Add Specific IDs based on role
        if(newUser.role === 'librarian') {
            newUser.librarian_id = newUser.user_id;
        } else {
            newUser.member_id = newUser.user_id;
        }

        users.push(newUser);
        localStorage.setItem('lib_users', JSON.stringify(users));
        return { success: true };
    },

    getBooks: async function() {
        return { success: true, data: JSON.parse(localStorage.getItem('lib_books')) };
    },

    getAuthor: async function(authorId) {
        const authors = JSON.parse(localStorage.getItem('lib_authors'));
        const author = authors.find(a => a.author_id == authorId); // loose equality for string/int matching
        return author ? { success: true, author } : { success: false }; 
    },

    addAuthor: async function(authorData) {
        const authors = JSON.parse(localStorage.getItem('lib_authors'));
        if(authors.find(a => a.author_id == authorData.author_id)) {
            return { success: false, message: 'Author ID already exists' };
        }
        authors.push({ ...authorData, book_count: 0 }); // init count
        localStorage.setItem('lib_authors', JSON.stringify(authors));
        return { success: true };
    },

    addBook: async function(book) {
        const books = JSON.parse(localStorage.getItem('lib_books'));
        const authors = JSON.parse(localStorage.getItem('lib_authors'));
        
        // Check ISBN
        if(books.find(b => b.isbn === book.isbn)) {
            return { success: false, message: 'Book with this ISBN already exists' };
        }

        // Update Author Count
        const authorIdx = authors.findIndex(a => a.author_id == book.author_id);
        if(authorIdx !== -1) {
            authors[authorIdx].book_count++;
            localStorage.setItem('lib_authors', JSON.stringify(authors));
            book.author_name = authors[authorIdx].name; // Cache name
        } else {
            return { success: false, message: 'Author not found for linking' };
        }

        book.book_id = books.length > 0 ? Math.max(...books.map(b => b.book_id)) + 1 : 1;
        book.reviews = [];
        
        books.push(book);
        localStorage.setItem('lib_books', JSON.stringify(books));
        return { success: true };
    },

    deleteBook: async function(id) {
        let books = JSON.parse(localStorage.getItem('lib_books'));
        books = books.filter(b => b.book_id !== id);
        localStorage.setItem('lib_books', JSON.stringify(books));
        return { success: true };
    },

    issueBook: async function(userId, bookId, days = 7) {
        const books = JSON.parse(localStorage.getItem('lib_books'));
        const bookIdx = books.findIndex(b => b.book_id === bookId);
        if(bookIdx === -1) return { success: false, message: 'Book not found' };
        if(books[bookIdx].quantity < 1) return { success: false, message: 'Book is currently unavailable' };
        
        books[bookIdx].quantity--;
        localStorage.setItem('lib_books', JSON.stringify(books));

        const txns = JSON.parse(localStorage.getItem('lib_transactions'));
        const newTxn = {
            transaction_id: txns.length > 0 ? Math.max(...txns.map(t => t.transaction_id)) + 1 : 1,
            user_id: userId,
            book_id: bookId,
            title: books[bookIdx].title,
            issue_date: new Date().toISOString().split('T')[0],
            return_date: new Date(Date.now() + days*86400000).toISOString().split('T')[0],
            status: 'issued'
        };
        txns.push(newTxn);
        localStorage.setItem('lib_transactions', JSON.stringify(txns));
        return { success: true };
    },

    returnBook: async function(txnId) {
        const txns = JSON.parse(localStorage.getItem('lib_transactions'));
        const txnIdx = txns.findIndex(t => t.transaction_id === txnId);
        if(txnIdx === -1) return { success: false, message: 'Transaction not found' };
        if(txns[txnIdx].status !== 'issued') return { success: false, message: 'Book already returned' };

        txns[txnIdx].status = 'returned';
        localStorage.setItem('lib_transactions', JSON.stringify(txns));

        const books = JSON.parse(localStorage.getItem('lib_books'));
        const bookIdx = books.findIndex(b => b.book_id === txns[txnIdx].book_id);
        if(bookIdx !== -1) {
            books[bookIdx].quantity++;
            localStorage.setItem('lib_books', JSON.stringify(books));
        }
        return { success: true };
    },

    extendLoan: async function(txnId) {
        const txns = JSON.parse(localStorage.getItem('lib_transactions'));
        const txn = txns.find(t => t.transaction_id === txnId);
        if(txn) {
            const currentReturn = new Date(txn.return_date);
            txn.return_date = new Date(currentReturn.getTime() + 7*86400000).toISOString().split('T')[0];
            localStorage.setItem('lib_transactions', JSON.stringify(txns));
            return { success: true };
        }
        return { success: false, message: 'Transaction not found' };
    },

    history: async function(userId) {
        let txns = JSON.parse(localStorage.getItem('lib_transactions'));
        const users = JSON.parse(localStorage.getItem('lib_users'));
        const books = JSON.parse(localStorage.getItem('lib_books'));

        // Enrich transactions with user and book names
        txns = txns.map(txn => {
            const user = users.find(u => u.user_id === txn.user_id);
            const book = books.find(b => b.book_id === txn.book_id);
            return {
                ...txn,
                user_name: user ? user.name : 'Unknown User',
                title: book ? book.title : 'Unknown Book'
            };
        });

        if(userId) txns = txns.filter(t => t.user_id === userId);
        return { success: true, data: txns };
    },

    addReview: async function(bookId, userId, rating, comment) {
        const books = JSON.parse(localStorage.getItem('lib_books'));
        const users = JSON.parse(localStorage.getItem('lib_users'));
        
        const bookIdx = books.findIndex(b => b.book_id === bookId);
        const user = users.find(u => u.user_id === userId);
        
        if(bookIdx === -1) return { success: false, message: 'Book not found' };
        
        if(!books[bookIdx].reviews) {
            books[bookIdx].reviews = [];
        }

        const newReview = {
            user_id: userId,
            user_name: user ? user.name : 'Anonymous',
            rating: parseInt(rating),
            comment: comment,
            date: new Date().toISOString().split('T')[0]
        };

        books[bookIdx].reviews.push(newReview);
        localStorage.setItem('lib_books', JSON.stringify(books));
        return { success: true, review: newReview };
    }
};

// Initialize Mock Data
MockAPI.init();


// --- APP LOGIC ---

let currentRole = window.location.pathname.includes('librarian_dashboard.html') ? 'librarian' : 'member';
let allBooks = []; // Cache for search

// Utility: Get User
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}


// Auth: Register
async function register(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value; 
    
    // New Fields
    const nid = document.getElementById('reg-nid').value.trim();
    const dob = document.getElementById('reg-dob').value;
    const house = document.getElementById('reg-house').value.trim();
    const street = document.getElementById('reg-street').value.trim();
    const zip = document.getElementById('reg-zip').value.trim();
    const mobile = document.getElementById('reg-mobile').value.trim();
    const workingHours = document.getElementById('reg-working-hours').value.trim();

    const role = currentRole || 'member'; // Use selected role
    
    // Validation
    if(!name || !email || !password || !nid || !dob || !house || !street || !zip || !mobile) {
        showAlert('All fields are required', 'error');
        return;
    }
    
    if(role === 'librarian' && !workingHours) {
        showAlert('Working Hours are required for Librarians', 'error');
        return;
    }

    try {
        let data;
        const address = { house_no: house, street_no: street, zip_code: zip };
        
        // Calculate Age
        const birthDate = new Date(dob);
        const ageDifMs = Date.now() - birthDate.getTime();
        const ageDate = new Date(ageDifMs); 
        const age = Math.abs(ageDate.getUTCFullYear() - 1970);

        const userData = {
            name, email, password, role,
            nid, dob, age, mobile, address,
            working_hours: role === 'librarian' ? workingHours : null
        };

        if(USE_MOCK_API) {
            data = await MockAPI.register(userData);
        } else {
             // PHP backend update would be needed here
             showAlert('Backend not updated for new fields yet', 'error');
             return;
        }

        if(data.success) {
            showAlert('Registration successful! Please login.');
            e.target.reset(); // Clear form
            cancelRegister(); 
        } else {
            showAlert(data.message, 'error');
        }
    } catch (err) {
        console.error(err);
        showAlert(err.message, 'error');
    }
}

// Auth: Login
async function login(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    try {
        let data;
        if(USE_MOCK_API) {
             data = await MockAPI.login(email, password);
        } else {
            const res = await fetch(`${API_URL}/auth.php?action=login`, {
                 method: 'POST',
                 body: JSON.stringify({ email, password })
            });
            const text = await res.text(); // Get raw text first to debug non-JSON responses
            try {
                data = JSON.parse(text);
            } catch(e) {
                console.error('Server Responded with non-JSON:', text);
                showAlert('Server Error. Check Database Connection.', 'error');
                return;
            }
        }
        
        if(data.success) {
            // Check if role matches what they selected
            if(currentRole === 'librarian' && data.user.role !== 'librarian') {
                showAlert('Access Denied: You are not a Librarian.', 'error');
                return;
            }

            localStorage.setItem('user', JSON.stringify(data.user));
            if(data.user.role === 'librarian') {
                window.location.href = 'librarian_dashboard.html';
            } else {
                window.location.href = 'member_dashboard.html';
            }
        } else {
            if(!USE_MOCK_API && data.error_code === 'USER_NOT_FOUND' && currentRole === 'member') {
                if(confirm('You are not a user. Please register.\n\nGo to registration now?')) {
                    showRegister();
                }
            } else {
                showAlert(data.message || 'Login Failed', 'error');
            }
        }
    } catch (err) {
        console.error(err);
        showAlert(err.message, 'error');
    }
}

// UI: Role Selection
function selectRole(role) {
    currentRole = role;
    document.getElementById('role-selection').classList.add('hidden');
    
    if(role === 'librarian') {
        document.getElementById('admin-code-check').classList.remove('hidden');
    } else {
        showLoginView();
    }
}

function verifyAdminCode() {
    const code = document.getElementById('admin-code-input').value;
    if(code === '10017') {
        document.getElementById('admin-code-check').classList.add('hidden');
        showLoginView();
    } else {
        showAlert('Incorrect Access Code', 'error');
    }
}

function showLoginView() {
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('login-title').innerText = currentRole === 'librarian' ? 'Librarian Login' : 'Member Login';
    document.getElementById('member-links').style.display = currentRole === 'librarian' ? 'none' : 'block';
}

function resetAuth() {
    document.getElementById('role-selection').classList.remove('hidden');
    document.getElementById('admin-code-check').classList.add('hidden');
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('admin-code-input').value = '';
}

// Utility: Flexible Modal System
function showModal({ title, content, buttons = [] }) {
    let modal = document.getElementById('custom-modal');
    if (!modal) {
        // Create base if missing
        modal = document.createElement('div');
        modal.id = 'custom-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-box">
                <div class="modal-title"></div>
                <div class="modal-content" style="margin-bottom:1.5rem; color:var(--text-secondary)"></div>
                <div class="modal-buttons" style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap"></div>
            </div>`;
        document.body.appendChild(modal);
    }

    const titleEl = modal.querySelector('.modal-title');
    const contentEl = modal.querySelector('.modal-content');
    const btnsEl = modal.querySelector('.modal-buttons');

    titleEl.textContent = title || 'Notification';
    contentEl.innerHTML = content || '';
    btnsEl.innerHTML = ''; // Clear old buttons

    // Default button if none provided
    if (buttons.length === 0) {
        buttons.push({ text: 'OK', type: 'primary', onClick: closeModal });
    }

    buttons.forEach(btn => {
        const btnEl = document.createElement('button');
        btnEl.textContent = btn.text;
        btnEl.className = 'btn';
        if (btn.type === 'outline') btnEl.className = 'btn-outline';
        if (btn.type === 'danger') btnEl.classList.add('error', 'btn'); // reuse error style
        if (btn.type === 'secondary') btnEl.style.backgroundColor = '#95a5a6'; // Grey
        
        btnEl.onclick = () => {
            if (btn.onClick) btn.onClick();
            if (btn.close !== false) closeModal();
        };
        btnsEl.appendChild(btnEl);
    });

    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('active'), 10);
}

function closeModal() {
    const modal = document.getElementById('custom-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function showAlert(message, type = 'success', btnText = 'OK') {
    showModal({
        title: type === 'error' ? '❌ Notice' : '✅ Success',
        content: message,
        buttons: [{ text: btnText, type: type === 'error' ? 'danger' : 'primary' }]
    });
}

function showLoginPrompt() {
    showModal({
        title: '🔒 Login Required',
        content: 'Please login to borrow books.',
        buttons: [
            { text: 'Cancel', type: 'outline' },
            { text: 'Log In', type: 'primary', onClick: () => window.location.href = 'index.html' }
        ]
    });
}

// Global: Logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// View: Toggle Login/Register
function showRegister() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('register-container').classList.remove('hidden');

    // Toggle Librarian Fields
    const whGroup = document.getElementById('reg-working-hours-group');
    if(currentRole === 'librarian') {
        whGroup.classList.remove('hidden');
    } else {
        whGroup.classList.add('hidden');
    }
}

function cancelRegister() {
    document.getElementById('register-container').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
}


// Dashboard: Load Books
async function loadBooks(isAdmin = false, isGuest = false) {
    try {
        let data;
        if(USE_MOCK_API) {
            data = await MockAPI.getBooks();
        } else {
            const res = await fetch(`${API_URL}/books.php`);
            data = await res.json();
        }
        
        if(!data.success) {
            console.error(data.message);
            return;
        }

        allBooks = data.data || []; // Cache data
        renderBooks(allBooks, isAdmin, isGuest); // Initial Render

    } catch(err) {
        console.error(err);
        showAlert('Failed to load books. ' + err.message, 'error');
    }
}

// Init: Admin
async function adminInit() {
    // Auto-Login for Testing if Mock API is on and no user found
    if(USE_MOCK_API && !getUser()) {
        const mockAdmin = { user_id: 1, name: 'Admin', email: 'admin@library.com', role: 'librarian' };
        localStorage.setItem('user', JSON.stringify(mockAdmin));
        console.log('Auto-logged in as Admin for testing');
    }

    await loadBooks(true);
    await loadHistory(true);
    updateDashboardStats(); 
}

function updateDashboardStats() {
    if(currentRole !== 'librarian') return;
    
    const books = JSON.parse(localStorage.getItem('lib_books')) || [];
    const txns = JSON.parse(localStorage.getItem('lib_transactions')) || [];
    
    // Calculate Stats
    const available = books.reduce((acc, b) => acc + parseInt(b.quantity || 0), 0);
    const activeLoans = txns.filter(t => t.status === 'issued').length;
    const totalInventory = available + activeLoans; // Total owned by library

    // Update UI
    if(document.getElementById('stat-total-books')) 
        document.getElementById('stat-total-books').innerText = totalInventory;
    
    if(document.getElementById('stat-active-loans')) 
        document.getElementById('stat-active-loans').innerText = activeLoans;
    
    if(document.getElementById('stat-available-books')) 
        document.getElementById('stat-available-books').innerText = available;
}

// Logic: Load History
// Logic: Load History
async function loadHistory(isAdmin = false) {
    const user = getUser();
    if(!isAdmin && !user) return;
    
    const userId = isAdmin ? null : user.user_id;

    try {
        let data;
        if(USE_MOCK_API) {
            data = await MockAPI.history(userId);
        } else {
             const url = userId ? `${API_URL}/transactions.php?user_id=${userId}` : `${API_URL}/transactions.php`;
             const res = await fetch(url);
             const text = await res.text();
             try {
                data = JSON.parse(text);
             } catch(e) {
                console.error('Invalid JSON from transactions.php:', text);
                return;
             }
        }

        if(data && data.success) {
            renderHistory(data.data, isAdmin);
        } else {
            console.error(data ? data.message : 'No data returned');
        }
    } catch(err) {
        console.error(err);
    }
}

// Logic: Render History
function renderHistory(txns, isAdmin) {
    const tbody = document.getElementById('history-body');
    if(!tbody) return;
    tbody.innerHTML = '';

    txns.sort((a,b) => b.transaction_id - a.transaction_id).forEach(t => {
        const row = document.createElement('tr');
        const isLate = new Date() > new Date(t.return_date) && t.status === 'issued';
        const notes = t.notes ? `<br><small style="color:var(--text-secondary)"><em>"${t.notes}"</em></small>` : '';

        row.innerHTML = `
            <td>
                <strong>${t.title}</strong>
                ${isAdmin ? `<br><small>User: ${t.user_name}</small>` : ''}
                ${notes}
            </td>
            <td>${t.issue_date}</td>
            <td style="${isLate ? 'color:var(--danger); font-weight:bold' : ''}">${t.return_date}</td>
            <td>
                <span class="badge ${t.status === 'issued' ? 'badge-stock' : 'badge-out'}" style="background:${t.status === 'issued' ? '#e8f5e9' : '#eee'}; color:${t.status === 'issued' ? '#2e7d32' : '#666'}">
                    ${t.status.toUpperCase()}
                </span>
            </td>
             <td>
                ${t.status === 'issued' 
                    ? `<button class="btn-sm" onclick="handleReturnAction(${t.transaction_id})">Manage</button>`
                    : '-' }
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Logic: Render Books (separated for Search)
function renderBooks(books, isAdmin, isGuest) {
    const container = document.getElementById('books-container');
    if(!container) return; // Guard
    container.innerHTML = '';
    
    // Switch to Grid Class
    container.className = 'book-grid'; // Use new CSS grid

    let availableBooks = 0;

    books.forEach(book => {
        availableBooks += parseInt(book.quantity);

        const div = document.createElement('div');
        div.className = 'book-card'; // New Modern Card Class

        // Badge Logic
        let badges = `<span class="badge badge-category">${book.category_name || 'General'}</span>`;
        if(book.quantity < 1) {
            badges += ` <span class="badge badge-out">Out of Stock</span>`;
        } else if(book.quantity < 3) {
            badges += ` <span class="badge badge-stock">Low Stock: ${book.quantity}</span>`;
        } else {
            badges += ` <span class="badge badge-stock">In Stock: ${book.quantity}</span>`;
        }

        if(isAdmin === true) {
                div.innerHTML = `
                <div class="card-header-spine"></div>
                <div class="card-body">
                    <div class="card-meta" style="justify-content:space-between; margin-bottom:0.5rem">
                         <span class="badge badge-category">${book.category_name}</span>
                         <span style="font-size:0.8rem; color:var(--text-secondary)">ID: ${book.book_id}</span>
                    </div>
                    <h3 class="card-title">${book.title}</h3>
                    <div class="card-author">by ${book.author_name}</div>
                    
                    <div style="margin-top:auto; display:flex; justify-content:space-between; align-items:center">
                        <div>
                           <strong>Stock: ${book.quantity}</strong>
                        </div>
                        <button class="btn-outline btn-sm" onclick="deleteBook(${book.book_id})" style="border-color:var(--danger); color:var(--danger)">Remove</button>
                    </div>
                </div>
            `;
        } else {
            // Member or Guest
            div.innerHTML = `
                <div class="card-header-spine"></div>
                <div class="card-body">
                    <div class="card-meta">
                        ${badges}
                    </div>
                    <h3 class="card-title">${book.title}</h3>
                    <div class="card-author">by ${book.author_name}</div>
                    
                    <!-- Rating Summary -->
                    <div style="margin-bottom:1rem; display:flex; align-items:center; gap:5px; font-size:0.9rem">
                        <span style="color:#f1c40f">★</span> 
                        <strong>${calculateAverageRating(book.reviews)}</strong>
                        <span style="color:var(--text-secondary); font-size:0.8rem">(${book.reviews ? book.reviews.length : 0} reviews)</span>
                    </div>

                    <div class="card-actions" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px">
                        ${isGuest 
                            ? `<button class="btn" onclick="showLoginPrompt()">Borrow</button>` 
                            : (book.quantity > 0 
                                ? `<button class="btn" onclick="issueBook(${book.book_id})">Borrow</button>` 
                                : `<button class="btn" style="background:#ccc; cursor:not-allowed" disabled>Unavailable</button>`)
                        }
                        <button class="btn-outline" onclick="openReviewModal(${book.book_id})">Reviews</button>
                    </div>
                </div>
            `;
        }
        container.appendChild(div);
    });
}

// Logic: Filter Books
function filterBooks(isAdmin = false, isGuest = false) {
    const query = document.getElementById('search-box').value.toLowerCase();
    const filtered = allBooks.filter(book => 
        book.title.toLowerCase().includes(query) || 
        book.author_name.toLowerCase().includes(query) ||
        book.category_name.toLowerCase().includes(query)
    );
    renderBooks(filtered, isAdmin, isGuest);
}


// Logic: Check Author ID
async function checkAuthorId() {
    const id = document.getElementById('author-id-check').value;
    const msg = document.getElementById('author-msg');
    const newForm = document.getElementById('new-author-form');
    
    if(!id) return;

    let res;
    if(USE_MOCK_API) {
        res = await MockAPI.getAuthor(id);
    } else {
        try {
            const response = await fetch(`${API_URL}/authors.php?id=${id}`);
            const data = await response.json();
            if(data.success) {
                // Backend returns { success: true, author: {...} } which matches what we need
                res = data; 
                // Adapt if structure differs. API returns 'author' object.
            } else {
                res = { success: false };
            }
        } catch(e) {
            console.error(e);
            res = { success: false };
        }
    }

    if(res.success) {
        msg.style.color = 'var(--success)';
        msg.innerText = `Author Found: ${res.author.name} (Books: ${res.author.book_count})`;
        newForm.style.display = 'none';
        
        // Remove 'required' from hidden new author fields to prevent submit block
        document.getElementById('new-author-name').required = false;
        document.getElementById('new-author-dob').required = false;
        document.getElementById('new-author-country').required = false;
    } else {
        msg.style.color = 'var(--danger)';
        msg.innerText = 'Author Not Found. Please add details below.';
        newForm.style.display = 'block';

        // Add 'required' to new fields
        document.getElementById('new-author-name').required = true;
        document.getElementById('new-author-dob').required = true;
        document.getElementById('new-author-country').required = true;
    }
}

// Admin: Add Book (Advanced)
async function addBook(e) {
    e.preventDefault();
    const isbn = document.getElementById('book-isbn').value.trim();
    const title = document.getElementById('book-title').value.trim();
    const year = document.getElementById('book-year').value;
    const lang = document.getElementById('book-lang').value;
    const quantity = document.getElementById('book-quantity').value;
    const authorId = document.getElementById('author-id-check').value;
    const genre = document.getElementById('book-genre').value;

    if(!genre) {
        showAlert('Please select a genre.', 'error');
        return;
    }

    // Logic: Handle Author (Existing or New)
    const newAuthorFormVisible = document.getElementById('new-author-form').style.display !== 'none';
    
    if(newAuthorFormVisible) {
        // Create Author First
        const authName = document.getElementById('new-author-name').value;
        const authDob = document.getElementById('new-author-dob').value;
        const authCountry = document.getElementById('new-author-country').value;
        
        const authorData = {
            author_id: authorId,
            name: authName,
            dob: authDob,
            country: authCountry
        };

        if(USE_MOCK_API) {
            const authRes = await MockAPI.addAuthor(authorData);
            if(!authRes.success) {
                showAlert(authRes.message, 'error');
                return;
            }
        }
    }

    // Add Book
    const bookData = {
        isbn,
        title,
        quantity: parseInt(quantity),
        year_published: year,
        language: lang,
        category_name: genre, 
        author_id: authorId
    };

    let data;
    if(USE_MOCK_API) {
        data = await MockAPI.addBook(bookData);
    } else {
        // PHP backend logic
        showAlert('Backend not updated for new book schema', 'error');
        return;
    }
    
    if(data.success) {
        showAlert('Book and Author details saved successfully!');
        loadBooks(true);
        e.target.reset();
        document.getElementById('new-author-form').style.display = 'none';
        document.getElementById('author-msg').innerText = '';
    } else {
        showAlert(data.message, 'error');
    }
}

// Admin: Delete Book
async function deleteBook(id) {
    let data;
    if(USE_MOCK_API) {
        data = await MockAPI.deleteBook(id);
    } else {
        // Direct delete for now to avoid native confirm popup
        const res = await fetch(`${API_URL}/books.php?id=${id}`, { method: 'DELETE' });
        data = await res.json();
    }
    
    if(data.success) {
        showAlert('Book deleted');
        loadBooks(true);
    } else {
        showAlert(data.message, 'error');
    }
}

// Member: Issue Book (Request Form)
async function issueBook(bookId) {
    const user = getUser();
    if(!user) return;

    showModal({
        title: '📖 Borrow Request',
        content: `
            <p>Please confirm details for borrowing this book.</p>
            <div style="text-align:left; margin-top:1rem">
                <div style="margin-bottom:1rem">
                    <label style="display:block; font-weight:bold; margin-bottom:0.5rem">Return Date</label>
                    <select id="loan-duration" style="width:100%; padding:8px; border-radius:4px; border:1px solid #ddd">
                        <option value="7">7 Days (Standard)</option>
                        <option value="14">14 Days (Extended)</option>
                        <option value="3">3 Days (Short)</option>
                    </select>
                </div>
                <div>
                    <label style="display:block; font-weight:bold; margin-bottom:0.5rem">Purpose / Notes</label>
                    <textarea id="loan-notes" placeholder="e.g. For research project..." style="width:100%; padding:8px; border-radius:4px; border:1px solid #ddd; resize:vertical"></textarea>
                </div>
            </div>
        `,
        buttons: [
            { text: 'Cancel', type: 'outline' },
            { 
                text: 'Confirm Borrow', 
                type: 'primary',
                close: false, 
                onClick: async () => {
                   const duration = document.getElementById('loan-duration').value;
                   const notes = document.getElementById('loan-notes').value;
                   if(!notes.trim()) {
                       alert('Please provide a reason/note.');
                       return;
                   }
                   await processIssue(user.user_id, bookId, parseInt(duration), notes);
                   closeModal();
                }
            }
        ]
    });
}

async function processIssue(userId, bookId, days, notes) {
    let data;
    if(USE_MOCK_API) {
        data = await MockAPI.issueBook(userId, bookId, days, notes);
    } else {
        const res = await fetch(`${API_URL}/transactions.php?action=issue`, {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, book_id: bookId, days: days, notes: notes })
        });
        data = await res.json();
    }
    
    if(data.success) {
        showAlert('Book issued successfully!');
        loadBooks(false); 
        loadHistory(false); // Refresh history for member
        if(currentRole === 'librarian') updateDashboardStats();
    } else {
        showAlert(data.message, 'error');
    }
}

// ... existing code ...

// Admin: Return or Extend
async function handleReturnAction(txnId) {
    const buttons = [
        { text: 'Cancel', type: 'outline' }
    ];

    if(currentRole === 'librarian') {
        buttons.push({ 
             text: 'Send Reminder', 
             type: 'secondary', 
             onClick: async () => {
                 showAlert('Reminder sent to user!', 'success');
             }
         });
    }

    buttons.push(
         { 
             text: 'Extend (+7 Days)', 
             type: 'secondary',
             onClick: async () => {
                 await processExtend(txnId);
             }
         },
         { 
             text: currentRole === 'librarian' ? 'Process Return' : 'Return Book', 
             type: 'primary', 
             onClick: async () => {
                 await processReturn(txnId);
             }
         }
    );

    showModal({
        title: 'Manage Loan',
        content: 'Choose an action for this active loan.',
        buttons: buttons
    });
}

async function processReturn(txnId) {
    let data;
    if(USE_MOCK_API) {
        data = await MockAPI.returnBook(txnId);
    } else {
        const res = await fetch(`${API_URL}/transactions.php?action=return`, {
            method: 'POST',
            body: JSON.stringify({ transaction_id: txnId })
        });
        data = await res.json();
    }
    
    if(data.success) {
        showAlert('Book returned!');
        const isAdmin = currentRole === 'librarian';
        loadHistory(isAdmin);
        loadBooks(isAdmin);
        if(isAdmin) updateDashboardStats();
    } else {
        showAlert(data.message, 'error');
    }
}

async function processExtend(txnId) {
    let data;
    if(USE_MOCK_API) {
        data = await MockAPI.extendLoan(txnId);
    } else {
        const res = await fetch(`${API_URL}/transactions.php?action=extend`, {
            method: 'POST',
            body: JSON.stringify({ transaction_id: txnId })
        });
        data = await res.json();
    }

    if(data.success) {
        showAlert('Loan extended by 7 days.');
        loadHistory(currentRole === 'librarian');
    } else {
        showAlert(data.message, 'error');
    }
}



// Reviews Logic
function calculateAverageRating(reviews) {
    if(!reviews || reviews.length === 0) return '0.0';
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
}

function openReviewModal(bookId) {
    const book = allBooks.find(b => b.book_id === bookId);
    if(!book) return;

    const reviewsHtml = (book.reviews && book.reviews.length > 0) 
        ? book.reviews.map(r => `
            <div style="background:#f8f9fa; padding:10px; border-radius:8px; margin-bottom:10px; text-align:left">
                <div style="display:flex; justify-content:space-between">
                    <strong>${r.user_name}</strong>
                    <span style="color:#f1c40f">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span>
                </div>
                <p style="margin:5px 0; color:#555">${r.comment}</p>
                <small style="color:#aaa">${r.date}</small>
            </div>
        `).join('')
        : '<p style="color:#888; font-style:italic">No reviews yet. Be the first!</p>';

    // Check if user updates
    const user = getUser();
    const canReview = user && user.role === 'member'; 

    showModal({
        title: `Reviews: ${book.title}`,
        content: `
            <div style="max-height:300px; overflow-y:auto; margin-bottom:1.5rem">
                ${reviewsHtml}
            </div>
            ${canReview ? `
            <div style="border-top:1px solid #eee; padding-top:1rem; text-align:left">
                <h4 style="margin-bottom:0.5rem">Write a Review</h4>
                <div style="margin-bottom:0.5rem">
                    <label>Rating:</label>
                    <select id="review-rating" style="padding:5px; border-radius:4px">
                        <option value="5">★★★★★ (5)</option>
                        <option value="4">★★★★☆ (4)</option>
                        <option value="3">★★★☆☆ (3)</option>
                        <option value="2">★★☆☆☆ (2)</option>
                        <option value="1">★☆☆☆☆ (1)</option>
                    </select>
                </div>
                <textarea id="review-comment" placeholder="Share your thoughts..." style="width:100%; padding:8px; border-radius:4px; border:1px solid #ddd; resize:vertical; min-height:60px"></textarea>
            </div>
            ` : ''}
        `,
        buttons: [
            { text: 'Close', type: 'outline' },
            ...(canReview ? [{ 
                text: 'Submit Review', 
                type: 'primary',
                close: false,
                onClick: async () => {
                    const rating = document.getElementById('review-rating').value;
                    const comment = document.getElementById('review-comment').value;
                    if(!comment.trim()) {
                        showAlert('Please write a comment.', 'error');
                        return;
                    }
                    await submitReview(bookId, user.user_id, rating, comment);
                    closeModal();
                }
            }] : [])
        ]
    });
}

async function submitReview(bookId, userId, rating, comment) {
    let data;
    if(USE_MOCK_API) {
        data = await MockAPI.addReview(bookId, userId, rating, comment);
    } else {
        alert('Backend support for reviews coming soon.');
        return;
    }

    if(data.success) {
        showAlert('Review submitted!', 'success');
        loadBooks(currentRole === 'librarian'); // Reload to show new rating
    } else {
        showAlert('Failed to submit review.', 'error');
    }
}

// Profile & User Management Logic
function showProfile() {
    const user = getUser();
    if(!user) return;

    const addressStr = user.address ? `${user.address.house_no}, ${user.address.street_no}, ${user.address.zip_code}` : 'N/A';

    showModal({
        title: 'User Profile',
        content: `
            <div style="text-align:left">
                <p><strong>Name:</strong> ${user.name}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Role:</strong> ${user.role.toUpperCase()}</p>
                <hr style="margin:10px 0; border:0; border-top:1px solid #eee">
                <p><strong>National ID:</strong> ${user.nid || 'N/A'}</p>
                <p><strong>Date of Birth:</strong> ${user.dob || 'N/A'} (Age: ${user.age || 'N/A'})</p>
                <p><strong>Mobile:</strong> ${user.mobile || 'N/A'}</p>
                <p><strong>Address:</strong> ${addressStr}</p>
                ${user.role === 'librarian' ? `<p><strong>Working Hours:</strong> ${user.working_hours || 'N/A'}</p>` : ''}
            </div>
        `,
        buttons: [{ text: 'Close', type: 'outline' }]
    });
}

async function showUsers() {
    const user = getUser();
    if(!user || user.role !== 'librarian') {
        showAlert('You must be logged in as a Librarian to view users.', 'error');
        return;
    }

    let users = [];
    if(USE_MOCK_API) {
        const res = await MockAPI.getUsers();
        users = res.data;
    } else {
        try {
            const res = await fetch(`${API_URL}/users.php`);
            const data = await res.json();
            if(data.success) {
                users = data.data;
            } else {
                showAlert('Failed to load users: ' + data.message, 'error');
                return;
            }
        } catch(err) {
            console.error(err);
            showAlert('Error fetching users', 'error');
            return;
        }
    }

    const members = users.filter(u => u.role === 'member'); 

    const rows = members.map(u => {
        const addr = u.address ? `${u.address.house_no}, ${u.address.street_no}, ${u.address.zip_code}` : '-';
        return `
            <tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.nid || '-'}</td>
                <td>${u.mobile || '-'}</td>
                <td>${u.dob || '-'}</td>
                <td>${addr}</td>
            </tr>
        `;
    }).join('');

    const tableHtml = `
        <div style="max-height:400px; overflow-y:auto">
            <table style="width:100%; border-collapse:collapse; font-size:0.9rem">
                <thead>
                    <tr style="background:#f8f9fa; text-align:left">
                        <th style="padding:8px">Name</th>
                        <th style="padding:8px">Email</th>
                        <th style="padding:8px">NID</th>
                        <th style="padding:8px">Mobile</th>
                        <th style="padding:8px">DOB</th>
                        <th style="padding:8px">Address</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.length ? rows : '<tr><td colspan="6" style="padding:10px; text-align:center">No members found.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;

    showModal({
        title: 'Registered Members',
        content: tableHtml,
        buttons: [{ text: 'Close', type: 'outline' }]
    });
}

async function showAuthors() {
    const user = getUser();
    if(!user || user.role !== 'librarian') {
         showAlert('You must be logged in as a Librarian to view authors.', 'error');
         return;
    }

    let authors = [];
    if(USE_MOCK_API) {
        const res = await MockAPI.getAuthors();
        authors = res.data;
    } else {
        try {
            const res = await fetch(`${API_URL}/authors.php`); // Returns all authors with book counts
            const data = await res.json();
            if(data.success) {
                 authors = data.data; // authors.php returns { data: [...] }
            } else {
                 showAlert('Failed to load authors', 'error');
                 return;
            }
        } catch(err) {
            console.error(err);
            showAlert('Error fetching authors', 'error');
            return;
        }
    }

    const rows = authors.map(a => `
        <tr>
            <td>${a.author_id}</td>
            <td><strong>${a.name}</strong></td>
            <td>${a.dob || '-'}</td>
            <td>${a.country || '-'}</td>
            <td style="text-align:center"><span class="badge badge-stock">${a.book_count}</span></td>
        </tr>
    `).join('');

    const tableHtml = `
        <div style="max-height:400px; overflow-y:auto">
            <table style="width:100%; border-collapse:collapse; font-size:0.9rem">
                <thead>
                    <tr style="background:#f8f9fa; text-align:left">
                        <th style="padding:8px">ID</th>
                        <th style="padding:8px">Name</th>
                        <th style="padding:8px">DOB</th>
                        <th style="padding:8px">Country</th>
                        <th style="padding:8px; text-align:center">Books</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows.length ? rows : '<tr><td colspan="5" style="padding:10px; text-align:center">No authors found.</td></tr>'}
                </tbody>
            </table>
        </div>
    `;

    showModal({
        title: 'Author Catalog',
        content: tableHtml,
        buttons: [{ text: 'Close', type: 'outline' }]
    });
}

async function showStatDetails(type) {
    if(currentRole !== 'librarian') return;

    let title = '';
    let content = '';
    const books = JSON.parse(localStorage.getItem('lib_books')) || [];
    const txns = JSON.parse(localStorage.getItem('lib_transactions')) || [];

    if(type === 'total') {
        title = 'Total Library Inventory';
        const rows = books.map(b => `
            <tr>
                <td>${b.book_id}</td>
                <td><strong>${b.title}</strong></td>
                <td>${b.author_name}</td>
                <td style="text-align:center">${b.quantity}</td>
            </tr>
        `).join('');
        content = createTable(['ID', 'Title', 'Author', 'Stock'], rows);
    } 
    else if(type === 'loans') {
        title = 'Active Loans Details';
        const users = JSON.parse(localStorage.getItem('lib_users')) || [];
        const active = txns.filter(t => t.status === 'issued');
        
        const rows = active.map(t => {
            const user = users.find(u => u.user_id === t.user_id);
            const book = books.find(b => b.book_id === t.book_id);
            const bookTitle = book ? book.title : (t.title || 'Unknown Book');
            const userName = user ? user.name : 'Unknown User';
            
            return `
            <tr>
                <td><strong>${bookTitle}</strong></td>
                <td>${userName}</td>
                <td>${t.return_date}</td>
                <td style="color:#e67e22">Issued</td>
            </tr>
            `;
        }).join('');
        
        content = rows.length ? createTable(['Book', 'Borrower', 'Due Date', 'Status'], rows) : '<p style="text-align:center; padding:10px">No active loans.</p>';
    } 
    else if(type === 'available') {
        title = 'Available Books';
        const available = books.filter(b => b.quantity > 0);
        const rows = available.map(b => `
            <tr>
                <td>${b.book_id}</td>
                <td><strong>${b.title}</strong></td>
                <td>${b.author_name}</td>
                <td style="text-align:center; color:#27ae60">${b.quantity}</td>
            </tr>
        `).join('');
        content = rows.length ? createTable(['ID', 'Title', 'Author', 'Available'], rows) : '<p style="text-align:center; padding:10px">No books available.</p>';
    }

    showModal({
        title: title,
        content: `<div style="max-height:400px; overflow-y:auto">${content}</div>`,
        buttons: [{ text: 'Close', type: 'outline' }]
    });
}

function createTable(headers, rows) {
    return `
        <table style="width:100%; border-collapse:collapse; font-size:0.9rem">
            <thead>
                <tr style="background:#f8f9fa; text-align:left">
                    ${headers.map(h => `<th style="padding:8px">${h}</th>`).join('')}
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}
