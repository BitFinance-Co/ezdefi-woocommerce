<?php

defined( 'ABSPATH' ) or exit;

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

if ( defined( 'WC_REMOVE_ALL_DATA' ) && true === WC_REMOVE_ALL_DATA ) {
	delete_option( 'woocommerce_ezdefi_settings' );
}

global $wpdb;
$table_name = $wpdb->prefix . 'woocommerce_ezdefi_amount';
$wpdb->query( "DROP TABLE IF EXISTS $table_name" );
$table_name = $wpdb->prefix . 'woocommerce_ezdefi_exception';
$wpdb->query( "DROP TABLE IF EXISTS $table_name" );
$wpdb->query( "DROP PROCEDURE IF EXISTS `wc_ezdefi_generate_amount_id`" );
$wpdb->query( "DROP EVENT IF EXISTS `wc_ezdefi_clear_amount_table`" );
$wpdb->query( "DROP EVENT IF EXISTS `wc_ezdefi_clear_exception_table`" );