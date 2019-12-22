<?php
/**
 * Plugin Name: WooCommerce Ezdefi Payment Gateway
 * Plugin URI: https://ezdefi.io/
 * Description: Ezdefi Gateway integration for Woocommerce
 * Version: 1.0.0
 * Author: Nexty Platform
 * Author URI: https://nexty.io/
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

		$table_name = $wpdb->prefix . 'woocommerce_ezdefi_amount';

		$charset_collate = $wpdb->get_charset_collate();

		// Create new table
		$sql[] = "CREATE TABLE $table_name (
			id int(11) NOT NULL AUTO_INCREMENT,
			amount_key int(11) NOT NULL,
			price decimal(20,12) NOT NULL,
			amount_id decimal(20,12) NOT NULL,
			currency varchar(10) NOT NULL,
			expired_time timestamp default current_timestamp,
			PRIMARY KEY (id),
			UNIQUE (amount_id, currency)
		) $charset_collate;";

		$exception_table_name = $wpdb->prefix . 'woocommerce_ezdefi_exception';

		$sql[] = "CREATE TABLE $exception_table_name (
			id int(11) NOT NULL AUTO_INCREMENT,
			amount_id decimal(20,12) NOT NULL,
			currency varchar(10) NOT NULL,
			order_id int(11),
			status varchar(20),
			payment_method varchar(100),
			explorer_url varchar(200),
			PRIMARY KEY (id)
		) $charset_collate;";

		require_once( ABSPATH . 'wp-admin/includes/upgrade.php' );
		dbDelta( $sql );

		// Add procedure
		$wpdb->query("DROP PROCEDURE IF EXISTS `wc_ezdefi_generate_amount_id`" );
		$wpdb->query("
	        CREATE PROCEDURE `wc_ezdefi_generate_amount_id`(
	            IN value DECIMAl(20,12),
			    IN token VARCHAR(10),
			    IN decimal_number INT(2),
                IN life_time INT(11),
			    OUT amount_id DECIMAL(20,12)
			)
			BEGIN
			    DECLARE unique_id INT(11) DEFAULT 0;
			    IF EXISTS (SELECT 1 FROM $table_name WHERE `currency` = token AND `price` = value) THEN
			        IF EXISTS (SELECT 1 FROM $table_name WHERE `currency` = token AND `price` = value AND `amount_key` = 0 AND `expired_time` > NOW()) THEN
				        SELECT MIN(t1.amount_key+1) INTO unique_id FROM $table_name t1 LEFT JOIN $table_name t2 ON t1.amount_key + 1 = t2.amount_key AND t2.price = value AND t2.currency = token AND t2.expired_time > NOW() WHERE t2.amount_key IS NULL;
				        IF((unique_id % 2) = 0) THEN
				            SET amount_id = value + ((unique_id / 2) / POW(10, decimal_number));
				        ELSE
				            SET amount_id = value - ((unique_id - (unique_id DIV 2)) / POW(10, decimal_number));
				        END IF;
			        ELSE
			            SET amount_id = value;
			        END IF;
			    ELSE
			        SET amount_id = value;
			    END IF;
			    INSERT INTO $table_name (amount_key, price, amount_id, currency, expired_time)
                    VALUES (unique_id, value, amount_id, token, NOW() + INTERVAL life_time SECOND + INTERVAL 10 SECOND)
                    ON DUPLICATE KEY UPDATE `expired_time` = NOW() + INTERVAL life_time SECOND + INTERVAL 10 SECOND; 
			END
		" );

		// Add schedule event to clear amount table
		$wpdb->query( "
			CREATE EVENT IF NOT EXISTS `wc_ezdefi_clear_amount_table`
			ON SCHEDULE EVERY 3 DAY
			DO
				DELETE FROM $table_name;
		" );

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
		require_once dirname( __FILE__ ) . '/includes/class-wc-ezdefi-db.php';
		require_once dirname( __FILE__ ) . '/includes/class-wc-ezdefi-api.php';
		require_once dirname( __FILE__ ) . '/includes/class-wc-ezdefi-ajax.php';
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