<?php

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

return apply_filters(
    'wc_ezdefi_settings',
    array(
        'enabled' => array(
            'title' => __( 'Enable/Disable', 'woocommerce-gateway-ezdefi' ),
            'label' => __( 'Enable ezDeFi', 'woocommerce-gateway-ezdefi' ),
            'type' => 'checkbox',
            'description' => '',
            'default' => 'no',
        ),
        'title' => array(
	        'title' => __( 'Title', 'woocommerce-gateway-ezdefi' ),
	        'type' => 'text',
	        'description' => __( 'This controls the title which the user sees during checkout.', 'woocommerce-gateway-stripe' ),
	        'default' => __( 'Pay with cryptocurrency', 'woocommerce-gateway-stripe' ),
	        'desc_tip' => true,
        ),
        'description' => array(
	        'title' => __( 'Description', 'woocommerce-gateway-ezdefi' ),
	        'type' => 'text',
	        'description' => __( 'This controls the description which the user sees during checkout.', 'woocommerce-gateway-stripe' ),
	        'default' => __( 'Using BTC, ETH or any kinds of cryptocurrency. Handle by ezDeFi', 'woocommerce-gateway-stripe' ),
	        'desc_tip' => true,
        ),
        'api_url' => array(
            'title' => __( 'Gateway API Url', 'woocommerce-gateway-ezdefi' ),
            'type' => 'text',
            'description' => __( 'Description' ),
            'default' => 'https://merchant-api.ezdefi.com/api/',
            'desc_tip' => true,
        ),
        'api_key' => array(
            'title' => __( 'Gateway API Key', 'woocommerce-gateway-ezdefi' ),
            'type' => 'text',
            'description' => sprintf( __( '<a target="_blank" href="%s">Register to get API Key</a>', 'woocommerce-gateway-ezdefi' ), 'https://merchant.ezdefi.com/register?utm_source=woocommerce-download' ),
        )
    )
);