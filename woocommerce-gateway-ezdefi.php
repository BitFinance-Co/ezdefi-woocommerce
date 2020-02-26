<?php
/**
 * Plugin Name: ezDeFi - Bitcoin, Ethereum and Cryptocurrencies Payment Gateway for WooCommerce
 * Plugin URI: https://ezdefi.io/
 * Description: Accept Bitcoin, Ethereum and Cryptocurrencies on your Woocommerce store with ezDeFi
 * Version: 1.0.0
 * Author: ezDeFi
 * Author URI: https://ezdefi.io/
 * License: GPLv2 or later
 * Text Domain: woocommerce-gateway-ezdefi
 * Domain Path: /languages
 */

defined( 'ABSPATH' ) or exit;

class WC_Ezdefi {

	/**
	 * @var Single instance of WC_Ezdefi class
	 */
	protected static $instance;

	/**
	 * Constructs the class
	 */
	protected function __construct()
	{
		$this->includes();

		$this->define_constants();

		add_filter( 'woocommerce_payment_gateways', array( $this, 'add_gateways' ) );
	}

	/**
	 * Run when activate plugin
	 */
	public static function activate()
	{
		global $wpdb;

		$sql = array();

		$charset_collate = $wpdb->get_charset_collate();

		$exception_table_name = $wpdb->prefix . 'woocommerce_ezdefi_exception';

		$sql[] = "CREATE TABLE $exception_table_name (
			id int(11) NOT NULL AUTO_INCREMENT,
			amount_id decimal(60,30) NOT NULL,
			currency varchar(10) NOT NULL,
			order_id int(11),
			status varchar(20),
			payment_method varchar(100),
			explorer_url varchar(200),
			PRIMARY KEY (id)
		) $charset_collate;";

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );

		dbDelta( $sql );

		// Add schedule event to clear database table
		$wpdb->query( "
			CREATE EVENT IF NOT EXISTS `wc_ezdefi_clear_exception_table`
			ON SCHEDULE EVERY 7 DAY
			DO
				DELETE FROM $exception_table_name;
		" );
	}

	/**
	 * Includes required files
	 */
	public function includes()
	{
	    require_once dirname( __FILE__ ) . '/functions.php';
		require_once dirname( __FILE__ ) . '/includes/class-wc-ezdefi-db.php';
		require_once dirname( __FILE__ ) . '/includes/class-wc-ezdefi-api.php';
		require_once dirname( __FILE__ ) . '/includes/class-wc-ezdefi-ajax.php';
		require_once dirname( __FILE__ ) . '/includes/class-wc-ezdefi-callback.php';
		require_once dirname( __FILE__ ) . '/includes/admin/class-wc-ezdefi-admin-notices.php';
		require_once dirname( __FILE__ ) . '/includes/admin/class-wc-ezdefi-exception-page.php';
		require_once dirname( __FILE__ ) . '/includes/class-wc-gateway-ezdefi.php';
	}

	/**
	 * Add Woocommerce payment gateway
	 *
	 * @param $methods
	 *
	 * @return array
	 */
	public function add_gateways( $methods )
	{
		$methods[] = 'WC_Gateway_Ezdefi';

		return $methods;
	}

	/**
	 * Define constants
	 */
	public function define_constants()
	{
		define( 'WC_EZDEFI_VERSION', '1.0.0' );
		define( 'WC_EZDEFI_MAIN_FILE', __FILE__ );
		define( 'WC_EZDEFI_PLUGIN_URL', untrailingslashit( plugins_url( basename( plugin_dir_path( __FILE__ ) ), basename( __FILE__ ) ) ) );
		define( 'WC_EZDEFI_PLUGIN_PATH', untrailingslashit( plugin_dir_path( __FILE__ ) ) );
	}

	/**
	 * Get the main WC_Ezdefi instance
	 *
	 * @return WC_Ezdefi
	 */
	public static function get_instance() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self();
		}

		return self::$instance;
	}
}

add_action( 'plugins_loaded', 'woocommerce_gateway_ezdefi_init' );

function woocommerce_gateway_ezdefi_init() {
	load_plugin_textdomain( 'woocommerce-gateway-ezdefi', false, plugin_basename( dirname( __FILE__ ) ) . '/languages' );

    WC_Ezdefi::get_instance();
}

register_activation_hook( __FILE__, array( 'WC_Ezdefi', 'activate' ) );