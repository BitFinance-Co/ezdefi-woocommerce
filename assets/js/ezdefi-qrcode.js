jQuery(function($) {
    const selectors = {
        container: '#wc_ezdefi_qrcode',
        changeBtn: '.changeBtn',
        select: '.currency-select',
        item: '.currency-item',
        selected: '.selected-currency',
        paymentData: '#payment-data',
        submitBtn: '.submitBtn',
        ezdefiPayment: '.ezdefi-payment',
        tabs: '.ezdefi-payment-tabs',
        panel: '.ezdefi-payment-panel',
        ezdefiEnableBtn: '.ezdefiEnableBtn',
    };

    var wc_ezdefi_qrcode = function() {
        this.$container = $(selectors.container);
        this.$tabs = this.$container.find(selectors.tabs);
        this.$currencySelect = this.$container.find(selectors.select);
        this.$submitBtn = this.$container.find(selectors.submitBtn);
        this.paymentData = JSON.parse(this.$container.find(selectors.paymentData).text());
        this.xhrPool = [];
        this.checkOrderLoop;

        var init = this.init.bind(this);
        var onChange = this.onChange.bind(this);
        var onSelectItem = this.onSelectItem.bind(this);
        var onSubmit = this.onSubmit.bind(this);
        var onClickEzdefiLink = this.onClickEzdefiLink.bind(this);

        init();

        $(document.body)
            .on('click', selectors.changeBtn, onChange)
            .on('click', selectors.item, onSelectItem)
            .on('click', selectors.submitBtn, onSubmit)
            .on('click', selectors.ezdefiEnableBtn, onClickEzdefiLink);
    };

    wc_ezdefi_qrcode.prototype.init = function() {
        var self = this;

        self.$tabs.tabs({
            activate: function(event, ui) {
                if(!ui.newPanel || ui.newPanel.is(':empty')) {
                    var method = ui.newPanel.attr('id');
                    self.getEzdefiPayment.call(self, method, ui.newPanel);
                }
            }
        });

        var index = self.$tabs.tabs('option', 'active');
        var active = self.$tabs.find(selectors.panel + ':eq('+index+')');
        var method = active.attr('id');

        self.getEzdefiPayment.call(self, method, active);
    };

    wc_ezdefi_qrcode.prototype.getEzdefiPayment = function(method, panel) {
        var self = this;
        var symbol = this.$container.find(selectors.selected).find('.symbol').text();
        if(!symbol) {
            return false;
        }
        $.ajax({
            url: wc_ezdefi_data.ajax_url,
            method: 'post',
            data: {
                action: 'wc_ezdefi_get_payment',
                uoid: self.paymentData.uoid,
                symbol: symbol,
                method: method
            },
            beforeSend: function() {
                clearInterval(self.checkOrderLoop);
                $.each(self.xhrPool, function(index, jqXHR) {
                    jqXHR.abort();
                });
                self.$container.block({message: null});
            },
            success:function(response) {
                if(response.success) {
                    panel.html($(response.data));
                } else {
                    panel.html(response.data);
                }
                var endTime = panel.find('.count-down').attr('data-endtime');
                self.setTimeRemaining.call(self, endTime);
                self.$container.unblock();
                self.checkOrderStatus.call(self);
            },
            error: function(e) {
                console.log(e);
            }
        });
    };

    wc_ezdefi_qrcode.prototype.onChange = function(e) {
        e.preventDefault();
        this.$currencySelect.toggle();
        this.$submitBtn.prop('disabled', false).text('Confirm').show();
        this.$tabs.hide();
    };

    wc_ezdefi_qrcode.prototype.onSelectItem = function(e) {
        var $item = $(e.target).closest(selectors.item);
        var $selected = this.$container.find(selectors.selected);

        $selected.find('.logo').attr('src', $item.find('.logo').attr('src'));
        $selected.find('.symbol').text($item.find('.symbol').text());
        $selected.find('.name').text($item.find('.name').text());

        var desc = $item.find('.desc');

        if(desc) {
            $selected.find('.desc').text($item.find('.desc').text());
        }
    };

    wc_ezdefi_qrcode.prototype.onSubmit = function(e) {
        var self = this;
        var symbol = this.$container.find(selectors.selected).find('.symbol').text();
        if(!symbol) {
            return false;
        }
        var index = self.$tabs.tabs( "option", "active" );
        var active = self.$tabs.find(selectors.panel + ':eq('+index+')');
        var method = active.attr('id');
        $.ajax({
            url: wc_ezdefi_data.ajax_url,
            method: 'post',
            data: {
                action: 'wc_ezdefi_create_payment',
                uoid: self.paymentData.uoid,
                symbol: symbol,
                method: method
            },
            beforeSend: function() {
                self.$currencySelect.hide();
                self.$tabs.hide();
                self.$submitBtn.prop('disabled', true).text('Loading...');
                self.$container.block({message: null});
                clearInterval(self.checkOrderLoop);
                $.each(self.xhrPool, function(index, jqXHR) {
                    jqXHR.abort();
                });
            },
            success:function(response) {
                self.$tabs.find(selectors.panel).empty();
                if(response.success) {
                    active.html($(response.data));
                } else {
                    active.html(response.data);
                }
                var endTime = active.find('.count-down').attr('data-endtime');
                self.setTimeRemaining.call(self, endTime);
                self.$container.unblock();
                self.$tabs.show();
                self.$submitBtn.prop('disabled', false).text('Confirm').hide();
                self.checkOrderStatus.call(self);
            },
            error: function(e) {
                console.log(e);
            }
        });
    };

    wc_ezdefi_qrcode.prototype.onClickEzdefiLink = function(e) {
        var self = this;
        e.preventDefault();
        self.$tabs.tabs('option', 'active', 1);
    };

    wc_ezdefi_qrcode.prototype.checkOrderStatus = function() {
        var self = this;

        // self.checkOrderLoop = setInterval(function () {
        //     $.ajax({
        //         url: wc_ezdefi_data.ajax_url,
        //         method: 'post',
        //         data: {
        //             action: 'wc_ezdefi_check_order_status',
        //             order_id: self.paymentData.uoid
        //         },
        //         beforeSend: function(jqXHR) {
        //             self.xhrPool.push(jqXHR);
        //         },
        //         success: function (response) {
        //             if (response == 'completed') {
        //                 $.each(self.xhrPool, function(index, jqXHR) {
        //                     jqXHR.abort();
        //                 });
        //                 self.success();
        //             }
        //         }
        //     });
        // }, 600);
    };

    wc_ezdefi_qrcode.prototype.setTimeRemaining = function(endTime) {
        var self = this;
        clearInterval(self.timeLoop);
        self.timeLoop = setInterval(function() {
            var t = self.getTimeRemaining(endTime);
            var countDown = self.$container.find(selectors.ezdefiPayment).find('.count-down');

            if(t.total < 0) {
                clearInterval(self.timeLoop);
                self.timeout();
            }

            countDown.text(t.minutes + ':' + t.seconds);
        }, 1000);
    };

    wc_ezdefi_qrcode.prototype.getTimeRemaining = function(endTime) {
        var t = new Date(endTime).getTime() - new Date().getTime();
        var minutes = Math.floor((t / 60000));
        var seconds = (t % 60000 / 1000).toFixed(0);
        return {
            'total': t,
            'minutes': minutes,
            'seconds': seconds
        };
    };

    wc_ezdefi_qrcode.prototype.success = function() {
        location.reload(true)
    };

    wc_ezdefi_qrcode.prototype.timeout = function() {
        var self = this;
        var panel = self.$tabs.find('div.ui-tabs-panel[aria-hidden="false"]');
        panel.find('.qrcode').block({
            message: 'Expired',
            cursor: 'default',
            css: {
                border: 'none',
                background: 'none',
                color: '#f73f2e',
                fontWeight: 'bold'
            },
            overlayCSS:  {
                backgroundColor: '#fff',
                opacity: 0.8,
            },
        });
    };

    new wc_ezdefi_qrcode();
});