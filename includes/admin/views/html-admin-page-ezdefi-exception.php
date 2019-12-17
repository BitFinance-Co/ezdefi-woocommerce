<?php

defined( 'ABSPATH' ) or exit;

?>
<div class="wrap">
	<h1 class="wp-heading-inline">ezDeFi Exception Management</h1>
	<hr class="wp-header-end">
    <table class="widefat" id="wc-ezdefi-exception-table-filter">
        <thead>
            <th><strong>Filter</strong></th>
        </thead>
        <tbody>
            <tr>
                <td>
                    <form action="" id="wc-ezdefi-exception-table-filter-form">
                        <input type="hidden" name="page" value="1">
                        <div class="filter-container">
                            <div class="filter-rows">
                                <label for="">Amount</label>
                                <input type="number" name="amount_id" placeholder="Amount">
                            </div>
                            <div class="filter-rows">
                                <label for="">Currency</label>
                                <input type="text" name="currency" placeholder="Currency">
                            </div>
                            <div class="filter-rows">
                                <label for="">Order ID</label>
                                <input type="number" name="order_id" placeholder="Order ID">
                            </div>
                            <div class="filter-rows">
                                <label for="">Billing Email</label>
                                <input type="text" name="email" placeholder="Billing Email">
                            </div>
                            <div class="filter-rows">
                                <label for="">Payment Method</label>
                                <select name="payment_method" id="">
                                    <option value="" selected>Any Payment Method</option>
                                    <option value="ezdefi_wallet">Pay with ezDeFi wallet</option>
                                    <option value="amount_id">Pay with any crypto wallet</option>
                                </select>
                            </div>
                            <div class="filter-rows">
                                <label for="">Status</label>
                                <select name="status" id="">
                                    <option value="" selected >Any Status</option>
                                    <option value="expired_done">Paid after expired</option>
                                    <option value="not_paid">Not paid</option>
                                    <option value="done">Paid on time</option>
                                </select>
                            </div>
                            <div class="filter-rows">
                                <button class="button button-primary filterBtn">Apply</button>
                            </div>
                        </div>
                    </form>
                </td>
            </tr>
        </tbody>
    </table>
    <table class="widefat striped" id="wc-ezdefi-order-assign">
		<thead>
            <th><strong><?php _e( 'Received Amount', 'woocommerce-gateway-ezdefi' ); ?></strong></th>
            <th><strong><?php _e( 'Currency', 'woocommerce-gateway-ezdefi' ); ?></strong></th>
            <th><strong><?php _e( 'Order', 'woocommerce-gateway-ezdefi' ); ?></strong></th>
            <th><strong><?php _e( 'Action', 'woocommerce-gateway-ezdefi' ); ?></strong></th>
		</thead>
        <tbody>
            <tr class="spinner-row">
                <td colspan="4"><span class="spinner is-active"></span></td>
            </tr>
        </tbody>
	</table>
    <div id="wc-ezdefi-order-assign-nav" class="tablenav bottom" style="display: none;">
        <div class="tablenav-pages">
            <span class="displaying-num"><span class="number"></span> items</span>
            <span class="pagination-links">
                <a class="prev-page button" href="">
                    <span class="screen-reader-text">Previous page</span>
                    <span>‹</span>
                </a>
                <span class="screen-reader-text">Current Page</span>
                    <span id="table-paging" class="paging-input">
                        <span class="tablenav-paging-text">
                            <span class="number"></span> of <span class="total-pages"></span>
                        </span>
                    </span>
                <a class="next-page button" href="">
                    <span class="screen-reader-text">Next page</span>
                    <span>›</span>
                </a>
            </span>
        </div>
    </div>
</div>
