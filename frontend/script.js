// ============================================================
// LOST & FOUND - AUTHENTICATED FRONTEND
// ============================================================

const API_BASE_URL = "https://find-the-object-3.onrender.com/api"; const IMAGE_BASE_URL = "https://find-the-object-3.onrender.com";

const $ = (id) => document.getElementById(id);

const authScreen = $("authScreen");
const dashboardScreen = $("dashboardScreen");

const notificationContainer = $("notificationContainer");

const loginTab = $("loginTab");
const registerTab = $("registerTab");
const loginForm = $("loginForm");
const registerForm = $("registerForm");
const authTitle = $("authTitle");
const authSubtitle = $("authSubtitle");

const loginEmail = $("loginEmail");
const loginPassword = $("loginPassword");

const registerName = $("registerName");
const registerEmail = $("registerEmail");
const registerPassword = $("registerPassword");
const registerConfirmPassword = $("registerConfirmPassword");

const authThemeButton = $("authThemeButton");
const authThemeIcon = $("authThemeIcon");
const authThemeText = $("authThemeText");

const themeToggleButton = $("themeToggleButton");
const themeIcon = $("themeIcon");
const themeText = $("themeText");
const logoutButton = $("logoutButton");

const currentUserName = $("currentUserName");
const userAvatar = $("userAvatar");

const totalItemsCount = $("totalItemsCount");
const totalCategoriesCount = $("totalCategoriesCount");
const totalLocationsCount = $("totalLocationsCount");

const findNavButton = $("findNavButton");
const addNavButton = $("addNavButton");
const savedNavButton = $("savedNavButton");

const findSection = $("findSection");
const addSection = $("addSection");
const savedSection = $("savedSection");

const findForm = $("findForm");
const findInput = $("findInput");
const findResult = $("findResult");

const itemForm = $("itemForm");
const itemName = $("itemName");
const itemCategory = $("itemCategory");
const itemLocation = $("itemLocation");
const itemDescription = $("itemDescription");
const addDescriptionCounter = $("addDescriptionCounter");

const itemImage = $("itemImage");
const imagePreviewContainer = $("imagePreviewContainer");
const imagePreview = $("imagePreview");
const imageFileName = $("imageFileName");
const removeImageButton = $("removeImageButton");

const itemsList = $("itemsList");
const refreshItemsButton = $("refreshItemsButton");
const searchInput = $("searchInput");
const categoryFilter = $("categoryFilter");
const locationFilter = $("locationFilter");
const clearFiltersButton = $("clearFiltersButton");
const filterResultInfo = $("filterResultInfo");

const editModal = $("editModal");
const editModalOverlay = $("editModalOverlay");
const closeEditModalButton = $("closeEditModalButton");
const cancelEditButton = $("cancelEditButton");
const editItemForm = $("editItemForm");

const editItemName = $("editItemName");
const editItemCategory = $("editItemCategory");
const editItemLocation = $("editItemLocation");
const editItemDescription = $("editItemDescription");
const editDescriptionCounter = $("editDescriptionCounter");

const editCurrentImage = $("editCurrentImage");
const editNoImage = $("editNoImage");
const editItemImage = $("editItemImage");
const editImagePreviewContainer = $("editImagePreviewContainer");
const editImagePreview = $("editImagePreview");
const editImageFileName = $("editImageFileName");
const removeEditImageButton = $("removeEditImageButton");
const saveEditButton = $("saveEditButton");

let token = localStorage.getItem("lostFoundToken") || "";
let currentUser = null;

let allItems = [];
let currentEditingItemId = null;
let addImageObjectUrl = null;
let editImageObjectUrl = null;
let savedItemsLoaded = false;

// ============================================================
// HELPERS
// ============================================================

const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

const getImageUrl = (imagePath) => {
    if (!imagePath) return "";

    const path = String(imagePath).trim();
    if (!path) return "";

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    return `${IMAGE_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};

const getApiErrorMessage = async (response) => {
    try {
        const data = await response.json();
        return data.message || `Request failed (${response.status}).`;
    } catch {
        return `Request failed (${response.status}).`;
    }
};

const authHeaders = () => ({
    Authorization: `Bearer ${token}`
});

const authJsonHeaders = () => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
});

// ============================================================
// NOTIFICATIONS
// ============================================================

const showNotification = (type, title, message = "", duration = 4000) => {
    if (!notificationContainer) return null;

    const icons = {
        success: "✓",
        error: "✕",
        warning: "!",
        info: "ℹ",
        loading: `<span class="notification-spinner"></span>`
    };

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;

    notification.innerHTML = `
        <div class="notification-icon">${icons[type] || "ℹ"}</div>
        <div class="notification-content">
            <div class="notification-title">${escapeHtml(title)}</div>
            ${message ? `<div class="notification-message">${escapeHtml(message)}</div>` : ""}
        </div>
        <button class="notification-close" type="button" aria-label="Close">×</button>
    `;

    notificationContainer.appendChild(notification);

    const remove = () => {
        if (!notification.parentElement) return;
        notification.style.animation = "notificationOut .2s ease-out forwards";
        setTimeout(() => notification.remove(), 200);
    };

    notification.querySelector(".notification-close").addEventListener("click", remove);

    if (duration > 0) {
        setTimeout(remove, duration);
    }

    return { close: remove };
};

const showSuccess = (title, message = "") =>
    showNotification("success", title, message, 3500);

const showError = (title, message = "") =>
    showNotification("error", title, message, 5000);

const showWarning = (title, message = "") =>
    showNotification("warning", title, message, 4500);

const showInfo = (title, message = "") =>
    showNotification("info", title, message, 4000);

const showLoading = (title, message = "") =>
    showNotification("loading", title, message, 0);

// ============================================================
// THEME
// ============================================================

const applyTheme = (theme) => {
    const safeTheme = theme === "dark" ? "dark" : "light";

    document.documentElement.dataset.theme = safeTheme;
    localStorage.setItem("lostFoundTheme", safeTheme);

    const isDark = safeTheme === "dark";

    authThemeIcon.textContent = isDark ? "☀️" : "🌙";
    authThemeText.textContent = isDark ? "Light" : "Dark";

    themeIcon.textContent = isDark ? "☀️" : "🌙";
    themeText.textContent = isDark ? "Light" : "Dark";
};

const toggleTheme = () => {
    const current = document.documentElement.dataset.theme || "light";
    applyTheme(current === "dark" ? "light" : "dark");
};

authThemeButton.addEventListener("click", toggleTheme);
themeToggleButton.addEventListener("click", toggleTheme);

applyTheme(localStorage.getItem("lostFoundTheme") || "light");

// ============================================================
// AUTH TABS
// ============================================================

const showLoginForm = () => {
    loginTab.classList.add("active");
    registerTab.classList.remove("active");

    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");

    authTitle.textContent = "Sign in";
    authSubtitle.textContent = "Sign in to access your saved items.";
};

const showRegisterForm = () => {
    registerTab.classList.add("active");
    loginTab.classList.remove("active");

    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");

    authTitle.textContent = "Create account";
    authSubtitle.textContent = "Create your account and start saving items.";
};

loginTab.addEventListener("click", showLoginForm);
registerTab.addEventListener("click", showRegisterForm);

// ============================================================
// PASSWORD SHOW / HIDE
// ============================================================

document.querySelectorAll(".password-toggle").forEach((button) => {
    button.addEventListener("click", () => {
        const target = $(button.dataset.target);
        if (!target) return;

        const showing = target.type === "text";
        target.type = showing ? "password" : "text";
        button.textContent = showing ? "Show" : "Hide";
    });
});

// ============================================================
// AUTH API
// ============================================================

const setAuthenticatedUser = (authData) => {
    token = authData.token;
    currentUser = authData.user;

    localStorage.setItem("lostFoundToken", token);

    updateUserUI();
    authScreen.classList.add("hidden");
    dashboardScreen.classList.remove("hidden");

    resetDashboardView();
    loadDashboardSummary();
};

const clearSession = () => {
    token = "";
    currentUser = null;
    localStorage.removeItem("lostFoundToken");

    allItems = [];
    savedItemsLoaded = false;

    closeEditModal();

    dashboardScreen.classList.add("hidden");
    authScreen.classList.remove("hidden");

    totalItemsCount.textContent = "0";
    totalCategoriesCount.textContent = "0";
    totalLocationsCount.textContent = "0";

    itemsList.innerHTML = `<p class="empty-message">Click “Saved Items” to load your collection.</p>`;
};

const updateUserUI = () => {
    const name = currentUser?.name || "User";
    currentUserName.textContent = name;
    userAvatar.textContent = name.trim().charAt(0).toUpperCase() || "U";
};

const login = async (event) => {
    event.preventDefault();

    const email = loginEmail.value.trim().toLowerCase();
    const password = loginPassword.value;

    if (!email || !password) {
        showWarning("Missing information", "Enter your email and password.");
        return;
    }

    const submitButton = loginForm.querySelector("button[type='submit']");
    const originalText = submitButton.textContent;
    const loading = showLoading("Signing in", "Checking your account...");

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Signing in...";

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!response.ok) {
            throw new Error(await getApiErrorMessage(response));
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Login failed.");
        }

        if (loading) loading.close();

        setAuthenticatedUser(data.data);

        loginForm.reset();

        showSuccess("Welcome back!", `Signed in as ${data.data.user.name}.`);
    } catch (error) {
        if (loading) loading.close();

        showError(
            "Login failed",
            error.message || "Unable to sign in."
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
};

const register = async (event) => {
    event.preventDefault();

    const name = registerName.value.trim();
    const email = registerEmail.value.trim().toLowerCase();
    const password = registerPassword.value;
    const confirmPassword = registerConfirmPassword.value;

    if (!name || !email || !password || !confirmPassword) {
        showWarning("Missing information", "Please fill all registration fields.");
        return;
    }

    if (password.length < 6) {
        showWarning("Weak password", "Password must contain at least 6 characters.");
        return;
    }

    if (password !== confirmPassword) {
        showWarning("Passwords do not match", "Please enter the same password twice.");
        return;
    }

    const submitButton = registerForm.querySelector("button[type='submit']");
    const originalText = submitButton.textContent;
    const loading = showLoading("Creating account", "Setting up your account...");

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Creating...";

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });

        if (!response.ok) {
            throw new Error(await getApiErrorMessage(response));
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Registration failed.");
        }

        if (loading) loading.close();

        setAuthenticatedUser(data.data);
        registerForm.reset();

        showSuccess(
            "Account created",
            `Welcome, ${data.data.user.name}!`
        );
    } catch (error) {
        if (loading) loading.close();

        showError(
            "Registration failed",
            error.message || "Unable to create your account."
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
};

loginForm.addEventListener("submit", login);
registerForm.addEventListener("submit", register);

logoutButton.addEventListener("click", () => {
    const confirmed = window.confirm("Do you want to log out?");
    if (!confirmed) return;

    clearSession();
    showInfo("Logged out", "You have been safely signed out.");
});

// ============================================================
// SESSION RESTORE
// ============================================================

const restoreSession = async () => {
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: authHeaders()
        });

        if (!response.ok) {
            throw new Error("Session expired.");
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error("Session expired.");
        }

        currentUser = data.data.user;
        updateUserUI();

        authScreen.classList.add("hidden");
        dashboardScreen.classList.remove("hidden");

        resetDashboardView();
        await loadDashboardSummary();
    } catch {
        clearSession();
    }
};

// ============================================================
// DASHBOARD SUMMARY
// IMPORTANT: this loads statistics immediately after login.
// It does NOT render the Saved Items cards.
// ============================================================

const loadDashboardSummary = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/items/summary`, {
            headers: authHeaders()
        });

        if (response.status === 401) {
            clearSession();
            return;
        }

        if (!response.ok) {
            throw new Error(await getApiErrorMessage(response));
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Unable to load summary.");
        }

        const summary = data.data;

        totalItemsCount.textContent = summary.totalItems ?? 0;
        totalCategoriesCount.textContent = summary.totalCategories ?? 0;
        totalLocationsCount.textContent = summary.totalLocations ?? 0;
    } catch (error) {
        console.error("Summary error:", error);

        totalItemsCount.textContent = "—";
        totalCategoriesCount.textContent = "—";
        totalLocationsCount.textContent = "—";

        showError(
            "Dashboard summary unavailable",
            error.message || "Unable to load your item statistics."
        );
    }
};

// ============================================================
// NAVIGATION
// ============================================================

const resetDashboardView = () => {
    showSection("find", false);

    findInput.value = "";
    findResult.className = "find-result";
    findResult.innerHTML = "";

    searchInput.value = "";
    categoryFilter.value = "";
    locationFilter.value = "";

    allItems = [];
    savedItemsLoaded = false;

    itemsList.innerHTML = `<p class="empty-message">Click “Saved Items” to load your collection.</p>`;
};

const showSection = (sectionName, shouldLoadSaved = true) => {
    [findSection, addSection, savedSection].forEach(section => {
        section.classList.add("hidden");
    });

    [findNavButton, addNavButton, savedNavButton].forEach(button => {
        button.classList.remove("active");
    });

    if (sectionName === "find") {
        findSection.classList.remove("hidden");
        findNavButton.classList.add("active");
    }

    if (sectionName === "add") {
        addSection.classList.remove("hidden");
        addNavButton.classList.add("active");
    }

    if (sectionName === "saved") {
        savedSection.classList.remove("hidden");
        savedNavButton.classList.add("active");

        if (shouldLoadSaved) {
            loadSavedItems();
        }
    }
};

findNavButton.addEventListener("click", () => showSection("find"));
addNavButton.addEventListener("click", () => showSection("add"));
savedNavButton.addEventListener("click", () => showSection("saved"));

// ============================================================
// SAVED ITEMS
// ============================================================

const loadSavedItems = async () => {
    itemsList.innerHTML = `<p class="empty-message">Loading your saved items...</p>`;

    try {
        const response = await fetch(`${API_BASE_URL}/items`, {
            headers: authHeaders()
        });

        if (response.status === 401) {
            clearSession();
            return;
        }

        if (!response.ok) {
            throw new Error(await getApiErrorMessage(response));
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Unable to load saved items.");
        }

        allItems = Array.isArray(data.data) ? data.data : [];
        savedItemsLoaded = true;

        populateFilters(allItems);
        applyFilters();
    } catch (error) {
        console.error("Load saved items error:", error);

        allItems = [];
        savedItemsLoaded = false;

        itemsList.innerHTML = `<p class="empty-message">Unable to load your saved items.</p>`;

        showError(
            "Unable to load items",
            error.message || "Please check that the backend is running."
        );
    }
};

const populateFilters = (items) => {
    const currentCategory = categoryFilter.value;
    const currentLocation = locationFilter.value;

    const categories = [];
    const locations = [];

    items.forEach(item => {
        const category = String(item.category || "").trim();
        const location = String(item.location || "").trim();

        if (
            category &&
            !categories.some(v => v.toLowerCase() === category.toLowerCase())
        ) {
            categories.push(category);
        }

        if (
            location &&
            !locations.some(v => v.toLowerCase() === location.toLowerCase())
        ) {
            locations.push(location);
        }
    });

    categories.sort((a, b) => a.localeCompare(b));
    locations.sort((a, b) => a.localeCompare(b));

    categoryFilter.innerHTML = `<option value="">All Categories</option>`;
    locationFilter.innerHTML = `<option value="">All Locations</option>`;

    categories.forEach(category => {
        const option = document.createElement("option");
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });

    locations.forEach(location => {
        const option = document.createElement("option");
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });

    categoryFilter.value =
        categories.find(v => v.toLowerCase() === currentCategory.toLowerCase()) || "";

    locationFilter.value =
        locations.find(v => v.toLowerCase() === currentLocation.toLowerCase()) || "";
};

const applyFilters = () => {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value.trim().toLowerCase();
    const selectedLocation = locationFilter.value.trim().toLowerCase();

    const filteredItems = allItems.filter(item => {
        const name = String(item.name || "").toLowerCase();
        const category = String(item.category || "").toLowerCase();
        const location = String(item.location || "").toLowerCase();
        const description = String(item.description || "").toLowerCase();

        const matchesSearch =
            !searchTerm ||
            name.includes(searchTerm) ||
            category.includes(searchTerm) ||
            location.includes(searchTerm) ||
            description.includes(searchTerm);

        const matchesCategory =
            !selectedCategory || category === selectedCategory;

        const matchesLocation =
            !selectedLocation || location === selectedLocation;

        return matchesSearch && matchesCategory && matchesLocation;
    });

    renderItems(filteredItems);
    updateFilterInfo(filteredItems.length, allItems.length);
};

const updateFilterInfo = (filteredCount, totalCount) => {
    const hasFilter =
        searchInput.value.trim() ||
        categoryFilter.value ||
        locationFilter.value;

    if (!hasFilter) {
        filterResultInfo.classList.add("hidden");
        filterResultInfo.textContent = "";
        return;
    }

    filterResultInfo.classList.remove("hidden");
    filterResultInfo.textContent = `Showing ${filteredCount} of ${totalCount} items`;
};

const renderItems = (items) => {
    if (!items.length) {
        itemsList.innerHTML = `
            <div class="empty-message">
                ${savedItemsLoaded ? "No items match your filters." : "Click “Saved Items” to load your collection."}
            </div>
        `;
        return;
    }

    itemsList.innerHTML = items.map(item => {
        const itemId = escapeHtml(item._id);
        const name = escapeHtml(item.name);
        const category = escapeHtml(item.category);
        const location = escapeHtml(item.location);
        const description = escapeHtml(item.description);

        const imageHtml = item.image
            ? `
                <div class="item-image-container">
                    <img
                        src="${escapeHtml(getImageUrl(item.image))}"
                        alt="${name}"
                        class="item-card-image"
                        loading="lazy"
                        onerror="this.parentElement.innerHTML='<div class=&quot;item-image-placeholder&quot;>🖼️</div>';"
                    >
                </div>
            `
            : `<div class="item-image-placeholder">🖼️</div>`;

        return `
            <article class="item-card">
                ${imageHtml}

                <div class="item-card-content">
                    <h4>${name}</h4>
                    <p>Category: ${category}</p>
                    <p class="item-location">📍 ${location}</p>
                    ${description ? `<p class="item-description">${description}</p>` : ""}

                    <div class="item-actions">
                        <button class="edit-button" type="button" data-edit-id="${itemId}">Edit</button>
                        <button class="delete-button" type="button" data-delete-id="${itemId}">Delete</button>
                    </div>
                </div>
            </article>
        `;
    }).join("");
};

itemsList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-id]");
    const deleteButton = event.target.closest("[data-delete-id]");

    if (editButton) {
        editItem(editButton.dataset.editId);
        return;
    }

    if (deleteButton) {
        deleteItem(deleteButton.dataset.deleteId);
    }
});

searchInput.addEventListener("input", applyFilters);
categoryFilter.addEventListener("change", applyFilters);
locationFilter.addEventListener("change", applyFilters);

clearFiltersButton.addEventListener("click", () => {
    searchInput.value = "";
    categoryFilter.value = "";
    locationFilter.value = "";

    applyFilters();
    showInfo("Filters cleared", "Showing all saved items.");
});

refreshItemsButton.addEventListener("click", async () => {
    const loading = showLoading("Refreshing items", "Please wait...");

    await loadSavedItems();

    if (loading) loading.close();

    await loadDashboardSummary();

    showSuccess("Items refreshed", `${allItems.length} item(s) loaded.`);
});

// ============================================================
// ADD ITEM
// ============================================================

const validateImage = (file) => {
    if (!file) return false;

    if (file.size > 5 * 1024 * 1024) {
        showError("Image too large", "Image size should be less than 5 MB.");
        return false;
    }

    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.type)) {
        showError("Invalid image", "Please select JPG, PNG or WEBP.");
        return false;
    }

    return true;
};

const resetAddImage = () => {
    if (addImageObjectUrl) {
        URL.revokeObjectURL(addImageObjectUrl);
        addImageObjectUrl = null;
    }

    itemImage.value = "";
    imagePreview.removeAttribute("src");
    imageFileName.textContent = "";
    imagePreviewContainer.classList.add("hidden");
};

itemImage.addEventListener("change", () => {
    const file = itemImage.files[0];

    if (!file) {
        resetAddImage();
        return;
    }

    if (!validateImage(file)) {
        resetAddImage();
        return;
    }

    if (addImageObjectUrl) {
        URL.revokeObjectURL(addImageObjectUrl);
    }

    addImageObjectUrl = URL.createObjectURL(file);
    imagePreview.src = addImageObjectUrl;
    imageFileName.textContent = file.name;
    imagePreviewContainer.classList.remove("hidden");
});

removeImageButton.addEventListener("click", resetAddImage);

itemDescription.addEventListener("input", () => {
    addDescriptionCounter.textContent = itemDescription.value.length;
});

itemForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = itemName.value.trim();
    const category = itemCategory.value.trim();
    const location = itemLocation.value.trim();
    const description = itemDescription.value.trim();

    if (!name || !category || !location) {
        showWarning("Missing information", "Name, category and location are required.");
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("location", location);
    formData.append("description", description);

    const imageFile = itemImage.files[0];

    if (imageFile) {
        if (!validateImage(imageFile)) return;
        formData.append("image", imageFile);
    }

    const submitButton = itemForm.querySelector("button[type='submit']");
    const originalText = submitButton.textContent;
    const loading = showLoading("Adding item", "Saving your item...");

    try {
        submitButton.disabled = true;
        submitButton.textContent = "Adding...";

        const response = await fetch(`${API_BASE_URL}/items`, {
            method: "POST",
            headers: authHeaders(),
            body: formData
        });

        if (response.status === 401) {
            clearSession();
            return;
        }

        if (!response.ok) {
            throw new Error(await getApiErrorMessage(response));
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Failed to add item.");
        }

        if (loading) loading.close();

        itemForm.reset();
        addDescriptionCounter.textContent = "0";
        resetAddImage();

        await loadDashboardSummary();

        showSuccess("Item added successfully", `${name} has been saved.`);

        showSection("saved");
    } catch (error) {
        if (loading) loading.close();

        showError(
            "Unable to add item",
            error.message || "Unable to connect to backend."
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
    }
});

// ============================================================
// FIND ITEM
// ============================================================

findForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const searchTerm = findInput.value.trim();

    if (!searchTerm) {
        findResult.className = "find-result error";
        findResult.innerHTML = `
            <h3>⚠️ Enter an item name</h3>
            <p>Please enter something such as keys, wallet, bottle, etc.</p>
        `;
        showWarning("Search required", "Enter an item name to search.");
        return;
    }

    const loading = showLoading("Searching", "Looking through your saved items...");

    findResult.className = "find-result info";
    findResult.innerHTML = `<p>Searching...</p>`;

    try {
        const response = await fetch(
            `${API_BASE_URL}/items?search=${encodeURIComponent(searchTerm)}`,
            { headers: authHeaders() }
        );

        if (response.status === 401) {
            clearSession();
            return;
        }

        if (!response.ok) {
            throw new Error(await getApiErrorMessage(response));
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Search failed.");
        }

        const matches = Array.isArray(data.data) ? data.data : [];

        if (loading) loading.close();

        if (!matches.length) {
            findResult.className = "find-result error";
            findResult.innerHTML = `
                <h3>❌ Item not found</h3>
                <p>Nothing matched <strong>"${escapeHtml(searchTerm)}"</strong>.</p>
                <p style="margin-top:8px;">Try another item name, category or location.</p>
            `;
            showInfo("No matching item", `Nothing matched "${searchTerm}".`);
            return;
        }

        if (matches.length === 1) {
            const item = matches[0];

            const imageHtml = item.image
                ? `
                    <div class="find-item-image">
                        <img
                            src="${escapeHtml(getImageUrl(item.image))}"
                            alt="${escapeHtml(item.name)}"
                            onerror="this.style.display='none';"
                        >
                    </div>
                `
                : "";

            findResult.className = "find-result success";
            findResult.innerHTML = `
                <h3>🔎 Item Found</h3>
                ${imageHtml}
                <p class="found-item-name">${escapeHtml(item.name)}</p>
                <p>📍 <strong>Location:</strong> ${escapeHtml(item.location)}</p>
                <p>🗂️ <strong>Category:</strong> ${escapeHtml(item.category)}</p>
                ${item.description ? `<p style="margin-top:8px;">${escapeHtml(item.description)}</p>` : ""}
            `;

            showSuccess("Item found", `${item.name} is in ${item.location}.`);
            return;
        }

        findResult.className = "find-result success";

        findResult.innerHTML = `
            <h3>🔎 ${matches.length} Items Found</h3>
            ${matches.map(item => `
                <div class="find-multiple-result">
                    ${item.image
                ? `<img class="find-multiple-image" src="${escapeHtml(getImageUrl(item.image))}" alt="${escapeHtml(item.name)}">`
                : `<div class="find-multiple-image" style="display:grid;place-items:center;background:var(--surface-2);">🖼️</div>`
            }
                    <div>
                        <p class="found-item-name">${escapeHtml(item.name)}</p>
                        <p>📍 ${escapeHtml(item.location)}</p>
                        <p>Category: ${escapeHtml(item.category)}</p>
                    </div>
                </div>
            `).join("")}
        `;

        showSuccess("Search complete", `${matches.length} matching items found.`);
    } catch (error) {
        if (loading) loading.close();

        findResult.className = "find-result error";
        findResult.innerHTML = `
            <h3>❌ Search failed</h3>
            <p>${escapeHtml(error.message || "Unable to search.")}</p>
        `;

        showError("Search failed", error.message || "Unable to search.");
    }
});

// ============================================================
// EDIT ITEM
// ============================================================

const resetEditImagePreview = () => {
    if (editImageObjectUrl) {
        URL.revokeObjectURL(editImageObjectUrl);
        editImageObjectUrl = null;
    }

    editItemImage.value = "";
    editImagePreview.removeAttribute("src");
    editImageFileName.textContent = "";
    editImagePreviewContainer.classList.add("hidden");
};

const editItem = (id) => {
    const item = allItems.find(current => String(current._id) === String(id));

    if (!item) {
        showError("Item not found", "The selected item could not be found.");
        return;
    }

    currentEditingItemId = item._id;

    editItemName.value = item.name || "";
    editItemCategory.value = item.category || "";
    editItemLocation.value = item.location || "";
    editItemDescription.value = item.description || "";
    editDescriptionCounter.textContent = editItemDescription.value.length;

    resetEditImagePreview();

    if (item.image) {
        editCurrentImage.src = getImageUrl(item.image);
        editCurrentImage.classList.remove("hidden");
        editNoImage.classList.add("hidden");
    } else {
        editCurrentImage.removeAttribute("src");
        editCurrentImage.classList.add("hidden");
        editNoImage.classList.remove("hidden");
    }

    editModal.classList.remove("hidden");
    editModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    setTimeout(() => editItemName.focus(), 100);
};

editItemImage.addEventListener("change", () => {
    const file = editItemImage.files[0];

    if (!file) {
        resetEditImagePreview();
        return;
    }

    if (!validateImage(file)) {
        resetEditImagePreview();
        return;
    }

    if (editImageObjectUrl) {
        URL.revokeObjectURL(editImageObjectUrl);
    }

    editImageObjectUrl = URL.createObjectURL(file);
    editImagePreview.src = editImageObjectUrl;
    editImageFileName.textContent = file.name;
    editImagePreviewContainer.classList.remove("hidden");
});

editDescriptionCounter.textContent = editItemDescription.value.length;

editItemDescription.addEventListener("input", () => {
    editDescriptionCounter.textContent = editItemDescription.value.length;
});

removeEditImageButton.addEventListener("click", resetEditImagePreview);

const closeEditModal = () => {
    editModal.classList.add("hidden");
    editModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    currentEditingItemId = null;

    editItemForm.reset();
    editDescriptionCounter.textContent = "0";
    resetEditImagePreview();

    editCurrentImage.removeAttribute("src");
    editCurrentImage.classList.add("hidden");
    editNoImage.classList.remove("hidden");
};

closeEditModalButton.addEventListener("click", closeEditModal);
cancelEditButton.addEventListener("click", closeEditModal);
editModalOverlay.addEventListener("click", closeEditModal);

document.addEventListener("keydown", (event) => {
    if (
        event.key === "Escape" &&
        !editModal.classList.contains("hidden")
    ) {
        closeEditModal();
    }
});

editItemForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!currentEditingItemId) {
        showWarning("No item selected", "Please select an item to edit.");
        return;
    }

    const name = editItemName.value.trim();
    const category = editItemCategory.value.trim();
    const location = editItemLocation.value.trim();
    const description = editItemDescription.value.trim();

    if (!name || !category || !location) {
        showWarning("Missing information", "Name, category and location are required.");
        return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("category", category);
    formData.append("location", location);
    formData.append("description", description);

    const newImage = editItemImage.files[0];

    if (newImage) {
        if (!validateImage(newImage)) return;
        formData.append("image", newImage);
    }

    const originalText = saveEditButton.textContent;
    const loading = showLoading("Saving changes", "Updating your item...");

    try {
        saveEditButton.disabled = true;
        saveEditButton.textContent = "Saving...";

        const response = await fetch(
            `${API_BASE_URL}/items/${encodeURIComponent(currentEditingItemId)}`,
            {
                method: "PUT",
                headers: authHeaders(),
                body: formData
            }
        );

        if (response.status === 401) {
            clearSession();
            return;
        }

        if (!response.ok) {
            throw new Error(await getApiErrorMessage(response));
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Failed to update item.");
        }

        if (loading) loading.close();

        closeEditModal();

        showSuccess("Item updated", `${name} has been updated.`);

        await loadSavedItems();
        await loadDashboardSummary();
    } catch (error) {
        if (loading) loading.close();

        showError(
            "Unable to update item",
            error.message || "Unable to update item."
        );
    } finally {
        saveEditButton.disabled = false;
        saveEditButton.textContent = originalText;
    }
});

// ============================================================
// DELETE ITEM
// ============================================================

const deleteItem = async (id) => {
    const item = allItems.find(current => String(current._id) === String(id));

    if (!item) {
        showError("Item not found", "The selected item could not be found.");
        return;
    }

    const confirmed = window.confirm(
        `Are you sure you want to delete "${item.name}"?`
    );

    if (!confirmed) return;

    const loading = showLoading(
        "Deleting item",
        `Removing ${item.name}...`
    );

    try {
        const response = await fetch(
            `${API_BASE_URL}/items/${encodeURIComponent(id)}`,
            {
                method: "DELETE",
                headers: authHeaders()
            }
        );

        if (response.status === 401) {
            clearSession();
            return;
        }

        if (!response.ok) {
            throw new Error(await getApiErrorMessage(response));
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || "Failed to delete item.");
        }

        if (loading) loading.close();

        showSuccess("Item deleted", `${item.name} has been removed.`);

        await loadSavedItems();
        await loadDashboardSummary();
    } catch (error) {
        if (loading) loading.close();

        showError(
            "Unable to delete item",
            error.message || "Unable to delete item."
        );
    }
};

// ============================================================
// INITIALIZE
// ============================================================

editModal.classList.add("hidden");
editModal.setAttribute("aria-hidden", "true");
dashboardScreen.classList.add("hidden");

restoreSession();
