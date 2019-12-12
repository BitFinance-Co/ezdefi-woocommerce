<?php

defined( 'ABSPATH' ) or exit;

class WC_Ezdefi_Api
{
	protected $api_url;

	protected $api_key;

	protected $db;

	/**
	 * Constructs the class
	 */
	public function __construct( $api_url = '', $api_key = '' ) {
		$this->api_url = $api_url;
		$this->api_key = $api_key;

		$this->db = new WC_Ezdefi_Db();
	}

	/**
	 * Set API Url
	 *
	 * @param $api_url
	 */
	public function set_api_url( $api_url )
	{
		$this->api_url = $api_url;
	}

	/**
	 * Get API Url
	 *
	 * @return string
	 */
	public function get_api_url()
	{
		if( empty( $this->api_url ) ) {
			$api_url = $this->db->get_api_url();
			$this->set_api_url( $api_url );
		}

		return $this->api_url;
	}

	/**
	 * Set API Key
	 *
	 * @param $api_key
	 */
	public function set_api_key( $api_key )
	{
		$this->api_key = $api_key;
	}

	/**
	 * Get API Key
	 *
	 * @return string
	 */
	public function get_api_key()
	{
		if( empty( $this->api_key ) ) {
			$api_key = $this->db->get_api_key();
			$this->set_api_key( $api_key );
		}

		return $this->api_key;
	}

	/**
	 * Build API Path
	 *
	 * @param $path
	 *
	 * @return string
	 */
	public function build_path($path)
	{
		return rtrim( $this->get_api_url(), '/' ) . '/' . $path;
	}

	/**
	 * Get API Header
	 *
	 * @return array
	 */
	public function get_headers()
	{
		$headers = array(
			'api-key' => $this->get_api_key(),
			'accept' => 'application/xml',
		);

		return $headers;
	}

	/**
	 * Call API
	 *
	 * @param string $path
	 * @param string $method
	 * @param array $data
	 *
	 * @return array|WP_Error
	 */
	public function call($path, $method = 'GET', $data = [])
	{
		$url = $this->build_path( $path ) ;

		$method = strtolower( $method );

		$headers = $this->get_headers();

		if($method === 'post') {
			return wp_remote_post( $url, array(
				'headers' => $headers,
				'body' => $data
			) );
		}

		if( ! empty( $data ) ) {
			$url = sprintf("%s?%s", $url, http_build_query( $data ) );
		}

		return wp_remote_get( $url, array( 'headers' => $headers ) );
	}

	/**
	 * Create ezDeFi Payment
	 *
	 * @param array $order
	 * @param array $currency_data
	 * @param bool $amountId
	 *
	 * @return array|WP_Error
	 */
    public function create_ezdefi_payment( $order, $currency_data, $amountId = false )
    {
    	$value = $this->calculate_discounted_price( $order->get_total(), $currency_data['discount'] );

	    if( $amountId ) {
	    	$value = $this->generate_amount_id( $order->get_currency(), $currency_data['symbol'], $value, $currency_data );
	    }

	    if( ! $value ) {
		    return new WP_Error( 'create_ezdefi_payment', 'Can not generate amountID.' );
	    }

	    $uoid = $this->generate_uoid( $order->get_order_number(), $amountId );

	    $data = [
		    'uoid' => $uoid,
		    'to' => $currency_data['wallet'],
		    'value' => $value,
		    'safedist' => ( isset( $currency_data['block_confirm'] ) ) ? $currency_data['block_confirm'] : '',
//		    'ucid' => $order->get_user_id(),
	        'ucid' => rand(2, 100),
		    'duration' => ( isset( $currency_data['lifetime'] ) ) ? $currency_data['lifetime'] : '',
//		    'callback' => home_url() . '/?wc-api=ezdefi',
	        'callback' => 'http://7ae80340.ngrok.io/?wc-api=ezdefi',
	    ];

	    if( $amountId ) {
		    $data['amountId'] = true;
		    $data['currency'] = $currency_data['symbol'] . ':' . $currency_data['symbol'];
	    } else {
		    $data['currency'] = $order->get_currency() . ':' . $currency_data['symbol'];
	    }

	    $response = $this->call( 'payment/create', 'post', $data );

	    return $response;
    }

	/**
	 * Get ezDeFi Payment
	 *
	 * @param int $paymentid
	 *
	 * @return array|WP_Error
	 */
    public function get_ezdefi_payment( $paymentid )
    {
	    $response = $this->call( 'payment/get', 'get', array(
	        'paymentid' => $paymentid
        ) );

	    return $response;
    }

	/**
	 * Calculate discounted price
	 *
	 * @param float $price
	 * @param float|int $discount
	 *
	 * @return float|int
	 */
    public function calculate_discounted_price( $price, $discount )
    {
		return $price - ( $price * ( $discount / 100 ) );
    }

	/**
	 * Generate amount id
	 *
	 * @param string $fiat
	 * @param string $token
	 * @param float $value
	 * @param array $currency_data
	 *
	 * @return float|null
	 */
    public function generate_amount_id( $fiat, $token, $value, $currency_data )
    {
	    $rate = $this->get_token_exchange( $fiat, $token );

	    if( ! $rate ) {
		    return null;
	    }

	    $value = $value * $rate;

	    $value = $this->db->generate_amount_id( $value, $currency_data );

	    return $value;
    }

	/**
	 * Get token exchange
	 *
	 * @param string $fiat
	 * @param string $token
	 *
	 * @return float|null
	 */
    public function get_token_exchange( $fiat, $token )
    {
	    $response = $this->call( 'token/exchange/' . $fiat . ':' . $token, 'get' );

	    if( is_wp_error( $response ) ) {
	    	return null;
	    }

	    $response = json_decode( $response['body'], true );

	    if( $response['code'] < 0 ) {
	    	return null;
	    }

	    return $response['data'];
    }

	/**
	 * Generate uoid with suffix
	 *
	 * @param int $uoid
	 * @param boolean $amountId
	 *
	 * @return string
	 */
    public function generate_uoid( $uoid, $amountId )
    {
	    if( $amountId ) {
		    return $uoid . '-1';
	    }

	    return $uoid = $uoid . '-0';
    }

    public function get_list_wallet()
    {
	    $response = $this->call( 'user/list_wallet', 'get', array() );

	    return $response;
    }

	/**
	 * Get list token by keyword
	 *
	 * @param string $keyword
	 *
	 * @return array|WP_Error
	 */
	public function get_list_currency( $keyword = '' )
	{
		$response = $this->call( 'token/list', 'get', array(
			'keyword' => $keyword
		) );

		return $response;
	}
}