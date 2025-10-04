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
                
                // Update add to cart form
                updateAddToCartForm(productId, selectedLicense, selectedPrice);
                
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
        
        // Initialize with default license
        var defaultRadio = wrapper.querySelector('.license-radio:checked');
        if (defaultRadio) {
            var defaultPrice = parseFloat(defaultRadio.getAttribute('data-price'));
            var defaultLicense = defaultRadio.value;
            updateAddToCartForm(productId, defaultLicense, defaultPrice);
        }
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
     * Update add to cart form with license info
     */
    function updateAddToCartForm(productId, license, price) {
        // Find all add to cart forms
        var forms = document.querySelectorAll('form[action*="cart"]');
        
        forms.forEach(function(form) {
            // Remove existing license inputs
            var existingLicense = form.querySelector('input[name="product_license"]');
            var existingPrice = form.querySelector('input[name="product_license_price"]');
            
            if (existingLicense) existingLicense.remove();
            if (existingPrice) existingPrice.remove();
            
            // Add new hidden inputs
            var licenseInput = document.createElement('input');
            licenseInput.type = 'hidden';
            licenseInput.name = 'product_license';
            licenseInput.value = license;
            form.appendChild(licenseInput);
            
            var priceInput = document.createElement('input');
            priceInput.type = 'hidden';
            priceInput.name = 'product_license_price';
            priceInput.value = price;
            form.appendChild(priceInput);
        });
        
        console.log('Form updated with license:', license, 'price:', price);
    }
});

/**
 * PrestaShop event listeners
 */
if (typeof prestashop !== 'undefined') {
    prestashop.on('updateProduct', function(event) {
        console.log('Product updated, reinitializing licenses');
        // Trigger change event on selected license to update form
        setTimeout(function() {
            var selectedRadio = document.querySelector('.license-radio:checked');
            if (selectedRadio) {
                selectedRadio.dispatchEvent(new Event('change'));
            }
        }, 100);
    });
    
    prestashop.on('updatedProduct', function(event) {
        console.log('Product update completed');
    });
}
// Osiguraj da se licenca šalje pri dodavanju u korpu
document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-button-action="add-to-cart"]');
    if (target) {
        var selectedRadio = document.querySelector('.license-radio:checked');
        if (selectedRadio) {
            console.log('Add to cart clicked with license:', selectedRadio.value);
        }
    }
});
