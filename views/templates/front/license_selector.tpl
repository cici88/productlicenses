{**
 * Frontend template for license selection - Updated v2
 * Path: modules/productlicenses/views/templates/front/license_selector.tpl
 *}

<div class="product-licenses-wrapper" id="product-licenses-{$id_product}" data-product-id="{$id_product}">
    <h3 class="license-title">
        <i class="material-icons">verified_user</i>
        {l s='Choose Your License' mod='productlicenses'}
    </h3>
    
    <div class="license-options">
        {foreach from=$licenses key=license_key item=license}
            <div class="license-option">
                <label class="license-card {if $license_key == 'personal'}active{/if}" 
                       for="license_{$license_key}_{$id_product}">
                    <input type="radio" 
                           name="product_license_{$id_product}" 
                           id="license_{$license_key}_{$id_product}" 
                           value="{$license_key}" 
                           data-price="{$license.price|string_format:'%.6f'}"
                           data-increase="{$license.increase}"
                           class="license-radio"
                           {if $license_key == 'personal'}checked="checked"{/if}>
                    
                    <div class="license-content">
                        <div class="license-header">
                            <span class="license-name">{$license.name}</span>
                            {if $license.increase > 0}
                                <span class="license-badge">+{$license.increase}%</span>
                            {elseif $license.increase == 0}
                                <span class="license-badge license-badge-base">{l s='Base Price' mod='productlicenses'}</span>
                            {/if}
                        </div>
                        
                        <div class="license-price">
                            {displayPrice price=$license.price}
                        </div>
                        
                        <div class="license-description">
                            {$license.description}
                        </div>
                        
                        <div class="license-features">
                            {if $license_key == 'personal'}
                                <ul>
                                    <li><i class="material-icons">check</i> {l s='Personal projects only' mod='productlicenses'}</li>
                                    <li><i class="material-icons">check</i> {l s='Single end product' mod='productlicenses'}</li>
                                    <li><i class="material-icons">check</i> {l s='No commercial use' mod='productlicenses'}</li>
                                </ul>
                            {elseif $license_key == 'commercial'}
                                <ul>
                                    <li><i class="material-icons">check</i> {l s='Commercial projects' mod='productlicenses'}</li>
                                    <li><i class="material-icons">check</i> {l s='Multiple end products' mod='productlicenses'}</li>
                                    <li><i class="material-icons">check</i> {l s='Client projects allowed' mod='productlicenses'}</li>
                                    <li><i class="material-icons">check</i> {l s='Lifetime updates' mod='productlicenses'}</li>
                                </ul>
                            {elseif $license_key == 'extended'}
                                <ul>
                                    <li><i class="material-icons">check</i> {l s='All commercial rights' mod='productlicenses'}</li>
                                    <li><i class="material-icons">check</i> {l s='Resale rights included' mod='productlicenses'}</li>
                                    <li><i class="material-icons">check</i> {l s='Unlimited end products' mod='productlicenses'}</li>
                                    <li><i class="material-icons">check</i> {l s='Priority support' mod='productlicenses'}</li>
                                    <li><i class="material-icons">check</i> {l s='White-label allowed' mod='productlicenses'}</li>
                                </ul>
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
    
    <div class="license-info-box">
        <i class="material-icons">info</i>
        <p>{l s='All licenses include lifetime access to the product. Choose the license that best fits your intended use.' mod='productlicenses'}</p>
    </div>
</div>
