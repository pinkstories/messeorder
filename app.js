/**
 * Messeorder Application
 * Robuste Anwendung für Messebestellungen mit Kunden- und Artikelverwaltung
 * 
 * Lokales Testen:
 * python -m http.server 8000
 * oder
 * python3 -m http.server 8000
 * Dann http://localhost:8000 im Browser öffnen
 */

// Global application state
let customers = [];
let articles = [];
let currentCustomer = null;
let cart = [];

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialize the application by loading data
 */
async function initializeApp() {
    try {
        await loadCustomers();
        await loadArticles();
        updateCartDisplay();
        console.log('Application initialized successfully');
        console.log(`Loaded ${customers.length} customers and ${articles.length} articles`);
    } catch (error) {
        console.error('Error initializing application:', error);
        showError('Fehler beim Laden der Daten. Bitte stellen Sie sicher, dass die JSON-Dateien verfügbar sind.');
    }
}

/**
 * Load customers from JSON file
 */
async function loadCustomers() {
    try {
        const response = await fetch('kunden.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        customers = await response.json();
        console.log('Customers loaded:', customers.length);
    } catch (error) {
        console.error('Error loading customers:', error);
        throw error;
    }
}

/**
 * Load articles from JSON file
 */
async function loadArticles() {
    try {
        const response = await fetch('artikel.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        articles = await response.json();
        console.log('Articles loaded:', articles.length);
    } catch (error) {
        console.error('Error loading articles:', error);
        throw error;
    }
}

/**
 * Search for customers by name
 */
function searchCustomer() {
    const searchTerm = document.getElementById('customerSearch').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('customerSearchResults');
    
    if (searchTerm.length < 2) {
        resultsDiv.innerHTML = '<div class="error">Bitte geben Sie mindestens 2 Zeichen ein.</div>';
        return;
    }

    const matches = customers.filter(customer => 
        customer.name && customer.name.toLowerCase().includes(searchTerm)
    );

    if (matches.length === 0) {
        resultsDiv.innerHTML = '<div class="error">Keine Kunden gefunden.</div>';
        return;
    }

    let html = '<h4>Gefundene Kunden:</h4>';
    matches.slice(0, 10).forEach((customer, index) => { // Limit to 10 results
        html += `
            <div style="border: 1px solid #ddd; padding: 0.5rem; margin: 0.5rem 0; border-radius: 4px; cursor: pointer;" onclick="selectCustomer(${customers.indexOf(customer)})">
                <strong>${customer.name || 'Unbekannt'}</strong><br>
                ${customer.strasse || ''} ${customer.plz || ''} ${customer.ort || ''}<br>
                ${customer.email || ''}
            </div>
        `;
    });

    if (matches.length > 10) {
        html += `<div class="info">... und ${matches.length - 10} weitere Ergebnisse. Verfeinern Sie die Suche.</div>`;
    }

    resultsDiv.innerHTML = html;
}

/**
 * Select a customer
 */
function selectCustomer(index) {
    currentCustomer = customers[index];
    displaySelectedCustomer();
    document.getElementById('customerSearchResults').innerHTML = '';
    document.getElementById('customerSearch').value = '';
}

/**
 * Display selected customer information
 */
function displaySelectedCustomer() {
    if (!currentCustomer) return;

    document.getElementById('selectedCustomer').style.display = 'block';
    document.getElementById('newCustomerForm').style.display = 'none';
    
    const customerInfo = document.getElementById('customerInfo');
    customerInfo.innerHTML = `
        <p><strong>Name:</strong> ${currentCustomer.name || 'Nicht angegeben'}</p>
        <p><strong>Adresse:</strong> ${currentCustomer.strasse || ''} ${currentCustomer.plz || ''} ${currentCustomer.ort || ''}</p>
        <p><strong>E-Mail:</strong> ${currentCustomer.email || 'Nicht angegeben'}</p>
        <p><strong>Telefon:</strong> ${currentCustomer.telefon || 'Nicht angegeben'}</p>
    `;

    updateOrderButton();
}

/**
 * Clear selected customer
 */
function clearCustomer() {
    currentCustomer = null;
    document.getElementById('selectedCustomer').style.display = 'none';
    document.getElementById('newCustomerForm').style.display = 'block';
    updateOrderButton();
}

/**
 * Create a new customer
 */
function createCustomer() {
    const name = document.getElementById('newCustomerName').value.trim();
    const street = document.getElementById('newCustomerStreet').value.trim();
    const zip = document.getElementById('newCustomerZip').value.trim();
    const city = document.getElementById('newCustomerCity').value.trim();
    const email = document.getElementById('newCustomerEmail').value.trim();
    const phone = document.getElementById('newCustomerPhone').value.trim();

    // Clear previous errors
    document.getElementById('nameError').textContent = '';
    document.getElementById('customerMessage').innerHTML = '';

    // Validate required fields
    if (!name) {
        document.getElementById('nameError').textContent = 'Firmenname ist erforderlich.';
        document.getElementById('newCustomerName').focus();
        return;
    }

    // Validate email format if provided
    if (email && !isValidEmail(email)) {
        document.getElementById('customerMessage').innerHTML = '<div class="error">Bitte geben Sie eine gültige E-Mail-Adresse ein.</div>';
        return;
    }

    // Create new customer object
    const newCustomer = {
        name: name,
        strasse: street,
        plz: zip,
        ort: city,
        email: email,
        telefon: phone
    };

    // Add to customers array and select
    customers.push(newCustomer);
    currentCustomer = newCustomer;
    
    // Clear form
    clearNewCustomerForm();
    
    // Display success message and selected customer
    document.getElementById('customerMessage').innerHTML = '<div class="success">Kunde erfolgreich angelegt!</div>';
    setTimeout(() => {
        displaySelectedCustomer();
    }, 1000);
}

/**
 * Clear new customer form
 */
function clearNewCustomerForm() {
    document.getElementById('newCustomerName').value = '';
    document.getElementById('newCustomerStreet').value = '';
    document.getElementById('newCustomerZip').value = '';
    document.getElementById('newCustomerCity').value = '';
    document.getElementById('newCustomerEmail').value = '';
    document.getElementById('newCustomerPhone').value = '';
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Search for articles by name
 */
function searchArticle() {
    const searchTerm = document.getElementById('articleSearch').value.trim().toLowerCase();
    const resultsDiv = document.getElementById('articleSearchResults');
    
    if (searchTerm.length < 2) {
        resultsDiv.innerHTML = '<div class="error">Bitte geben Sie mindestens 2 Zeichen ein.</div>';
        return;
    }

    const matches = articles.filter(article => 
        article.name && article.name.toLowerCase().includes(searchTerm)
    );

    if (matches.length === 0) {
        resultsDiv.innerHTML = '<div class="error">Keine Artikel gefunden.</div>';
        return;
    }

    let html = '<h4>Gefundene Artikel:</h4>';
    matches.slice(0, 15).forEach(article => { // Limit to 15 results
        html += `
            <div style="border: 1px solid #ddd; padding: 0.5rem; margin: 0.5rem 0; border-radius: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center;" onclick="selectArticleFromSearch('${article.artikelnummer}')">
                <div>
                    <strong>${article.artikelnummer}</strong> - ${article.name}<br>
                    <small>Einheit: ${article.einheit} | Preis: ${formatCurrency(article.preis)}</small>
                </div>
                <button class="btn-small btn-success" onclick="event.stopPropagation(); selectArticleFromSearch('${article.artikelnummer}')">+</button>
            </div>
        `;
    });

    if (matches.length > 15) {
        html += `<div class="info">... und ${matches.length - 15} weitere Ergebnisse. Verfeinern Sie die Suche.</div>`;
    }

    resultsDiv.innerHTML = html;
}

/**
 * Select article from search results
 */
function selectArticleFromSearch(articleNumber) {
    document.getElementById('articleNumber').value = articleNumber;
    document.getElementById('articleQuantity').value = 1;
    document.getElementById('articleSearchResults').innerHTML = '';
    document.getElementById('articleSearch').value = '';
    addArticle();
}

/**
 * Add article to cart
 */
function addArticle() {
    const articleNumber = document.getElementById('articleNumber').value.trim();
    const quantity = parseInt(document.getElementById('articleQuantity').value) || 1;
    const messageDiv = document.getElementById('articleMessage');

    // Clear previous messages
    messageDiv.innerHTML = '';

    // Validate inputs
    if (!articleNumber) {
        messageDiv.innerHTML = '<div class="error">Bitte geben Sie eine Artikelnummer ein.</div>';
        return;
    }

    if (quantity <= 0) {
        messageDiv.innerHTML = '<div class="error">Menge muss größer als 0 sein.</div>';
        return;
    }

    // Find article
    const article = articles.find(a => a.artikelnummer === articleNumber);
    if (!article) {
        messageDiv.innerHTML = '<div class="error">Artikel mit der Nummer "' + articleNumber + '" nicht gefunden.</div>';
        return;
    }

    // Check if article already in cart
    const existingCartItem = cart.find(item => item.artikelnummer === articleNumber);
    if (existingCartItem) {
        existingCartItem.quantity += quantity;
        messageDiv.innerHTML = '<div class="success">Menge für "' + article.name + '" aktualisiert.</div>';
    } else {
        // Add to cart
        cart.push({
            artikelnummer: article.artikelnummer,
            name: article.name,
            einheit: article.einheit,
            preis: article.preis,
            quantity: quantity
        });
        messageDiv.innerHTML = '<div class="success">"' + article.name + '" zum Warenkorb hinzugefügt.</div>';
    }

    // Clear inputs and update display
    document.getElementById('articleNumber').value = '';
    document.getElementById('articleQuantity').value = 1;
    updateCartDisplay();
    
    // Clear message after 3 seconds
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 3000);
}

/**
 * Update cart display
 */
function updateCartDisplay() {
    const cartEmpty = document.getElementById('cartEmpty');
    const cartContent = document.getElementById('cartContent');
    const cartItems = document.getElementById('cartItems');

    if (cart.length === 0) {
        cartEmpty.style.display = 'block';
        cartContent.style.display = 'none';
        updateOrderButton();
        return;
    }

    cartEmpty.style.display = 'none';
    cartContent.style.display = 'block';

    // Generate cart table rows
    let html = '';
    let total = 0;
    
    cart.forEach((item, index) => {
        const lineTotal = item.preis * item.quantity;
        total += lineTotal;
        
        html += `
            <tr>
                <td>${item.artikelnummer}</td>
                <td>${item.name}</td>
                <td class="text-center">
                    <button class="btn-small btn-secondary" onclick="updateQuantity(${index}, ${item.quantity - 1})">-</button>
                    <span style="margin: 0 0.5rem;">${item.quantity}</span>
                    <button class="btn-small btn-secondary" onclick="updateQuantity(${index}, ${item.quantity + 1})">+</button>
                </td>
                <td class="text-center">${item.einheit}</td>
                <td class="text-right">${formatCurrency(item.preis)}</td>
                <td class="text-right">${formatCurrency(lineTotal)}</td>
                <td class="text-center">
                    <button class="btn-small btn-danger" onclick="removeFromCart(${index})">🗑️</button>
                </td>
            </tr>
        `;
    });

    cartItems.innerHTML = html;
    document.getElementById('totalAmount').textContent = formatCurrency(total);
    updateOrderButton();
}

/**
 * Update quantity of cart item
 */
function updateQuantity(index, newQuantity) {
    if (newQuantity <= 0) {
        removeFromCart(index);
        return;
    }
    
    cart[index].quantity = newQuantity;
    updateCartDisplay();
}

/**
 * Remove item from cart
 */
function removeFromCart(index) {
    if (confirm('Möchten Sie diesen Artikel wirklich aus dem Warenkorb entfernen?')) {
        cart.splice(index, 1);
        updateCartDisplay();
    }
}

/**
 * Clear entire cart
 */
function clearCart() {
    if (cart.length === 0) return;
    
    if (confirm('Möchten Sie den gesamten Warenkorb leeren?')) {
        cart = [];
        updateCartDisplay();
    }
}

/**
 * Update order button state
 */
function updateOrderButton() {
    const button = document.getElementById('showOrderBtn');
    const canShowOrder = currentCustomer && cart.length > 0;
    
    button.disabled = !canShowOrder;
    
    if (!currentCustomer && cart.length > 0) {
        button.title = 'Bitte wählen Sie einen Kunden aus';
    } else if (currentCustomer && cart.length === 0) {
        button.title = 'Warenkorb ist leer';
    } else if (!canShowOrder) {
        button.title = 'Kunde und Artikel erforderlich';
    } else {
        button.title = 'Bestellung anzeigen';
    }
}

/**
 * Show order summary
 */
function showOrder() {
    if (!currentCustomer || cart.length === 0) {
        alert('Bitte wählen Sie einen Kunden aus und fügen Sie Artikel hinzu.');
        return;
    }

    const orderContent = document.getElementById('orderContent');
    const total = cart.reduce((sum, item) => sum + (item.preis * item.quantity), 0);
    
    let html = `
        <div style="max-width: 800px; margin: 0 auto;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <h3>🧾 Bestellbestätigung</h3>
                <p>Erstellt am: ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')}</p>
            </div>

            <div style="background: #f8f9fa; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
                <h4>👤 Kunde:</h4>
                <p><strong>${currentCustomer.name}</strong></p>
                ${currentCustomer.strasse ? `<p>${currentCustomer.strasse}</p>` : ''}
                ${currentCustomer.plz || currentCustomer.ort ? `<p>${currentCustomer.plz} ${currentCustomer.ort}</p>` : ''}
                ${currentCustomer.email ? `<p>📧 ${currentCustomer.email}</p>` : ''}
                ${currentCustomer.telefon ? `<p>📞 ${currentCustomer.telefon}</p>` : ''}
            </div>

            <div style="margin-bottom: 2rem;">
                <h4>📦 Bestellte Artikel:</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #d14e67; color: white;">
                            <th style="padding: 0.75rem; text-align: left;">Artikel-Nr.</th>
                            <th style="padding: 0.75rem; text-align: left;">Bezeichnung</th>
                            <th style="padding: 0.75rem; text-align: center;">Menge</th>
                            <th style="padding: 0.75rem; text-align: center;">Einheit</th>
                            <th style="padding: 0.75rem; text-align: right;">Einzelpreis</th>
                            <th style="padding: 0.75rem; text-align: right;">Gesamt</th>
                        </tr>
                    </thead>
                    <tbody>
    `;

    cart.forEach(item => {
        const lineTotal = item.preis * item.quantity;
        html += `
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 0.75rem;">${item.artikelnummer}</td>
                <td style="padding: 0.75rem;">${item.name}</td>
                <td style="padding: 0.75rem; text-align: center;">${item.quantity}</td>
                <td style="padding: 0.75rem; text-align: center;">${item.einheit}</td>
                <td style="padding: 0.75rem; text-align: right;">${formatCurrency(item.preis)}</td>
                <td style="padding: 0.75rem; text-align: right;"><strong>${formatCurrency(lineTotal)}</strong></td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>

            <div style="background: #e8f5e8; padding: 1.5rem; border-radius: 8px; text-align: right;">
                <h3 style="margin: 0; color: #2e7d32;">Gesamtsumme: ${formatCurrency(total)}</h3>
            </div>

            <div style="margin-top: 2rem; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; background: #fff9c4;">
                <p><strong>📋 Hinweise:</strong></p>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                    <li>Alle Preise verstehen sich zzgl. MwSt.</li>
                    <li>Lieferzeit: 2-3 Werktage</li>
                    <li>Bei Rückfragen wenden Sie sich an unser Service-Team</li>
                </ul>
            </div>
        </div>
    `;

    orderContent.innerHTML = html;
    document.getElementById('orderSummary').style.display = 'block';
    
    // Scroll to order summary
    document.getElementById('orderSummary').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Hide order summary
 */
function hideOrder() {
    document.getElementById('orderSummary').style.display = 'none';
}

/**
 * Print order
 */
function printOrder() {
    window.print();
}

/**
 * Format currency value
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('de-DE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Show error message
 */
function showError(message) {
    // Create error notification
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 1rem;
        border-radius: 6px;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

// Keyboard shortcuts and enhanced UX
document.addEventListener('keydown', function(e) {
    // Enter key in article number field adds article
    if (e.key === 'Enter' && document.activeElement.id === 'articleNumber') {
        e.preventDefault();
        addArticle();
    }
    
    // Enter key in customer search field searches
    if (e.key === 'Enter' && document.activeElement.id === 'customerSearch') {
        e.preventDefault();
        searchCustomer();
    }
    
    // Enter key in article search field searches
    if (e.key === 'Enter' && document.activeElement.id === 'articleSearch') {
        e.preventDefault();
        searchArticle();
    }
});

// Auto-focus article number field when quantity is set
document.getElementById('articleQuantity')?.addEventListener('input', function() {
    if (this.value && document.getElementById('articleNumber').value) {
        // If both fields have values, user might want to add the article
        document.getElementById('articleNumber').focus();
    }
});

// Debug functions for development
window.debugApp = {
    getCustomers: () => customers,
    getArticles: () => articles,
    getCurrentCustomer: () => currentCustomer,
    getCart: () => cart,
    clearAll: () => {
        currentCustomer = null;
        cart = [];
        clearCustomer();
        updateCartDisplay();
        console.log('Application state cleared');
    }
};

console.log('🛍️ Messeorder App loaded successfully!');
console.log('Debug functions available: window.debugApp');