<?php

function ezdefi_is_pay_any_wallet( $payment_data )
{
    if( ! is_array( $payment_data ) ) {
        return false;
    }

    return ( isset( $payment_data['amountId'] ) && $payment_data['amountId'] = true );
}

function ezdefi_sanitize_float_value( $value )
{
    $notation = explode('E', $value);

    if(count($notation) === 2){
        $exp = abs(end($notation)) + strlen($notation[0]);
        $decimal = number_format($value, $exp);
        $value = rtrim($decimal, '.0');
    }

    return $value;
}

function ezdefi_sanitize_payment_value( $value, $decimal_number )
{
    $value = explode( '.', $value );
    $decimal = substr( $value[1], 0, $decimal_number );
    return "$value[0]" . '.' . "$decimal";
}

function ezdefi_filter_coin_data_by_symbol( $website_coins, $symbol )
{
    $coin_data = null;
    foreach ($website_coins as $coin) {
        if( strtolower( $coin['token']['symbol'] ) === strtolower( $symbol ) ) {
            $coin_data = $coin;
        }
    }
    return $coin_data;
}

function ezdefi_sanitize_uoid( $uoid )
{
    return substr( $uoid, 0, strpos( $uoid,'-' ) );
}