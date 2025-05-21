// McDonald's-style food ordering logic with customization and visual menu

// Sample users (for demo purposes)
const users = JSON.parse(localStorage.getItem("users") || "{}");
function saveUsers() { localStorage.setItem("users", JSON.stringify(users)); }

// Sample menu with images
const menu = [
    {
        id: 1,
        name: "Big Mac",
        price: 5.99,
        img: "images/bigmac.jpg",
    },
    {
        id: 2,
        name: "McChicken",
        price: 4.29,
        img: "images/mcchicken.jpg",
    },
    {
        id: 3,
        name: "French Fries",
        price: 2.49,
        img: "images/fries.jpg",
    },
    {
        id: 4,
        name: "Sundae",
        price: 2.19,
        img: "images/sundae.jpg",
    },
    {
        id: 5,
        name: "Coca-Cola",
        price: 1.59,
        img: "images/coke.jpg",
    }
];

// Order status steps
const orderStatusSteps = [
    "Order Received",
    "Preparing",
    "Ready for Pickup",
    "On the Way",
    "Delivered"
];

let currentUser = null;
let cart = [];
let currentOrder = null;
let pendingCustomization = null;

function show(elem) { elem.classList.remove("hidden"); }
function hide(elem) { elem.classList.add("hidden"); }

// Render menu as cards
function renderMenu() {
    const menuList = document.getElementById('menu-list');
    menuList.innerHTML = "";
    menu.forEach(item => {
        const card = document.createElement('div');
        card.className = "menu-card";
        card.innerHTML = `
            <img src="${item.img || "https://placehold.co/100x100"}" alt="${item.name}">
            <div class="item-name">${item.name}</div>
            <div class="item-price">$${item.price.toFixed(2)}</div>
            <button data-id="${item.id}">Add</button>
        `;
        menuList.appendChild(card);
    });
}

function renderCart() {
    const cartList = document.getElementById('cart-list');
    cartList.innerHTML = "";
    cart.forEach((item, idx) => {
        let custom = "";
        if (item.custom) {
            const arr = [];
            if (item.custom.extraCheese) arr.push("🧀 Extra Cheese");
            if (item.custom.noOnion) arr.push("🚫 Onion");
            if (item.custom.spicy) arr.push("🌶️ Spicy");
            if (arr.length) custom = `<div style="font-size:.93em;color:#a18800;margin-top:2px;">${arr.join(", ")}</div>`;
        }
        const li = document.createElement('li');
        li.innerHTML = `
            <span>
                ${item.name} x${item.qty}
                ${custom}
            </span>
            <button data-idx="${idx}">Remove</button>
        `;
        cartList.appendChild(li);
    });
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    document.getElementById('cart-total').innerText = total > 0 ? `Total: $${total.toFixed(2)}` : "";
    document.getElementById('order-btn').classList.toggle("hidden", cart.length === 0);
}

// Auth logic
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const logoutBtn = document.getElementById('logout-btn');
const orderBtn = document.getElementById('order-btn');
const orderConfirmation = document.getElementById('order-confirmation');
const orderTracking = document.getElementById('order-tracking');
const customizeModal = document.getElementById('customize-modal');
const customizeForm = document.getElementById('customize-form');
const cancelCustomize = document.getElementById('cancel-customize');

showSignup.onclick = e => {
    e.preventDefault();
    hide(loginForm); show(signupForm);
};
showLogin.onclick = e => {
    e.preventDefault();
    hide(signupForm); show(loginForm);
};

loginForm.onsubmit = function(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errorElem = document.getElementById('login-error');
    if (users[username] && users[username] === password) {
        currentUser = username; errorElem.innerText = ""; loginSuccess();
    } else {
        errorElem.innerText = "Invalid credentials.";
    }
};
signupForm.onsubmit = function(e) {
    e.preventDefault();
    const username = document.getElementById('signup-username').value.trim();
    const password = document.getElementById('signup-password').value;
    const errorElem = document.getElementById('signup-error');
    if (users[username]) {
        errorElem.innerText = "Username already exists.";
    } else if (!username || !password) {
        errorElem.innerText = "Please fill in all fields.";
    } else {
        users[username] = password; saveUsers(); errorElem.innerText = "";
        hide(signupForm); show(loginForm);
        document.getElementById('login-username').value = username;
        document.getElementById('login-password').value = "";
    }
};

function loginSuccess() {
    hide(authContainer); show(appContainer);
    renderMenu(); renderCart();
    hide(orderConfirmation); hide(orderTracking);
    cart = []; currentOrder = null;
}

// Cart interaction using Remove button
document.getElementById('cart-list').onclick = function(e) {
    if (e.target.tagName === "BUTTON") {
        const idx = e.target.getAttribute('data-idx');
        if (idx !== null) {
            cart.splice(idx, 1);
            renderCart();
        }
    }
};

// Menu "Add" button interaction - triggers customization modal
document.getElementById('menu-list').onclick = function(e) {
    if (e.target.tagName === "BUTTON") {
        const itemId = e.target.getAttribute('data-id');
        const item = menu.find(m => m.id == itemId);
        if (item) {
            pendingCustomization = item;
            resetCustomizeForm();
            show(customizeModal);
        }
    }
};

function resetCustomizeForm() {
    customizeForm.reset();
}

customizeForm.onsubmit = function(e) {
    e.preventDefault();
    if (!pendingCustomization) return;
    const custom = {
        extraCheese: document.getElementById('extra-cheese').checked,
        noOnion: document.getElementById('no-onion').checked,
        spicy: document.getElementById('spicy').checked
    };
    // Find if this item with same customization exists in cart
    let found = false;
    for (let c of cart) {
        if (
            c.id === pendingCustomization.id &&
            JSON.stringify(c.custom) === JSON.stringify(custom)
        ) {
            c.qty++;
            found = true; break;
        }
    }
    if (!found) {
        cart.push({
            ...pendingCustomization,
            qty: 1,
            custom
        });
    }
    renderCart();
    hide(customizeModal);
    pendingCustomization = null;
};
cancelCustomize.onclick = function() {
    hide(customizeModal);
    pendingCustomization = null;
};

// Place order
orderBtn.onclick = function() {
    if (cart.length === 0) return;
    currentOrder = {
        items: JSON.parse(JSON.stringify(cart)),
        statusIndex: 0, created: Date.now()
    };
    cart = [];
    renderCart();
    hide(orderConfirmation);
    renderOrderTracking();
    show(orderTracking);
    advanceOrderStatus();
};

function renderOrderTracking() {
    if (!currentOrder) { orderTracking.innerHTML = ''; hide(orderTracking); return; }
    let html = `<h2>Order Tracking</h2><ol>`;
    orderStatusSteps.forEach((step, idx) => {
        let className = idx < currentOrder.statusIndex
            ? "done"
            : idx === currentOrder.statusIndex
            ? "current"
            : "upcoming";
        html += `<li class="${className}">
            ${step}
            ${idx === currentOrder.statusIndex ? '🟢' : idx < currentOrder.statusIndex ? '✔️' : ''}
        </li>`;
    });
    html += `</ol>`;
    if (currentOrder.statusIndex < orderStatusSteps.length - 1) {
        html += `<button id="refresh-status-btn" style="margin-top:10px;width:100%;">Refresh Status</button>`;
    } else {
        html += `<p>Your order has been delivered. Enjoy!</p>`;
    }
    orderTracking.innerHTML = html;
    // Add button event
    const refreshBtn = document.getElementById('refresh-status-btn');
    if (refreshBtn) refreshBtn.onclick = advanceOrderStatus;
}

function advanceOrderStatus() {
    if (!currentOrder) return;
    if (currentOrder.statusIndex < orderStatusSteps.length - 1) {
        setTimeout(() => {
            currentOrder.statusIndex++;
            renderOrderTracking();
            if (currentOrder.statusIndex < orderStatusSteps.length - 1) {
                advanceOrderStatus();
            }
        }, 3500);
    }
}

// Logout
logoutBtn.onclick = function() {
    currentUser = null;
    cart = [];
    show(authContainer);
    hide(appContainer);
    hide(orderConfirmation);
    hide(orderTracking);
    document.getElementById('login-error').innerText = "";
    document.getElementById('signup-error').innerText = "";
};

// On load, restore state if needed
window.onload = function() {
    if (currentUser) { loginSuccess(); }
};

// Modal click outside to close
customizeModal.addEventListener('click', function(e) {
    if (e.target === customizeModal) {
        hide(customizeModal);
        pendingCustomization = null;
    }
});