const API_URL = 'http://localhost/Library_Management/api';

// Utility: Show alerts
function showAlert(message, type = 'success') {
    alert(message); // Simple alert for now, can be improved
}

// Utility: Get User from LocalStorage
function getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Auth: Register
async function register(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    // Simple logic to detect if it's admin (for demo purposes)
    const role = email.includes('admin') ? 'librarian' : 'member';

    const res = await fetch(`${API_URL}/auth.php?action=register`, {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
    });
    const data = await res.json();
    if(data.success) {
        showAlert('Registration successful! Please login.');
        showLogin();
    } else {
        showAlert(data.message, 'error');
    }
}

// Auth: Login
async function login(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch(`${API_URL}/auth.php?action=login`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if(data.success) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if(data.user.role === 'librarian') {
            window.location.href = 'librarian_dashboard.html';
        } else {
            window.location.href = 'member_dashboard.html';
        }
    } else {
        showAlert(data.message, 'error');
    }
}

// Global: Logout
function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}

// View: Toggle Login/Register
function showRegister() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
}

function showLogin() {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

// Dashboard: Load Books
async function loadBooks(isAdmin = false) {
    const res = await fetch(`${API_URL}/books.php`);
    const data = await res.json();
    const container = document.getElementById('books-container');
    container.innerHTML = '';

    if(data.success && data.data) {
        data.data.forEach(book => {
            const div = document.createElement('div');
            div.className = 'card';
            div.innerHTML = `
                <h3>${book.title}</h3>
                <p>by ${book.author_name}</p>
                <p>Category: ${book.category_name}</p>
                <p>Available: ${book.quantity}</p>
                ${isAdmin ? 
                    `<button class="btn btn-outline" onclick="deleteBook(${book.book_id})">Delete</button>` : 
                    `<button class="btn" onclick="issueBook(${book.book_id})">Borrow</button>`
                }
            `;
            container.appendChild(div);
        });
    }
}

// Admin: Add Book
async function addBook(e) {
    e.preventDefault();
    const title = document.getElementById('book-title').value;
    const author = document.getElementById('book-author').value;
    const quantity = document.getElementById('book-quantity').value;

    const res = await fetch(`${API_URL}/books.php`, {
        method: 'POST',
        body: JSON.stringify({ title, author, quantity })
    });
    const data = await res.json();
    if(data.success) {
        showAlert('Book added!');
        loadBooks(true);
        // Clear form
        e.target.reset();
    } else {
        showAlert(data.message, 'error');
    }
}

// Admin: Delete Book
async function deleteBook(id) {
    if(confirm('Are you sure?')) {
        const res = await fetch(`${API_URL}/books.php?id=${id}`, { method: 'DELETE' });
        const data = await res.json();
        if(data.success) loadBooks(true);
    }
}

// Member: Issue Book
async function issueBook(bookId) {
    const user = getUser();
    if(!user) return;

    const res = await fetch(`${API_URL}/transactions.php?action=issue`, {
        method: 'POST',
        body: JSON.stringify({ user_id: user.user_id, book_id: bookId })
    });
    const data = await res.json();
    if(data.success) {
        showAlert('Book issued successfully!');
        loadBooks(false); // Refresh availability
    } else {
        showAlert(data.message, 'error');
    }
}

// Dashboard: Load Transactions (History)
async function loadHistory(isAdmin = false) {
    const user = getUser();
    let url = `${API_URL}/transactions.php?action=history`;
    if(!isAdmin && user) url += `&user_id=${user.user_id}`;

    const res = await fetch(url);
    const data = await res.json();
    const tbody = document.getElementById('history-body');
    tbody.innerHTML = '';

    if(data.success && data.data) {
        data.data.forEach(txn => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                ${isAdmin ? `<td>${txn.user_name || txn.user_id}</td>` : ''}
                <td>${txn.title}</td>
                <td>${txn.issue_date}</td>
                <td>${txn.return_date}</td>
                <td>${txn.status}</td>
                ${isAdmin && txn.status === 'issued' ? 
                    `<td><button class="btn btn-sm" onclick="returnBook(${txn.transaction_id})">Return</button></td>` : 
                    '<td>-</td>'}
            `;
            tbody.appendChild(tr);
        });
    }
}

// Admin: Return Book
async function returnBook(txnId) {
    const res = await fetch(`${API_URL}/transactions.php?action=return`, {
        method: 'POST',
        body: JSON.stringify({ transaction_id: txnId })
    });
    const data = await res.json();
    if(data.success) {
        showAlert('Book returned!');
        loadHistory(true);
    } else {
        showAlert(data.message, 'error');
    }
}
