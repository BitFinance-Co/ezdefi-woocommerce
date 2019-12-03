<?php

defined( 'ABSPATH' ) or exit;

class WC_Ezdefi_Settings_Page
{
	public function __construct()
	{
		$this->id = 'ezdefi';
		$this->label = __( 'ezDeFi', 'woocommerce-gateway-ezdefi' );

		$this->init_hooks();
	}

	public function init_hooks()
	{
		add_filter( 'woocommerce_settings_tabs_array', array( $this, 'add_settings_page' ), 30 );
		add_action( 'woocommerce_settings_' . $this->id, array( $this, 'output' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'register_scripts' ) );
	}

	public function register_scripts()
	{
		wp_register_script( 'wc_ezdefi_blockui', plugins_url( 'assets/js/jquery.blockUI.js', WC_EZDEFI_MAIN_FILE ), array( 'jquery' ), WC_EZDEFI_VERSION, true );
		wp_register_style( 'wc_ezdefi_select2', plugins_url( 'assets/css/select2.min.css', WC_EZDEFI_MAIN_FILE ) );
		wp_register_script( 'wc_ezdefi_select2', plugins_url( 'assets/js/select2.min.js', WC_EZDEFI_MAIN_FILE ), array( 'jquery' ), WC_EZDEFI_VERSION, true );
		wp_register_style( 'wc_ezdefi_assign', plugins_url( 'assets/css/ezdefi-assign.css', WC_EZDEFI_MAIN_FILE ) );
		wp_register_script( 'wc_ezdefi_assign', plugins_url( 'assets/js/ezdefi-assign.js', WC_EZDEFI_MAIN_FILE ), array( 'jquery' ), WC_EZDEFI_VERSION, true );
	}

	public function add_settings_page( $pages )
	{
		$pages[ $this->id ] = $this->label;

		return $pages;
	}

	public function output()
	{
		global $hide_save_button;

		global $wpdb;

		$hide_save_button = true;

		$orders = wc_get_orders( array(
			'status' => 'on-hold'
		) );

		$data = array();

		foreach ($orders as $order) {
			$data[] = array(
				'id' => $order->get_order_number(),
				'total' => $order->get_total(),
				'currency' => $order->get_currency(),
				'billing_email' => $order->get_billing_email(),
				'amount_id' => $order->get_meta( 'ezdefi_amount_id' ),
				'token' => $order->get_meta( 'ezdefi_currency' ),
				'date_created' => $order->get_date_created()->format ('Y-m-d H:i:s')
			);
		}

		$table_name = $wpdb->prefix . 'woocommerce_ezdefi_exception';

		$exception = $wpdb->get_results( "SELECT * FROM $table_name", ARRAY_A );

		wp_enqueue_script( 'wc_ezdefi_blockui' );
		wp_enqueue_style( 'wc_ezdefi_select2' );
		wp_enqueue_script( 'wc_ezdefi_select2' );
		wp_enqueue_style( 'wc_ezdefi_assign' );
		wp_enqueue_script( 'wc_ezdefi_assign' );
		wp_localize_script( 'wc_ezdefi_assign', 'wc_ezdefi_data',
			array(
				'ajax_url' => admin_url( 'admin-ajax.php' ),
				'orders' => $data
			)
		);

		ob_start(); ?>
			<h2>ezDeFi Manage Exception</h2>
			<table class="widefat" id="wc-ezdefi-order-assign">
				<thead>
					<th>Received Amount</th>
					<th>Received At</th>
					<th>Assign To</th>
					<th></th>
				</thead>
				<tbody>
					<?php if( ! empty( $exception ) ) : ?>
						<?php foreach($exception as $e) : ?>
							<tr>
								<td>
									<?php echo $e['amount_id']; ?>
									<input type="hidden" value="<?php echo $e['amount_id']; ?>" id="amount-id">
								</td>
								<td><?php echo $e['created_at']; ?></td>
								<td class="order-select">
									<select name="" id="order-select"></select>
								</td>
								<td>
									<button class="button button-primary assignBtn">Assign</button>
									<button class="button removeBtn">Remove</button>
								</td>
							</tr>
						<?php endforeach; ?>
					<?php else : ?>
						<tr>
							<td>Empty</td>
						</tr>
					<?php endif; ?>
				</tbody>
			</table>
		<?php
		echo ob_get_clean();
	}
}

new WC_Ezdefi_Settings_Page();