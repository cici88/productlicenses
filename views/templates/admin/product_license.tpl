{**
 * Admin template for enabling licenses on product
 * Path: modules/productlicenses/views/templates/admin/product_license.tpl
 *}

<div class="panel product-tab">
    <h3><i class="icon-certificate"></i> {l s='Product Licenses' mod='productlicenses'}</h3>
    
    <div class="form-wrapper">
        <div class="form-group">
            <label class="control-label col-lg-3">
                <span class="label-tooltip" data-toggle="tooltip" 
                      title="{l s='Enable license selection for this virtual product' mod='productlicenses'}">
                    {l s='Enable License Types' mod='productlicenses'}
                </span>
            </label>
            <div class="col-lg-9">
                <span class="switch prestashop-switch fixed-width-lg">
                    <input type="radio" 
                           name="license_enabled" 
                           id="license_enabled_on" 
                           value="1" 
                           {if $license_enabled}checked="checked"{/if}>
                    <label for="license_enabled_on">{l s='Yes' mod='productlicenses'}</label>
                    
                    <input type="radio" 
                           name="license_enabled" 
                           id="license_enabled_off" 
                           value="0" 
                           {if !$license_enabled}checked="checked"{/if}>
                    <label for="license_enabled_off">{l s='No' mod='productlicenses'}</label>
                    
                    <a class="slide-button btn"></a>
                </span>
                <p class="help-block">
                    {l s='When enabled, customers can choose between Personal, Commercial, and Extended licenses.' mod='productlicenses'}
                    <br>
                    {l s='The price will automatically adjust based on the selected license type.' mod='productlicenses'}
                </p>
            </div>
        </div>
        
        <div class="alert alert-info">
            <i class="icon-info-circle"></i>
            {l s='Configure license price percentages in module configuration.' mod='productlicenses'}
            <br>
            <a href="{$smarty.server.REQUEST_URI|escape:'html':'UTF-8'}&configure=productlicenses" class="btn btn-default btn-sm" style="margin-top: 10px;">
                <i class="icon-cog"></i> {l s='Configure License Pricing' mod='productlicenses'}
            </a>
        </div>
    </div>
</div>

<style>
.product-tab .form-wrapper {
    padding: 20px;
}
</style>