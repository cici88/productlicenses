{**
 * Frontend template for license selection
 * Path: modules/productlicenses/views/templates/front/license_selector.tpl
 *}

<div class="product-licenses-wrapper" id="product-licenses-{$id_product}">
    <h3 class="license-title">{l s='Choose Your License' mod='productlicenses'}</h3>
    
    <div class="license-options">
        {foreach from=$licenses key=license_key item=license}
            <div class="license-option">
                <label class="license-card {if $license_key == 'personal'}active{/if}" 
                       for="license_{$license_key}_{$id_product}">
                    <input type="radio" 
                           name="product_license_{$id_product}" 
                           id="license_{$license_key}_{$id_product}" 
                           value="{$license_key}" 
                           data-price="{$license.price}"
                           data-increase="{$license.increase}"
                           class="license-radio"
                           {if $license_key == 'personal'}checked="checked"{/if}>
                    
                    <div class="license-content">
                        <div class="license-header">
                            <span class="license-name">{$license.name}</span>
                            {if $license.increase > 0}
                                <span class="license-badge">+{$license.increase}%</span>
                            {/if}
                        </div>
                        
                        <div class="license-price">
                            {$license.price|string_format:"%.2f"} {$currency_sign}
                        </div>
                        
                        <div class="license-description">
                            {if $license_key == 'personal'}
                                {l s='For personal use only. Cannot be used in commercial projects.' mod='productlicenses'}
                            {elseif $license_key == 'commercial'}
                                {l s='For use in commercial projects. Includes commercial rights.' mod='productlicenses'}
                            {elseif $license_key == 'extended'}
                                {l s='Full rights including resale and redistribution. Unlimited usage.' mod='productlicenses'}
                            {/if}
                        </div>
                    </div>
                    
                    <div class="license-checkmark">
                        <i class="material-icons">check_circle</i>
                    </div>
                </label>
            </div>
        {/foreach}
    </div>
    
    <input type="hidden" 
           name="selected_license" 
           id="selected_license_{$id_product}" 
           value="personal">
</div>

<script type="text/javascript">
// Add selected license to cart
if (typeof prestashop !== 'undefined') {
    prestashop.on('updateCart', function(event) {
        var selectedLicense = document.querySelector('input[name="product_license_{$id_product}"]:checked');
        if (selectedLicense) {
            // Store license info in customization or cart
            console.log('Selected license:', selectedLicense.value);
        }
    });
}
</script>