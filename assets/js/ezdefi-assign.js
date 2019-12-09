jQuery(function($) {
    'use strict';

    var selectors = {
        table: '#wc-ezdefi-order-assign',
        select: '#order-select',
        amountIdInput: '#amount-id',
        currencyInput: '#currency',
        assignBtn: '.assignBtn',
        removeBtn: '.removeBtn'
    };

    var wc_ezdefi_assign = function() {
        this.$table = $(selectors.table);
        this.$select = this.$table.find(selectors.select);

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
        var self = this;
        var row = $(e.target).closest('tr');
        var order_id = row.find(selectors.select).val();
        var amount_id = row.find(selectors.amountIdInput).val();
        var currency = row.find(selectors.currencyInput).val();
        var data = {
            action: 'wc_ezdefi_assign_amount_id',
            order_id: order_id,
            amount_id: amount_id,
            currency: currency
        };
        this.callAjax.call(this, data).success(function() {
            self.$table.unblock();
            self.$table.find('tr select').each(function() {
                $(this).find('option[value="' + order_id + '"]').remove();
            });
            row.remove();
        });
    };

    wc_ezdefi_assign.prototype.onRemove = function(e) {
        e.preventDefault();
        if(!confirm('Do you want to delete this amount ID')) {
            return false;
        }
        var self = this;
        var row = $(e.target).closest('tr');
        var amount_id = row.find(selectors.amountIdInput).val();
        var currency = row.find(selectors.currencyInput).val();
        var data = {
            action: 'wc_ezdefi_delete_amount_id',
            amount_id: amount_id,
            currency: currency
        };
        this.callAjax.call(this, data).success(function() {
            self.$table.unblock();
            row.remove();
        });
    };

    wc_ezdefi_assign.prototype.callAjax = function(data) {
        var self = this;
        return $.ajax({
            url: wc_ezdefi_data.ajax_url,
            method: 'post',
            data: data,
            beforeSend: function() {
                self.$table.block({message: 'Waiting...'});
            },
            error: function(e) {
                self.$table.block({message: 'Something wrong happend.'});
            }
        });
    };

    new wc_ezdefi_assign();
});