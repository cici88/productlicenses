/**
 * Frontend JavaScript for Product Licenses
 * Path: modules/productlicenses/views/js/front.js
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get all license wrappers on the page
    var licenseWrappers = document.querySelectorAll('.product-licenses-wrapper');
    
    licenseWrappers.forEach(function(wrapper) {
        var productId = wrapper.id.replace('product-licenses-', '');
        var radioButtons = wrapper.querySelectorAll('.license-radio');
        var licenseCards = wrapper.querySelectorAll('.license-card');
        
        // Store original price
        var priceElement = document.querySelector('.product-prices .current-price-value');
        var originalPrice = null;
        
        if (priceElement) {
            originalPrice = parseFloat(priceElement.textContent.replace(/[^0-9.,]/g, '').replace(',', '.'));
        }
        
        // Handle license selection
        radioButtons.forEach(function(radio) {
            radio.addEventListener('change', function() {
                var selectedPrice = parseFloat(this.getAttribute('data-price'));
                var selectedIncrease = parseFloat(this.getAttribute('data-increase'));
                var selectedLicense = this.value;
                
                // Update hidden field
                var hiddenField = document.getElementById('selected_license_' + productId);
                if (hiddenField) {
                    hiddenField.value = selectedLicense;
                }
                
                // Remove active class from all cards
                licenseCards.forEach(function(card) {
                    card.classList.remove('active');
                });
                
                // Add active class to selected card
                var selectedCard = this.closest('.license-card');
                if (selectedCard) {
                    selectedCard.classList.add('active');
                }
                
                // Update product price display
                if (priceElement && selectedPrice) {
                    updatePrice(priceElement, selectedPrice);
                }
                
                // Update quantity input if exists
                updateQuantityData(selectedLicense, selectedPrice);
                
                console.log('License selected:', selectedLicense, 'Price:', selectedPrice);
            });
        });
        
        // Handle card click
        licenseCards.forEach(function(card) {
            card.addEventListener('click', function(e) {
                if (e.target.tagName !== 'INPUT') {
                    var radio = this.querySelector('.license-radio');
                    if (radio) {
                        radio.checked = true;
                        radio.dispatchEvent(new Event('change'));
                    }
                }
            });
        });
    });
    
    /**
     * Update price display with animation
     */
    function updatePrice(element, newPrice) {
        // Add animation class
        element.classList.add('price-updating');
        
        // Format price
        var formattedPrice = newPrice.toFixed(2);
        var currencySign = element.textContent.match(/[€$£¥]/);
        
        // Update price
        setTimeout(function() {
            if (currencySign) {
                element.textContent = formattedPrice + ' ' + currencySign[0];
            } else {
                element.textContent = formattedPrice;
            }
            
            // Remove animation class
            setTimeout(function() {
                element.classList.remove('price-updating');
            }, 500);
        }, 150);
    }
    
    /**
     * Update quantity/add to cart data with license info
     */
    function updateQuantityData(license, price) {
        var addToCartForm = document.querySelector('form[action*="cart"]');
        if (addToCartForm) {
            // Remove existing license input if any
            var existingInput = addToCartForm.querySelector('input[name="product_license"]');
            if (existingInput) {
                existingInput.remove();
            }
            
            // Add new hidden input with license info
            var licenseInput = document.createElement('input');
            licenseInput.type = 'hidden';
            licenseInput.name = 'product_license';
            licenseInput.value = license;
            addToCartForm.appendChild(licenseInput);
            
            // Add price input
            var priceInput = document.createElement('input');
            priceInput.type = 'hidden';
            priceInput.name = 'product_license_price';
            priceInput.value = price;
            addToCartForm.appendChild(priceInput);
        }
    }
    
    /**
     * Handle add to cart with license info
     */
    var addToCartButtons = document.querySelectorAll('.add-to-cart, button[data-button-action="add-to-cart"]');
    addToCartButtons.forEach(function(button) {
        button.addEventListener('click', function(e) {
            var licenseWrapper = document.querySelector('.product-licenses-wrapper');
            if (licenseWrapper) {
                var selectedRadio = licenseWrapper.querySelector('.license-radio:checked');
                if (selectedRadio) {
                    var license = selectedRadio.value;
                    var price = selectedRadio.getAttribute('data-price');
                    
                    // Store in session/local storage for cart
                    try {
                        var cartLicenses = JSON.parse(sessionStorage.getItem('cart_licenses') || '{}');
                        var productId = licenseWrapper.id.replace('product-licenses-', '');
                        cartLicenses[productId] = {
                            license: license,
                            price: price
                        };
                        sessionStorage.setItem('cart_licenses', JSON.stringify(cartLicenses));
                    } catch (e) {
                        console.error('Error storing license info:', e);
                    }
                }
            }
        });
    });
});

/**
 * PrestaShop event listeners
 */
if (typeof prestashop !== 'undefined') {
    prestashop.on('updateProduct', function(event) {
        // Reinitialize license selectors if product is updated via AJAX
        console.log('Product updated, reinitializing licenses');
    });
    
    prestashop.on('updatedProduct', function(event) {
        // Handle product update completion
        console.log('Product update completed');
    });
}