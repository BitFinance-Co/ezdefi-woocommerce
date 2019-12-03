jQuery(function($) {
    'use strict';

    var selectors = {
        table: '#wc-ezdefi-order-assign',
        select: '#order-select',
        amountIdInput: '#amount-id',
        assignBtn: '.assignBtn',
        removeBtn: '.removeBtn'
    };

    var wc_ezdefi_assign = function() {
        this.$table = $(selectors.table);
        this.$select = this.$table.find(selectors.select);
        this.$amountIdInput = this.$table.find(selectors.amountIdInput);

        var init = this.init.bind(this);
        var onAssign = this.onAssign.bind(this);
        var onRemove = this.onRemove.bind(this);

        init();

        $(this.$table)
            .on('click', selectors.assignBtn, onAssign)
            .on('click', selectors.removeBtn, onRemove)
    };

    wc_ezdefi_assign.prototype.init = function() {
        var self = this;
        self.$table.find('tr').each(function() {
            var select = $(this).find(selectors.select);
            self.initOrderSelect(select);
        });
    };

    wc_ezdefi_assign.prototype.initOrderSelect = function(element) {
        var self = this;
        element.select2({
            width: '100%',
            data: wc_ezdefi_data.orders,
            placeholder: 'Select Order',
            templateResult: self.formatOrderOption,
            templateSelection: self.formatOrderSelection,
            minimumResultsForSearch: -1
        });
    };

    wc_ezdefi_assign.prototype.formatOrderOption = function(order) {
        var $container = $(
            "<div class='select2-order'>" +
            "<div class='select2-order__row'>" +
            "<div class='left'><strong>Order ID:</strong></div>" +
            "<div class='right'>" + order['id'] + "</div>" +
            "</div>" +
            "<div class='select2-order__row'>" +
            "<div class='left'><strong>Total:</strong></div>" +
            "<div class='right'>" + order['currency'] + " " + order['total'] + " ~ " + order['amount_id'] + " " + order['token'] + "</div>" +
            "</div>" +
            "<div class='select2-order__row'>" +
            "<div class='left'><strong>Billing Email:</strong></div>" +
            "<div class='right'>" + order['billing_email'] + "</div>" +
            "</div>" +
            "<div class='select2-order__row'>" +
            "<div class='left'><strong>Date created:</strong></div>" +
            "<div class='right'>" + order['date_created'] + "</div>" +
            "</div>" +
            "</div>"
        );
        return $container;
    };

    wc_ezdefi_assign.prototype.formatOrderSelection = function(order) {
        return 'Order ID: ' + order['id'];
    };

    wc_ezdefi_assign.prototype.onAssign = function(e) {
        e.preventDefault();
        var row = $(e.target).closest('tr');
        var order_id = this.$select.val();
        var amount_id = this.$amountIdInput.val();
        var data = {
            action: 'wc_ezdefi_assign_amount_id',
            order_id: order_id,
            amount_id: amount_id
        };
        this.callAjax.call(this, data, row);
    };

    wc_ezdefi_assign.prototype.onRemove = function(e) {
        e.preventDefault();
        if(!confirm('Do you want to delete this amount ID')) {
            return false;
        }
        var row = $(e.target).closest('tr');
        var amount_id = this.$amountIdInput.val();
        var data = {
            action: 'wc_ezdefi_delete_amount_id',
            amount_id: amount_id
        };
        this.callAjax.call(this, data, row);
    };

    wc_ezdefi_assign.prototype.callAjax = function(data, row) {
        var self = this;
        $.ajax({
            url: wc_ezdefi_data.ajax_url,
            method: 'post',
            data: data,
            beforeSend: function() {
                self.$table.block({message: 'Waiting...'});
            },
            success:function(response) {
                self.$table.unblock();
                row.remove();
            },
            error: function(e) {
                self.$table.block({message: 'Something wrong happend.'});
            }
        });
    };

    new wc_ezdefi_assign();
});