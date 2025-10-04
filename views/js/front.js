/**
 * Frontend JavaScript for Product Licenses Module v2
 * Path: modules/productlicenses/views/js/front.js
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Product Licenses Module: Initializing...');
    initializeLicenseSelectors();
    
    // PrestaShop event compatibility
    if (typeof prestashop !== 'undefined') {
        prestashop.on('updateProduct', function() {
            console.log('Product Licenses: Product updated, reinitializing...');
            setTimeout(initializeLicenseSelectors, 100);
        });
        
        prestashop.on('updatedProduct', function() {
            console.log('Product Licenses: Product update completed');
        });
    }
});

/**
 * Initialize all license selectors on the page
 */
function initializeLicenseSelectors() {
    const wrappers = document.querySelectorAll('.product-licenses-wrapper');
    
    if (wrappers.length === 0) {
        console.log('Product Licenses: No license selectors found on page');
        return;
    }
    
    console.log('Product Licenses: Found ' + wrappers.length + ' license selector(s)');
    
    wrappers.forEach(function(wrapper) {
        const productId = wrapper.dataset.productId || wrapper.id.replace('product-licenses-', '');
        const radioButtons = wrapper.querySelectorAll('.license-radio');
        const addToCartForm = document.querySelector('form[action*="cart"]');
        
        console.log('Product Licenses: Initializing for product ID: ' + productId);
        
        if (radioButtons.length === 0) {
            console.warn('Product Licenses: No radio buttons found for product ' + productId);
            return;
        }
        
        // Add change event listeners to radio buttons
        radioButtons.forEach(function(radio) {
            radio.addEventListener('change', function() {
                const licenseType = this.value;
                const price = parseFloat(this.dataset.price);
                const increase = parseFloat(this.dataset.increase);
                
                console.log('License selected:', {
                    type: licenseType,
                    price: price,
                    increase: increase
                });
                
                // Update UI
                updateActiveCard(wrapper, this);
                updateProductPrice(price);
                
                // Update form data
                if (addToCartForm) {
                    updateFormData(addToCartForm, licenseType, price, productId);
                }
                
                // Trigger custom event for extensibility
                const event = new CustomEvent('licenseChanged', {
                    detail: { 
                        license: licenseType, 
                        price: price,
                        increase: increase,
                        productId: productId
                    }
                });
                document.dispatchEvent(event);
            });
        });
        
        // Add click event to cards (for better UX)
        const licenseCards = wrapper.querySelectorAll('.license-card');
        licenseCards.forEach(function(card) {
            card.addEventListener('click', function(e) {
                // Don't trigger if clicking the radio button directly
                if (e.target.tagName !== 'INPUT') {
                    const radio = this.querySelector('.license-radio');
                    if (radio && !radio.disabled) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            });
        });
        
        // Set default selection if none selected
        const checkedRadio = wrapper.querySelector('.license-radio:checked');
        if (!checkedRadio && radioButtons.length > 0) {
            const firstRadio = radioButtons[0];
            firstRadio.checked = true;
            firstRadio.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Product Licenses: Set default selection to ' + firstRadio.value);
        } else if (checkedRadio) {
            // Trigger change event for initial setup
            checkedRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });
}

/**
 * Update the visual active state of license cards
 * @param {HTMLElement} wrapper - The license wrapper element
 * @param {HTMLElement} selectedRadio - The selected radio button
 */
function updateActiveCard(wrapper, selectedRadio) {
    // Remove active class from all cards
    const allCards = wrapper.querySelectorAll('.license-card');
    allCards.forEach(function(card) {
        card.classList.remove('active');
    });
    
    // Add active class to selected card
    const selectedCard = selectedRadio.closest('.license-card');
    if (selectedCard) {
        selectedCard.classList.add('active');
        console.log('Product Licenses: Updated active card');
    }
}

/**
 * Update the product price display with animation
 * @param {number} newPrice - The new price to display
 */
function updateProductPrice(newPrice) {
    // Find price elements (multiple selectors for compatibility)
    const priceSelectors = [
        '.product-price .current-price-value',
        '.product-prices .current-price-value',
        '.current-price .current-price-value',
        '[itemprop="price"]'
    ];
    
    let priceElement = null;
    for (let i = 0; i < priceSelectors.length; i++) {
        priceElement = document.querySelector(priceSelectors[i]);
        if (priceElement) {
            console.log('Product Licenses: Found price element with selector: ' + priceSelectors[i]);
            break;
        }
    }
    
    if (!priceElement) {
        console.warn('Product Licenses: Price element not found');
        return;
    }
    
    // Extract currency symbol
    const currentText = priceElement.textContent;
    const currencyMatch = currentText.match(/[€$£¥₹]/);
    const currency = currencyMatch ? currencyMatch[0] : '';
    
    // Check for currency position (before or after)
    const currencyBefore = currentText.indexOf(currency) < currentText.search(/\d/);
    
    // Add animation class
    priceElement.classList.add('price-updating');
    priceElement.style.transition = 'opacity 0.2s ease';
    priceElement.style.opacity = '0.5';
    
    // Update price after fade out
    setTimeout(function() {
        const formattedPrice = newPrice.toFixed(2);
        
        if (currencyBefore && currency) {
            priceElement.textContent = currency + formattedPrice;
        } else if (currency) {
            priceElement.textContent = formattedPrice + ' ' + currency;
        } else {
            priceElement.textContent = formattedPrice;
        }
        
        // Update price attribute if exists
        if (priceElement.hasAttribute('content')) {
            priceElement.setAttribute('content', newPrice);
        }
        
        // Fade back in
        priceElement.style.opacity = '1';
        
        console.log('Product Licenses: Updated price to ' + formattedPrice + ' ' + currency);
        
        // Remove animation class after completion
        setTimeout(function() {
            priceElement.classList.remove('price-updating');
        }, 300);
    }, 200);
}

/**
 * Update form with hidden inputs for license data
 * @param {HTMLFormElement} form - The add to cart form
 * @param {string} license - The license type
 * @param {number} price - The license price
 * @param {string} productId - The product ID
 */
function updateFormData(form, license, price, productId) {
    if (!form) {
        console.warn('Product Licenses: Form not found');
        return;
    }
    
    // Remove old inputs if they exist
    const inputsToRemove = ['product_license', 'product_license_price', 'product_license_id'];
    inputsToRemove.forEach(function(name) {
        const oldInput = form.querySelector('input[name="' + name + '"]');
        if (oldInput) {
            oldInput.remove();
        }
    });
    
    // Add new hidden inputs
    const inputs = {
        'product_license': license,
        'product_license_price': price.toFixed(6),
        'product_license_id': productId
    };
    
    Object.keys(inputs).forEach(function(name) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = name;
        input.value = inputs[name];
        form.appendChild(input);
    });
    
    console.log('Product Licenses: Updated form data', inputs);
}

/**
 * Handle add to cart button clicks
 */
function setupAddToCartHandlers() {
    const addToCartButtons = document.querySelectorAll(
        '.add-to-cart, button[data-button-action="add-to-cart"], .btn-primary[type="submit"]'
    );
    
    addToCartButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            const licenseWrapper = document.querySelector('.product-licenses-wrapper');
            
            if (licenseWrapper) {
                const selectedRadio = licenseWrapper.querySelector('.license-radio:checked');
                
                if (!selectedRadio) {
                    e.preventDefault();
                    alert('Please select a license type before adding to cart.');
                    console.warn('Product Licenses: No license selected');
                    return false;
                }
                
                const license = selectedRadio.value;
                const price = selectedRadio.dataset.price;
                const productId = licenseWrapper.dataset.productId || licenseWrapper.id.replace('product-licenses-', '');
                
                console.log('Product Licenses: Adding to cart with license:', {
                    license: license,
                    price: price,
                    productId: productId
                });
                
                // Store in sessionStorage for backup
                try {
                    const cartLicenses = JSON.parse(sessionStorage.getItem('cart_licenses') || '{}');
                    cartLicenses[productId] = {
                        license: license,
                        price: price,
                        timestamp: new Date().getTime()
                    };
                    sessionStorage.setItem('cart_licenses', JSON.stringify(cartLicenses));
                    console.log('Product Licenses: Saved to sessionStorage');
                } catch (error) {
                    console.error('Product Licenses: Error storing in sessionStorage:', error);
                }
            }
        });
    });
}

// Initialize add to cart handlers
setupAddToCartHandlers();

/**
 * Custom event listeners for extensibility
 */
document.addEventListener('licenseChanged', function(e) {
    console.log('Product Licenses: License changed event fired', e.detail);
    
    // You can add custom logic here
    // For example, update other elements, send analytics, etc.
});

/**
 * Handle PrestaShop cart updates
 */
if (typeof prestashop !== 'undefined') {
    prestashop.on('updateCart', function(event) {
        console.log('Product Licenses: Cart updated');
        
        // Re-initialize if needed
        const licenseWrappers = document.querySelectorAll('.product-licenses-wrapper');
        if (licenseWrappers.length > 0) {
            console.log('Product Licenses: Re-checking license selections after cart update');
        }
    });
    
    prestashop.on('cart', function(event) {
        console.log('Product Licenses: Cart event', event);
    });
}

/**
 * Clean up old sessionStorage entries (older than 24 hours)
 */
function cleanupSessionStorage() {
    try {
        const cartLicenses = JSON.parse(sessionStorage.getItem('cart_licenses') || '{}');
        const now = new Date().getTime();
        const dayInMs = 24 * 60 * 60 * 1000;
        let cleaned = false;
        
        Object.keys(cartLicenses).forEach(function(key) {
            if (cartLicenses[key].timestamp && (now - cartLicenses[key].timestamp > dayInMs)) {
                delete cartLicenses[key];
                cleaned = true;
            }
        });
        
        if (cleaned) {
            sessionStorage.setItem('cart_licenses', JSON.stringify(cartLicenses));
            console.log('Product Licenses: Cleaned up old sessionStorage entries');
        }
    } catch (error) {
        console.error('Product Licenses: Error cleaning sessionStorage:', error);
    }
}

// Run cleanup on load
cleanupSessionStorage();

/**
 * Debug function - can be called from console
 */
window.productLicensesDebug = function() {
    console.log('=== Product Licenses Debug Info ===');
    
    const wrappers = document.querySelectorAll('.product-licenses-wrapper');
    console.log('License wrappers found:', wrappers.length);
    
    wrappers.forEach(function(wrapper, index) {
        console.log('Wrapper ' + (index + 1) + ':', {
            id: wrapper.id,
            productId: wrapper.dataset.productId,
            radioButtons: wrapper.querySelectorAll('.license-radio').length,
            selectedLicense: wrapper.querySelector('.license-radio:checked')?.value
        });
    });
    
    const form = document.querySelector('form[action*="cart"]');
    if (form) {
        console.log('Cart form found');
        const licenseInput = form.querySelector('input[name="product_license"]');
        if (licenseInput) {
            console.log('License input value:', licenseInput.value);
        } else {
            console.log('No license input in form');
        }
    } else {
        console.log('Cart form not found');
    }
    
    try {
        const cartLicenses = JSON.parse(sessionStorage.getItem('cart_licenses') || '{}');
        console.log('SessionStorage cart_licenses:', cartLicenses);
    } catch (e) {
        console.log('Error reading sessionStorage:', e);
    }
    
    console.log('=== End Debug Info ===');
};

console.log('Product Licenses Module: Initialization complete. Run productLicensesDebug() for debug info.');
