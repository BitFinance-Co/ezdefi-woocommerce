<?php

defined( 'ABSPATH' ) or exit;

class WC_Ezdefi_Callback
{
    const EXPLORER_URL = 'https://explorer.nexty.io/tx/';

    protected $api;

    protected $db;

    /**
     * WC_Ezdefi_Callback constructor.
     */
    public function __construct()
    {
        add_action( 'woocommerce_api_ezdefi', array(
            $this, 'handle'
        ) );

        $this->api = new WC_Ezdefi_Api();
        $this->db = new WC_Ezdefi_Db();
    }

    /**
     * Handle callback from gateway
     */
    public function handle()
    {
        if( $this->is_payment_callback( $_GET ) ) {
            $this->handle_payment_callback( $_GET );
        }

        if( $this->is_transaction_callback( $_GET ) ) {
            $this->handle_transaction_callback( $_GET );
        }
    }

    /**
     * Handle callback when payment is DONE or EXPIRED_DONE
     *
     * @param array $data
     */
    protected function handle_payment_callback( $data )
    {
        global $woocommerce;

        $data = array_map( 'sanitize_key', $data );

        $order_id = ezdefi_sanitize_uoid( $data['uoid'] );

        if( ! $order = wc_get_order( $order_id ) ) {
            wp_send_json_error();
        }

        $payment = $this->api->get_ezdefi_payment( $data['paymentid'] );

        if( ! $this->is_valid_payment( $payment ) ) {
            wp_send_json_error();
        }

        $status = $payment['status'];

        if( $status === 'DONE' ) {
            $order->update_status( 'completed' );
            $woocommerce->cart->empty_cart();
            $this->update_exception( $payment );

            if( ! ezdefi_is_pay_any_wallet( $payment ) ) {
                $this->db->delete_exception_by_order_id( $order_id );
            }
        } elseif( $status === 'EXPIRED_DONE' ) {
            $this->update_exception( $payment );
        }

        wp_send_json_success();
    }

    /**
     * Handle callback when there's unknown transaction
     *
     * @param $data
     */
    protected function handle_transaction_callback( $data )
    {
        $value = sanitize_key( $data['value'] );
        $decimal = sanitize_key( $data['decimal'] );
        $value = $value / pow( 10, $decimal );
        $value = ezdefi_sanitize_float_value( $value );
        $explorerUrl = sanitize_text_field( $data['explorerUrl'] );
        $currency = sanitize_text_field( $data['currency'] );
        $id = sanitize_key( $data['id'] );

        $transaction = $this->api->get_transaction( $id );

        if( is_null( $transaction ) || $transaction['status'] != 'ACCEPTED' ) {
            wp_send_json_error();
        }

        $exception_data = array(
            'amount_id' => str_replace( ',', '', $value ),
            'currency' => $currency,
            'explorer_url' => $explorerUrl,
        );

        $this->db->add_exception( $exception_data );

        wp_send_json_success();
    }

    protected function is_payment_callback( $data )
    {
        if( ! is_array( $data ) ) {
            return false;
        }

        return ( isset( $data['uoid'] ) && isset( $data['paymentid'] ) );
    }

    protected function is_transaction_callback( $data )
    {
        if( ! is_array( $data ) ) {
            return false;
        }

        return (
            isset( $data['value'] ) && isset( $data['explorerUrl'] ) &&
            isset( $data['currency'] ) && isset( $data['id'] ) &&
            isset( $data['decimal'] )
        );
    }

    protected function is_valid_payment( $payment )
    {
        if( is_null( $payment ) ) {
            return false;
        }

        $status = $payment['status'];

        if( $status === 'PENDING' || $status === 'EXPIRED' ) {
            return false;
        }

        return true;
    }

    protected function get_coin_data( $symbol )
    {
        $coin_data = array();
        $website_coins = $this->api->get_website_coins();
        foreach ($website_coins as $coin) {
            if( strtolower( $coin['token']['symbol'] ) === strtolower( $symbol ) ) {
                $coin_data = $coin;
            }
        }
        return $coin_data;
    }

    protected function update_exception( $payment_data )
    {
        $status = $payment_data['status'];

        if( ezdefi_is_pay_any_wallet( $payment_data ) ) {
            $payment_method = 'amount_id';
            $coin_data = $this->get_coin_data( $payment_data['currency'] );
            $amount_id = ezdefi_sanitize_payment_value( $payment_data['originValue'], $coin_data['decimal'] );
        } else {
            $payment_method = 'ezdefi_wallet';
            $amount_id = $payment_data['value'] / pow( 10, $payment_data['decimal'] );
        }

        $amount_id = ezdefi_sanitize_float_value( $amount_id );
        $amount_id = str_replace( ',', '', $amount_id);

        $wheres = array(
            'amount_id' => $amount_id,
            'currency' => (string) $payment_data['currency'],
            'order_id' => (int) ezdefi_sanitize_uoid( $payment_data['uoid'] ),
            'payment_method' => $payment_method,
        );

        $data = array(
            'status' => strtolower($status),
            'explorer_url' => (string) self::EXPLORER_URL . $payment_data['transactionHash']
        );

        $this->db->update_exception( $wheres, $data );
    }
}

new WC_Ezdefi_Callback();