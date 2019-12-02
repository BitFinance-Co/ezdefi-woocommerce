<?php

defined( 'ABSPATH' ) or exit;

class WC_Ezdefi_Db
{
	const OPTION = 'woocommerce_ezdefi_settings';

	/**
	 * Get plugin options
	 *
	 * @return array
	 */
	public function get_options()
	{
		return get_option( self::OPTION );
	}

	/**
	 * Get plugin option
	 *
	 * @param $key
	 *
	 * @return string|array
	 */
	public function get_option( $key )
	{
		$option = get_option( self::OPTION );

		if( ! isset( $option[$key] ) || $option[$key] === '' ) {
			return '';
		}

		return $option[$key];
	}

	/**
	 * Get currency data option
	 *
	 * @return array
	 */
	public function get_currency_data()
	{
		return $this->get_option( 'currency' );
	}

	/**
	 * Get currency option by symbol
	 *
	 * @param $symbol
	 *
	 * @return bool|mixed
	 */
	public function get_currency_option( $symbol )
	{
		$currency_data = $this->get_currency_data();

		$index = array_search( $symbol, array_column( $currency_data, 'symbol' ) );

		if( $index === false ) {
			return null;
		}

		return $currency_data[$index];
	}

	/**
	 * Get Gateway API Url
	 *
	 * @return string
	 */
	public function get_api_url()
	{
		return $this->get_option( 'api_url' );
	}

	/**
	 * Get Gateway API Key
	 *
	 * @return string
	 */
	public function get_api_key()
	{
		return $this->get_option( 'api_key' );
	}

	/**
	 * Generate smallest & unique amount id
	 *
	 * @param float $price
	 * @param array $currency_data
	 *
	 * @return float
	 */
	public function generate_amount_id( $price, $currency_data )
	{
		global $wpdb;

		$decimal = $currency_data['decimal'];
		$life_time = $currency_data['lifetime'];
		$symbol = $currency_data['symbol'];

		$price = round( $price, $decimal );

		$wpdb->query(
			$wpdb->prepare("
				CALL wc_ezdefi_generate_amount_id(%s, %s, %d, %d, @amount_id)
			", $price, $symbol, $decimal, $life_time)
		);

		$result = $wpdb->get_row( "SELECT @amount_id", ARRAY_A );

		if( ! $result ) {
			return null;
		}

		$amount_id = floatval( $result['@amount_id'] );

		$acceptable_variation = $this->get_acceptable_variation();

		$variation_percent = $acceptable_variation / 100;

		$min = floatval( $price - ( $price * $variation_percent ) );
		$max = floatval( $price + ( $price * $variation_percent ) );

		if( ( $amount_id < $min ) || ( $amount_id > $max ) ) {
			return null;
		}

		return $amount_id;
	}

	/**
	 * Get acceptable variation option
	 *
	 * @return string
	 */
	public function get_acceptable_variation()
	{
		return $this->get_option( 'acceptable_variation' );
	}

	/**
	 * Get amount table name
	 *
	 * @return string
	 */
	public function get_amount_table_name()
	{
		global $wpdb;

		return $wpdb->prefix . 'woocommerce_ezdefi_amount';
	}
}