<?php
/**
 * Product Licenses Module for PrestaShop 9
 * 
 * @author Your Name
 * @copyright 2025
 * @license MIT
 */

if (!defined('_PS_VERSION_')) {
    exit;
}

class ProductLicenses extends Module
{
    public function __construct()
    {
        $this->name = 'productlicenses';
        $this->tab = 'front_office_features';
        $this->version = '1.0.0';
        $this->author = 'Your Name';
        $this->need_instance = 0;
        $this->ps_versions_compliancy = [
            'min' => '9.0.0',
            'max' => _PS_VERSION_
        ];
        $this->bootstrap = true;

        parent::__construct();

        $this->displayName = $this->l('Product Licenses');
        $this->description = $this->l('Enables different license types (Personal, Commercial, Extended) for virtual products with percentage-based pricing.');
        $this->confirmUninstall = $this->l('Are you sure you want to uninstall this module?');
    }

    public function install()
    {
        if (!parent::install()) {
            return false;
        }

        // Create product license table
        $sql = "CREATE TABLE IF NOT EXISTS `" . _DB_PREFIX_ . "product_license` (
            `id_product_license` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
            `id_product` INT(11) UNSIGNED NOT NULL,
            `license_enabled` TINYINT(1) NOT NULL DEFAULT 0,
            PRIMARY KEY (`id_product_license`),
            KEY `id_product` (`id_product`)
        ) ENGINE=" . _MYSQL_ENGINE_ . " DEFAULT CHARSET=utf8mb4;";

        if (!Db::getInstance()->execute($sql)) {
            return false;
        }

        // Create cart license table
        if (!$this->createCartLicenseTable()) {
            return false;
        }

        // Create order license table
        if (!$this->createOrderLicenseTable()) {
            return false;
        }

        // Set default configuration values
        Configuration::updateValue('PRODUCT_LICENSE_PERSONAL', 0);
        Configuration::updateValue('PRODUCT_LICENSE_COMMERCIAL', 50);
        Configuration::updateValue('PRODUCT_LICENSE_EXTENDED', 100);

        // Register hooks
        return $this->registerHook('header') &&
               $this->registerHook('displayAdminProductsExtra') &&
               $this->registerHook('actionProductUpdate') &&
               $this->registerHook('displayProductButtons') &&
               $this->registerHook('actionProductAdd') &&
               $this->registerHook('actionCartSave') &&
               $this->registerHook('actionGetProductPropertiesAfter') &&
               $this->registerHook('displayShoppingCartFooter') &&
               $this->registerHook('actionValidateOrder');
    }

    public function uninstall()
    {
        if (!parent::uninstall()) {
            return false;
        }

        // Drop all database tables
        $tables = [
            'product_license',
            'cart_product_license',
            'order_product_license'
        ];
        
        foreach ($tables as $table) {
            $sql = "DROP TABLE IF EXISTS `" . _DB_PREFIX_ . $table . "`";
            if (!Db::getInstance()->execute($sql)) {
                return false;
            }
        }

        // Delete configuration
        Configuration::deleteByName('PRODUCT_LICENSE_PERSONAL');
        Configuration::deleteByName('PRODUCT_LICENSE_COMMERCIAL');
        Configuration::deleteByName('PRODUCT_LICENSE_EXTENDED');

        return true;
    }

    public function getContent()
    {
        $output = '';

        if (Tools::isSubmit('submitProductLicenses')) {
            $personal = (int)Tools::getValue('PRODUCT_LICENSE_PERSONAL');
            $commercial = (int)Tools::getValue('PRODUCT_LICENSE_COMMERCIAL');
            $extended = (int)Tools::getValue('PRODUCT_LICENSE_EXTENDED');

            Configuration::updateValue('PRODUCT_LICENSE_PERSONAL', $personal);
            Configuration::updateValue('PRODUCT_LICENSE_COMMERCIAL', $commercial);
            Configuration::updateValue('PRODUCT_LICENSE_EXTENDED', $extended);

            $output .= $this->displayConfirmation($this->l('Settings updated successfully.'));
        }

        return $output . $this->displayForm();
    }

    public function displayForm()
    {
        $default_lang = (int)Configuration::get('PS_LANG_DEFAULT');

        $fields_form = [
            'form' => [
                'legend' => [
                    'title' => $this->l('License Settings'),
                    'icon' => 'icon-cogs'
                ],
                'input' => [
                    [
                        'type' => 'text',
                        'label' => $this->l('Personal License Price Increase'),
                        'name' => 'PRODUCT_LICENSE_PERSONAL',
                        'suffix' => '%',
                        'class' => 'fixed-width-sm',
                        'desc' => $this->l('Percentage to increase base price for Personal license (e.g., 0 for same price)')
                    ],
                    [
                        'type' => 'text',
                        'label' => $this->l('Commercial License Price Increase'),
                        'name' => 'PRODUCT_LICENSE_COMMERCIAL',
                        'suffix' => '%',
                        'class' => 'fixed-width-sm',
                        'desc' => $this->l('Percentage to increase base price for Commercial license (e.g., 50 for 50% more)')
                    ],
                    [
                        'type' => 'text',
                        'label' => $this->l('Extended License Price Increase'),
                        'name' => 'PRODUCT_LICENSE_EXTENDED',
                        'suffix' => '%',
                        'class' => 'fixed-width-sm',
                        'desc' => $this->l('Percentage to increase base price for Extended license (e.g., 100 for double price)')
                    ],
                ],
                'submit' => [
                    'title' => $this->l('Save'),
                    'class' => 'btn btn-default pull-right'
                ]
            ],
        ];

        $helper = new HelperForm();
        $helper->module = $this;
        $helper->name_controller = $this->name;
        $helper->token = Tools::getAdminTokenLite('AdminModules');
        $helper->currentIndex = AdminController::$currentIndex . '&configure=' . $this->name;
        $helper->default_form_language = $default_lang;
        $helper->allow_employee_form_lang = $default_lang;
        $helper->title = $this->displayName;
        $helper->show_toolbar = true;
        $helper->toolbar_scroll = true;
        $helper->submit_action = 'submitProductLicenses';

        $helper->fields_value['PRODUCT_LICENSE_PERSONAL'] = Configuration::get('PRODUCT_LICENSE_PERSONAL');
        $helper->fields_value['PRODUCT_LICENSE_COMMERCIAL'] = Configuration::get('PRODUCT_LICENSE_COMMERCIAL');
        $helper->fields_value['PRODUCT_LICENSE_EXTENDED'] = Configuration::get('PRODUCT_LICENSE_EXTENDED');

        return $helper->generateForm([$fields_form]);
    }

    // ========== HOOKS ==========

    public function hookHeader()
    {
        $this->context->controller->addCSS($this->_path . 'views/css/front.css');
        $this->context->controller->addJS($this->_path . 'views/js/front.js');
    }

    public function hookDisplayAdminProductsExtra($params)
    {
        $id_product = (int)Tools::getValue('id_product');
        $product = new Product($id_product);

        // Only show for virtual products
        if (!$product->is_virtual) {
            return '';
        }

        $license_enabled = $this->getLicenseStatus($id_product);

        $this->context->smarty->assign([
            'license_enabled' => $license_enabled,
            'id_product' => $id_product,
            'module_dir' => $this->_path
        ]);

        return $this->display(__FILE__, 'views/templates/admin/product_license.tpl');
    }

    public function hookActionProductUpdate($params)
    {
        $id_product = (int)$params['id_product'];
        $license_enabled = (int)Tools::getValue('license_enabled');
        $this->saveLicenseStatus($id_product, $license_enabled);
    }

    public function hookActionProductAdd($params)
    {
        $id_product = (int)$params['id_product'];
        $license_enabled = (int)Tools::getValue('license_enabled');
        $this->saveLicenseStatus($id_product, $license_enabled);
    }

    public function hookDisplayProductButtons($params)
    {
        $product = $params['product'];
        
        if (!$product['is_virtual']) {
            return '';
        }

        $id_product = (int)$product['id_product'];
        $license_enabled = $this->getLicenseStatus($id_product);

        if (!$license_enabled) {
            return '';
        }

        $base_price = (float)$product['price_amount'];
        
        $licenses = [
            'personal' => [
                'name' => $this->l('Personal License'),
                'increase' => Configuration::get('PRODUCT_LICENSE_PERSONAL'),
                'price' => $base_price * (1 + Configuration::get('PRODUCT_LICENSE_PERSONAL') / 100)
            ],
            'commercial' => [
                'name' => $this->l('Commercial License'),
                'increase' => Configuration::get('PRODUCT_LICENSE_COMMERCIAL'),
                'price' => $base_price * (1 + Configuration::get('PRODUCT_LICENSE_COMMERCIAL') / 100)
            ],
            'extended' => [
                'name' => $this->l('Extended License'),
                'increase' => Configuration::get('PRODUCT_LICENSE_EXTENDED'),
                'price' => $base_price * (1 + Configuration::get('PRODUCT_LICENSE_EXTENDED') / 100)
            ]
        ];

        // Get currency object properly
        $currency = $this->context->currency;
        
        $this->context->smarty->assign([
            'licenses' => $licenses,
            'id_product' => $id_product,
            'currency_sign' => $currency->sign,
            'currency_iso' => $currency->iso_code
        ]);

        return $this->display(__FILE__, 'views/templates/front/license_selector.tpl');
    }

    public function hookActionGetProductPropertiesAfter($params)
    {
        $product = &$params['product'];
        
        if (isset($product['id_product']) && $this->getLicenseStatus($product['id_product'])) {
            $selected_license = Tools::getValue('product_license');
            
            if (!$selected_license) {
                $selected_license = 'personal';
            }
            
            $base_price = $product['price_amount'];
            $increase = 0;
            
            switch ($selected_license) {
                case 'personal':
                    $increase = Configuration::get('PRODUCT_LICENSE_PERSONAL');
                    break;
                case 'commercial':
                    $increase = Configuration::get('PRODUCT_LICENSE_COMMERCIAL');
                    break;
                case 'extended':
                    $increase = Configuration::get('PRODUCT_LICENSE_EXTENDED');
                    break;
            }
            
            $new_price = $base_price * (1 + $increase / 100);
            $product['price_amount'] = $new_price;
            $product['price'] = $new_price;
            $product['license_type'] = $selected_license;
        }
    }

    public function hookActionCartSave($params)
    {
        if (isset($params['cart'])) {
            $cart = $params['cart'];
            $id_product = (int)Tools::getValue('id_product');
            $license_type = Tools::getValue('product_license');
            $license_price = Tools::getValue('product_license_price');
            
            if ($id_product && $license_type) {
                $this->saveCartLicenseInfo($cart->id, $id_product, $license_type, $license_price);
            }
        }
    }

    public function hookDisplayShoppingCartFooter($params)
    {
        $cart = $this->context->cart;
        $products = $cart->getProducts();
        
        $license_info = [];
        
        foreach ($products as $product) {
            if ($this->getLicenseStatus($product['id_product'])) {
                $info = $this->getCartLicenseInfo($cart->id, $product['id_product']);
                if ($info) {
                    $license_info[$product['id_product']] = $info;
                }
            }
        }
        
        if (!empty($license_info)) {
            $this->context->smarty->assign([
                'license_info' => $license_info,
                'cart' => $cart,
                'currency' => $this->context->currency
            ]);
            
            return $this->display(__FILE__, 'views/templates/front/cart_license_info.tpl');
        }
        
        return '';
    }

    public function hookActionValidateOrder($params)
    {
        $cart = $params['cart'];
        $order = $params['order'];
        $products = $cart->getProducts();
        
        foreach ($products as $product) {
            $license_info = $this->getCartLicenseInfo($cart->id, $product['id_product']);
            
            if ($license_info) {
                $this->saveOrderLicenseInfo(
                    $order->id,
                    $product['id_product'],
                    $license_info['license_type'],
                    $license_info['license_price']
                );
            }
        }
    }

    // ========== PRIVATE METHODS ==========

    private function createCartLicenseTable()
    {
        $sql = "CREATE TABLE IF NOT EXISTS `" . _DB_PREFIX_ . "cart_product_license` (
            `id_cart_product_license` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
            `id_cart` INT(11) UNSIGNED NOT NULL,
            `id_product` INT(11) UNSIGNED NOT NULL,
            `license_type` VARCHAR(50) NOT NULL,
            `license_price` DECIMAL(20,6) NOT NULL,
            `date_add` DATETIME NOT NULL,
            PRIMARY KEY (`id_cart_product_license`),
            KEY `id_cart` (`id_cart`),
            KEY `id_product` (`id_product`)
        ) ENGINE=" . _MYSQL_ENGINE_ . " DEFAULT CHARSET=utf8mb4;";
        
        return Db::getInstance()->execute($sql);
    }

    private function createOrderLicenseTable()
    {
        $sql = "CREATE TABLE IF NOT EXISTS `" . _DB_PREFIX_ . "order_product_license` (
            `id_order_product_license` INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
            `id_order` INT(11) UNSIGNED NOT NULL,
            `id_product` INT(11) UNSIGNED NOT NULL,
            `license_type` VARCHAR(50) NOT NULL,
            `license_price` DECIMAL(20,6) NOT NULL,
            `date_add` DATETIME NOT NULL,
            PRIMARY KEY (`id_order_product_license`),
            KEY `id_order` (`id_order`),
            KEY `id_product` (`id_product`)
        ) ENGINE=" . _MYSQL_ENGINE_ . " DEFAULT CHARSET=utf8mb4;";
        
        return Db::getInstance()->execute($sql);
    }

    private function getLicenseStatus($id_product)
    {
        $sql = "SELECT license_enabled FROM `" . _DB_PREFIX_ . "product_license` 
                WHERE id_product = " . (int)$id_product;
        
        $result = Db::getInstance()->getValue($sql);
        return $result ? (int)$result : 0;
    }

    private function saveLicenseStatus($id_product, $license_enabled)
    {
        $exists = Db::getInstance()->getValue(
            "SELECT id_product_license FROM `" . _DB_PREFIX_ . "product_license` 
             WHERE id_product = " . (int)$id_product
        );

        if ($exists) {
            return Db::getInstance()->update(
                'product_license',
                ['license_enabled' => (int)$license_enabled],
                'id_product = ' . (int)$id_product
            );
        } else {
            return Db::getInstance()->insert(
                'product_license',
                [
                    'id_product' => (int)$id_product,
                    'license_enabled' => (int)$license_enabled
                ]
            );
        }
    }

    private function saveCartLicenseInfo($id_cart, $id_product, $license_type, $license_price)
    {
        $existing = Db::getInstance()->getValue(
            "SELECT id_cart_product_license FROM `" . _DB_PREFIX_ . "cart_product_license` 
             WHERE id_cart = " . (int)$id_cart . " 
             AND id_product = " . (int)$id_product
        );
        
        if ($existing) {
            return Db::getInstance()->update(
                'cart_product_license',
                [
                    'license_type' => pSQL($license_type),
                    'license_price' => (float)$license_price
                ],
                'id_cart = ' . (int)$id_cart . ' AND id_product = ' . (int)$id_product
            );
        } else {
            return Db::getInstance()->insert(
                'cart_product_license',
                [
                    'id_cart' => (int)$id_cart,
                    'id_product' => (int)$id_product,
                    'license_type' => pSQL($license_type),
                    'license_price' => (float)$license_price,
                    'date_add' => date('Y-m-d H:i:s')
                ]
            );
        }
    }

    public function getCartLicenseInfo($id_cart, $id_product)
    {
        return Db::getInstance()->getRow(
            "SELECT * FROM `" . _DB_PREFIX_ . "cart_product_license` 
             WHERE id_cart = " . (int)$id_cart . " 
             AND id_product = " . (int)$id_product
        );
    }

    private function saveOrderLicenseInfo($id_order, $id_product, $license_type, $license_price)
    {
        return Db::getInstance()->insert(
            'order_product_license',
            [
                'id_order' => (int)$id_order,
                'id_product' => (int)$id_product,
                'license_type' => pSQL($license_type),
                'license_price' => (float)$license_price,
                'date_add' => date('Y-m-d H:i:s')
            ]
        );
    }
}