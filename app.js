/**
 * Messeorder trendset - Order Management Application
 * 
 * Lokaler Test:
 * 1. Terminal im Projektverzeichnis öffnen
 * 2. HTTP-Server starten: python -m http.server
 * 3. Browser öffnen: http://localhost:8000
 */

class MesseorderApp {
    constructor() {
        this.customers = [];
        this.articles = [];
        this.selectedCustomer = null;
        this.cart = [];
        this.currentOrderId = null;
        
        this.init();
    }

    async init() {
        try {
            this.showMessage('Anwendung wird geladen...', 'info');
            await this.loadData();
            this.setupEventListeners();
            this.showMessage('Anwendung erfolgreich geladen!', 'success');
            setTimeout(() => this.hideMessage(), 2000);
        } catch (error) {
            this.showError('Fehler beim Laden der Anwendung: ' + error.message);
        }
    }

    async loadData() {
        try {
            // Load customers
            const customersResponse = await fetch('kunden.json');
            if (!customersResponse.ok) {
                throw new Error('Kundendaten konnten nicht geladen werden');
            }
            this.customers = await customersResponse.json();

            // Load articles
            const articlesResponse = await fetch('artikel.json');
            if (!articlesResponse.ok) {
                throw new Error('Artikeldaten konnten nicht geladen werden');
            }
            this.articles = await articlesResponse.json();

            console.log(`Geladen: ${this.customers.length} Kunden, ${this.articles.length} Artikel`);
        } catch (error) {
            throw new Error(`Datenfehler: ${error.message}`);
        }
    }

    setupEventListeners() {
        // Customer search
        const customerSearch = document.getElementById('customer-search');
        const searchResults = document.getElementById('search-results');
        
        customerSearch.addEventListener('input', (e) => {
            this.searchCustomers(e.target.value);
        });

        // Customer form buttons
        document.getElementById('new-customer-btn').addEventListener('click', () => {
            this.showNewCustomerForm();
        });

        document.getElementById('clear-customer-btn').addEventListener('click', () => {
            this.clearCustomerSelection();
        });

        document.getElementById('save-customer-btn').addEventListener('click', () => {
            this.saveNewCustomer();
        });

        document.getElementById('cancel-customer-btn').addEventListener('click', () => {
            this.hideNewCustomerForm();
        });

        // Article management
        document.getElementById('add-article-btn').addEventListener('click', () => {
            this.addArticleToCart();
        });

        // Article number input - allow Enter key
        document.getElementById('article-number').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addArticleToCart();
            }
        });

        // Quantity input - allow Enter key
        document.getElementById('article-quantity').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addArticleToCart();
            }
        });

        // Cart management
        document.getElementById('clear-cart-btn').addEventListener('click', () => {
            this.clearCart();
        });

        document.getElementById('proceed-order-btn').addEventListener('click', () => {
            this.showOrderSummary();
        });

        // Order management
        document.getElementById('back-to-cart-btn').addEventListener('click', () => {
            this.backToCart();
        });

        document.getElementById('complete-order-btn').addEventListener('click', () => {
            this.completeOrder();
        });

        document.getElementById('new-order-btn').addEventListener('click', () => {
            this.startNewOrder();
        });
    }

    // Customer Management
    searchCustomers(query) {
        const searchResults = document.getElementById('search-results');
        
        if (!query || query.length < 2) {
            searchResults.classList.add('hidden');
            return;
        }

        const filteredCustomers = this.customers.filter(customer => {
            const searchString = `${customer.name} ${customer.email} ${customer.ort}`.toLowerCase();
            return searchString.includes(query.toLowerCase());
        }).slice(0, 10); // Limit to 10 results

        if (filteredCustomers.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">Keine Kunden gefunden</div>';
        } else {
            searchResults.innerHTML = filteredCustomers.map(customer => 
                `<div class="search-result-item" data-customer-index="${this.customers.indexOf(customer)}">
                    <strong>${customer.name || 'Unbekannt'}</strong><br>
                    <small>${customer.email || ''} | ${customer.ort || ''}</small>
                </div>`
            ).join('');

            // Add click listeners to search results
            searchResults.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const customerIndex = e.currentTarget.getAttribute('data-customer-index');
                    if (customerIndex !== null) {
                        this.selectCustomer(this.customers[customerIndex]);
                    }
                });
            });
        }

        searchResults.classList.remove('hidden');
    }

    selectCustomer(customer) {
        this.selectedCustomer = customer;
        this.displaySelectedCustomer();
        this.hideSearchResults();
        document.getElementById('customer-search').value = customer.name || '';
        this.updateProceedButton();
    }

    displaySelectedCustomer() {
        const selectedCustomerDiv = document.getElementById('selected-customer');
        const customerDetails = document.getElementById('customer-details');
        
        if (this.selectedCustomer) {
            customerDetails.innerHTML = `
                <div class="flex-row">
                    <div>
                        <strong>Firma:</strong> ${this.selectedCustomer.name || 'Nicht angegeben'}<br>
                        <strong>E-Mail:</strong> ${this.selectedCustomer.email || 'Nicht angegeben'}<br>
                        <strong>Telefon:</strong> ${this.selectedCustomer.telefon || 'Nicht angegeben'}
                    </div>
                    <div>
                        <strong>Adresse:</strong><br>
                        ${this.selectedCustomer.strasse || ''}<br>
                        ${this.selectedCustomer.plz || ''} ${this.selectedCustomer.ort || ''}
                    </div>
                </div>
            `;
            selectedCustomerDiv.classList.remove('hidden');
        } else {
            selectedCustomerDiv.classList.add('hidden');
        }
    }

    showNewCustomerForm() {
        document.getElementById('new-customer-form').classList.remove('hidden');
        document.getElementById('new-customer-name').focus();
    }

    hideNewCustomerForm() {
        document.getElementById('new-customer-form').classList.add('hidden');
        this.clearNewCustomerForm();
    }

    clearNewCustomerForm() {
        ['new-customer-name', 'new-customer-email', 'new-customer-street', 
         'new-customer-phone', 'new-customer-zip', 'new-customer-city'].forEach(id => {
            document.getElementById(id).value = '';
        });
    }

    saveNewCustomer() {
        const name = document.getElementById('new-customer-name').value.trim();
        const email = document.getElementById('new-customer-email').value.trim();
        const street = document.getElementById('new-customer-street').value.trim();
        const phone = document.getElementById('new-customer-phone').value.trim();
        const zip = document.getElementById('new-customer-zip').value.trim();
        const city = document.getElementById('new-customer-city').value.trim();

        // Validation
        if (!name) {
            this.showError('Firmenname ist erforderlich');
            return;
        }

        // Create new customer object
        const newCustomer = {
            name: name,
            email: email,
            strasse: street,
            telefon: phone,
            plz: zip,
            ort: city
        };

        // Add to customers array (temporarily - in a real app this would be saved to backend)
        this.customers.push(newCustomer);
        
        // Select the new customer
        this.selectCustomer(newCustomer);
        this.hideNewCustomerForm();
        this.showMessage('Neuer Kunde erfolgreich angelegt!', 'success');
    }

    clearCustomerSelection() {
        this.selectedCustomer = null;
        document.getElementById('customer-search').value = '';
        this.displaySelectedCustomer();
        this.hideSearchResults();
        this.updateProceedButton();
    }

    hideSearchResults() {
        document.getElementById('search-results').classList.add('hidden');
    }

    // Article Management
    addArticleToCart() {
        const articleNumber = document.getElementById('article-number').value.trim();
        const quantity = parseInt(document.getElementById('article-quantity').value) || 1;

        if (!articleNumber) {
            this.showError('Bitte geben Sie eine Artikelnummer ein');
            return;
        }

        if (quantity < 1) {
            this.showError('Menge muss mindestens 1 sein');
            return;
        }

        // Find article
        const article = this.articles.find(a => a.artikelnummer === articleNumber);
        
        if (!article) {
            this.showError(`Artikel mit Nummer "${articleNumber}" wurde nicht gefunden`);
            return;
        }

        // Show article info
        this.displayArticleInfo(article);

        // Check if article already in cart
        const existingCartItem = this.cart.find(item => item.article.artikelnummer === articleNumber);
        
        if (existingCartItem) {
            existingCartItem.quantity += quantity;
        } else {
            this.cart.push({
                article: article,
                quantity: quantity
            });
        }

        this.updateCartDisplay();
        this.updateProceedButton();
        
        // Clear inputs
        document.getElementById('article-number').value = '';
        document.getElementById('article-quantity').value = '1';
        
        this.showMessage(`Artikel "${article.name}" wurde zum Warenkorb hinzugefügt`, 'success');
    }

    displayArticleInfo(article) {
        const articleInfoDiv = document.getElementById('article-info');
        const articleDetails = document.getElementById('article-details');
        
        articleDetails.innerHTML = `
            <strong>${article.name}</strong><br>
            Artikelnummer: ${article.artikelnummer}<br>
            Preis: ${this.formatPrice(article.preis)}<br>
            Einheit: ${article.einheit}
        `;
        
        articleInfoDiv.classList.remove('hidden');
        
        // Hide after 3 seconds
        setTimeout(() => {
            articleInfoDiv.classList.add('hidden');
        }, 3000);
    }

    // Cart Management
    updateCartDisplay() {
        const cartContent = document.getElementById('cart-content');
        const cartSummary = document.getElementById('cart-summary');
        
        if (this.cart.length === 0) {
            cartContent.innerHTML = '<div class="cart-empty">Der Warenkorb ist leer. Fügen Sie Artikel hinzu, um mit der Bestellung zu beginnen.</div>';
            cartSummary.classList.add('hidden');
            return;
        }

        // Generate cart table
        let cartHtml = `
            <table class="cart-table">
                <thead>
                    <tr>
                        <th>Artikel</th>
                        <th>Artikelnr.</th>
                        <th>Preis</th>
                        <th>Menge</th>
                        <th>Gesamt</th>
                        <th>Aktionen</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.cart.forEach((item, index) => {
            const total = item.article.preis * item.quantity;
            cartHtml += `
                <tr>
                    <td>${item.article.name}</td>
                    <td>${item.article.artikelnummer}</td>
                    <td class="text-right">${this.formatPrice(item.article.preis)}</td>
                    <td class="text-center">
                        <div class="quantity-controls">
                            <button class="quantity-btn btn-secondary" onclick="app.updateCartItemQuantity(${index}, ${item.quantity - 1})">-</button>
                            <input type="number" class="quantity-input" value="${item.quantity}" 
                                   onchange="app.updateCartItemQuantity(${index}, parseInt(this.value) || 0)" min="0">
                            <button class="quantity-btn btn-secondary" onclick="app.updateCartItemQuantity(${index}, ${item.quantity + 1})">+</button>
                        </div>
                    </td>
                    <td class="text-right">${this.formatPrice(total)}</td>
                    <td class="text-center">
                        <button class="btn-danger" onclick="app.removeCartItem(${index})" style="width: auto; padding: 0.25rem 0.5rem;">Entfernen</button>
                    </td>
                </tr>
            `;
        });

        cartHtml += '</tbody></table>';
        cartContent.innerHTML = cartHtml;

        // Update summary
        this.updateCartSummary();
        cartSummary.classList.remove('hidden');
    }

    updateCartSummary() {
        const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = this.cart.reduce((sum, item) => sum + (item.article.preis * item.quantity), 0);
        
        document.getElementById('total-items').textContent = totalItems;
        document.getElementById('total-price').textContent = this.formatPrice(totalPrice);
    }

    updateCartItemQuantity(index, newQuantity) {
        if (newQuantity <= 0) {
            this.removeCartItem(index);
            return;
        }
        
        if (this.cart[index]) {
            this.cart[index].quantity = newQuantity;
            this.updateCartDisplay();
            this.updateProceedButton();
        }
    }

    removeCartItem(index) {
        if (this.cart[index]) {
            const itemName = this.cart[index].article.name;
            this.cart.splice(index, 1);
            this.updateCartDisplay();
            this.updateProceedButton();
            this.showMessage(`"${itemName}" wurde aus dem Warenkorb entfernt`, 'info');
        }
    }

    clearCart() {
        if (this.cart.length === 0) {
            this.showError('Der Warenkorb ist bereits leer');
            return;
        }
        
        if (confirm('Möchten Sie wirklich alle Artikel aus dem Warenkorb entfernen?')) {
            this.cart = [];
            this.updateCartDisplay();
            this.updateProceedButton();
            this.showMessage('Warenkorb wurde geleert', 'info');
        }
    }

    updateProceedButton() {
        const proceedBtn = document.getElementById('proceed-order-btn');
        const hasCustomer = this.selectedCustomer !== null;
        const hasItems = this.cart.length > 0;
        
        proceedBtn.disabled = !hasCustomer || !hasItems;
        
        if (!hasCustomer && !hasItems) {
            proceedBtn.textContent = 'Kunde auswählen und Artikel hinzufügen';
        } else if (!hasCustomer) {
            proceedBtn.textContent = 'Kunde auswählen';
        } else if (!hasItems) {
            proceedBtn.textContent = 'Artikel hinzufügen';
        } else {
            proceedBtn.textContent = 'Zur Bestellübersicht';
        }
    }

    // Order Management
    showOrderSummary() {
        if (!this.selectedCustomer || this.cart.length === 0) {
            this.showError('Kunde und Artikel müssen ausgewählt sein');
            return;
        }

        this.currentOrderId = this.generateOrderId();
        const orderSummary = document.getElementById('order-summary');
        
        // Customer information
        let customerInfo = `
            <h3>Kunde</h3>
            <div class="flex-row">
                <div>
                    <strong>Firma:</strong> ${this.selectedCustomer.name || 'Nicht angegeben'}<br>
                    <strong>E-Mail:</strong> ${this.selectedCustomer.email || 'Nicht angegeben'}<br>
                    <strong>Telefon:</strong> ${this.selectedCustomer.telefon || 'Nicht angegeben'}
                </div>
                <div>
                    <strong>Adresse:</strong><br>
                    ${this.selectedCustomer.strasse || ''}<br>
                    ${this.selectedCustomer.plz || ''} ${this.selectedCustomer.ort || ''}
                </div>
            </div>
        `;

        // Order information
        let orderInfo = `
            <h3>Bestelldetails</h3>
            <div class="flex-row">
                <div><strong>Bestell-ID:</strong> ${this.currentOrderId}</div>
                <div><strong>Datum:</strong> ${new Date().toLocaleString('de-DE')}</div>
            </div>
        `;

        // Items table
        let itemsTable = `
            <h3>Bestellte Artikel</h3>
            <table class="cart-table">
                <thead>
                    <tr>
                        <th>Artikel</th>
                        <th>Artikelnr.</th>
                        <th>Preis</th>
                        <th>Menge</th>
                        <th>Gesamt</th>
                    </tr>
                </thead>
                <tbody>
        `;

        let totalAmount = 0;
        this.cart.forEach(item => {
            const itemTotal = item.article.preis * item.quantity;
            totalAmount += itemTotal;
            
            itemsTable += `
                <tr>
                    <td>${item.article.name}</td>
                    <td>${item.article.artikelnummer}</td>
                    <td class="text-right">${this.formatPrice(item.article.preis)}</td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">${this.formatPrice(itemTotal)}</td>
                </tr>
            `;
        });

        itemsTable += `
                </tbody>
                <tfoot>
                    <tr style="background-color: #f8f9fa; font-weight: bold;">
                        <td colspan="4" class="text-right">Gesamtbetrag:</td>
                        <td class="text-right">${this.formatPrice(totalAmount)}</td>
                    </tr>
                </tfoot>
            </table>
        `;

        orderSummary.innerHTML = customerInfo + orderInfo + itemsTable;
        
        // Show order section, hide cart section
        document.getElementById('order-section').classList.remove('hidden');
        document.querySelector('.section:nth-child(4)').style.display = 'none'; // Hide cart section
        
        // Scroll to order section
        document.getElementById('order-section').scrollIntoView({ behavior: 'smooth' });
    }

    backToCart() {
        document.getElementById('order-section').classList.add('hidden');
        document.querySelector('.section:nth-child(4)').style.display = 'block'; // Show cart section
    }

    completeOrder() {
        if (!this.selectedCustomer || this.cart.length === 0) {
            this.showError('Bestellung kann nicht abgeschlossen werden');
            return;
        }

        // In a real application, this would send the order to a backend
        console.log('Order completed:', {
            orderId: this.currentOrderId,
            customer: this.selectedCustomer,
            items: this.cart,
            timestamp: new Date().toISOString(),
            total: this.cart.reduce((sum, item) => sum + (item.article.preis * item.quantity), 0)
        });

        // Show confirmation
        document.getElementById('order-section').classList.add('hidden');
        document.getElementById('confirmation-section').classList.remove('hidden');
        
        // Scroll to confirmation
        document.getElementById('confirmation-section').scrollIntoView({ behavior: 'smooth' });
    }

    startNewOrder() {
        // Reset everything
        this.selectedCustomer = null;
        this.cart = [];
        this.currentOrderId = null;
        
        // Clear form fields
        document.getElementById('customer-search').value = '';
        document.getElementById('article-number').value = '';
        document.getElementById('article-quantity').value = '1';
        
        // Hide sections
        document.getElementById('confirmation-section').classList.add('hidden');
        document.getElementById('order-section').classList.add('hidden');
        document.querySelector('.section:nth-child(4)').style.display = 'block'; // Show cart section
        
        // Update displays
        this.displaySelectedCustomer();
        this.updateCartDisplay();
        this.updateProceedButton();
        this.hideSearchResults();
        this.hideNewCustomerForm();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        this.showMessage('Neue Bestellung gestartet', 'success');
    }

    // Utility functions
    generateOrderId() {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
        const randomStr = Math.random().toString(36).substr(2, 4).toUpperCase();
        return `ORD-${dateStr}-${timeStr}-${randomStr}`;
    }

    formatPrice(price) {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency: 'EUR'
        }).format(price);
    }

    showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('message-container');
        const className = type === 'error' ? 'error-message' : 'success-message';
        
        messageContainer.innerHTML = `<div class="${className}">${message}</div>`;
        messageContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    hideMessage() {
        document.getElementById('message-container').innerHTML = '';
    }
}

// Initialize the application when the page loads
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MesseorderApp();
});

// Add some keyboard shortcuts for better UX
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + Enter to proceed to order when possible
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const proceedBtn = document.getElementById('proceed-order-btn');
        if (!proceedBtn.disabled) {
            proceedBtn.click();
        }
    }
    
    // Escape to clear search results
    if (e.key === 'Escape') {
        if (app) {
            app.hideSearchResults();
        }
    }
});