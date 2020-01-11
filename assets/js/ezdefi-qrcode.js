jQuery(function($) {
    const selectors = {
        container: '#wc_ezdefi_qrcode',
        changeBtn: '.changeBtn',
        select: '.currency-select',
        itemWrap: '.currency-item__wrap',
        item: '.currency-item',
        selected: '.selected-currency',
        paymentData: '#payment-data',
        submitBtn: '.submitBtn',
        ezdefiPayment: '.ezdefi-payment',
        tabs: '.ezdefi-payment-tabs',
        panel: '.ezdefi-payment-panel',
        ezdefiEnableBtn: '.ezdefiEnableBtn',
        loader: '.wc-ezdefi-loader',
        copy: '.copy-to-clipboard',
        qrcode: '.qrcode',
        changeQrcodeBtn: '.changeQrcodeBtn'
    };

    var wc_ezdefi_qrcode = function() {
        this.$container = $(selectors.container);
        this.$loader = this.$container.find(selectors.loader);
        this.$tabs = this.$container.find(selectors.tabs);
        this.$currencySelect = this.$container.find(selectors.select);
        this.paymentData = JSON.parse(this.$container.find(selectors.paymentData).text());
        this.xhrPool = [];
        this.checkOrderLoop;

        var init = this.init.bind(this);
        var onSelectItem = this.onSelectItem.bind(this);
        var onClickEzdefiLink = this.onClickEzdefiLink.bind(this);
        var onUseAltQrcode = this.onUseAltQrcode.bind(this);
        var onClickQrcode = this.onClickQrcode.bind(this);

        init();

        $(document.body)
            .on('click', selectors.itemWrap, onSelectItem)
            .on('click', selectors.ezdefiEnableBtn, onClickEzdefiLink)
            .on('click', selectors.qrcode, onClickQrcode)
            .on('click', selectors.changeQrcodeBtn, onUseAltQrcode);
    };

    wc_ezdefi_qrcode.prototype.init = function() {
        var self = this;

        self.$tabs.tabs({
            activate: function(event, ui) {
                if(!ui.newPanel || ui.newPanel.is(':empty')) {
                    var method = ui.newPanel.attr('id');
                    self.getEzdefiPayment.call(self, method, ui.newPanel);
                }
                window.history.replaceState(null, null, ui.newPanel.selector);
                // var url = ui.newTab.find('a').prop('href');
                // if(url) {
                //     location.href = url;
                // }
                // $(window).scrollTop(ui.newPanel.offset().top);
            },
        });

        var active = self.$tabs.find('div.ui-tabs-panel[aria-hidden="false"]');
        var method = active.attr('id');

        self.getEzdefiPayment.call(self, method, active);

        var clipboard = new ClipboardJS(selectors.copy);
        clipboard.on('success', function(e) {
            var trigger = $(e.trigger)[0];
            console.log(trigger);
            trigger.classList.add('copied');
            setTimeout(function () {
                trigger.classList.remove('copied');
            }, 2000);
        });
    };

    wc_ezdefi_qrcode.prototype.onClickQrcode = function(e) {
        var self = this;
        var target = $(e.target);
        if(!target.hasClass('expired')) {
            return;
        } else {
            e.preventDefault();
            self.$currencySelect.find('.selected').click();
        }
    };

    wc_ezdefi_qrcode.prototype.getEzdefiPayment = function(method, panel) {
        var self = this;
        var symbol = this.$currencySelect.find(selectors.item + '.selected').attr('data-symbol');
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
                self.$loader.show();
                self.$tabs.hide();
            },
            success:function(response) {
                if(response.success) {
                    panel.html($(response.data));
                } else {
                    panel.html(response.data);
                }
                self.setTimeRemaining.call(self, panel);
                self.$loader.hide();
                self.$tabs.show();
                self.checkOrderStatus.call(self);
            },
            error: function(e) {
                console.log(e);
            }
        });
    };

    wc_ezdefi_qrcode.prototype.onSelectItem = function(e) {
        var self = this;
        this.$currencySelect.find(selectors.item).removeClass('selected');
        var target = $(e.target);
        var selected;
        if(target.is(selectors.itemWrap)) {
            selected = target.find(selectors.item).addClass('selected');
        } else {
            selected = target.closest(selectors.itemWrap).find(selectors.item).addClass('selected');
        }
        var symbol = selected.attr('data-symbol');
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
                self.$tabs.hide();
                self.$loader.show();
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
                self.setTimeRemaining.call(self, active);
                self.$loader.hide();
                self.$tabs.show();
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

    wc_ezdefi_qrcode.prototype.onUseAltQrcode = function(e) {
        var self = this;
        e.preventDefault();
        this.$tabs.find('#amount_id .qrcode img.main').toggle();
        this.$tabs.find('#amount_id .qrcode__info--main').toggle();
        this.$tabs.find('#amount_id .qrcode img.alt').toggle();
        this.$tabs.find('#amount_id .qrcode__info--alt').toggle();
    };

    wc_ezdefi_qrcode.prototype.checkOrderStatus = function() {
        var self = this;

        self.checkOrderLoop = setInterval(function () {
            $.ajax({
                url: wc_ezdefi_data.ajax_url,
                method: 'post',
                data: {
                    action: 'wc_ezdefi_check_order_status',
                    order_id: self.paymentData.uoid
                },
                beforeSend: function(jqXHR) {
                    self.xhrPool.push(jqXHR);
                },
                success: function (response) {
                    if (response == 'completed') {
                        $.each(self.xhrPool, function(index, jqXHR) {
                            jqXHR.abort();
                        });
                        self.success();
                    }
                }
            });
        }, 600);
    };

    wc_ezdefi_qrcode.prototype.setTimeRemaining = function(panel) {
        var self = this;
        var timeLoop = setInterval(function() {
            var endTime = panel.find('.count-down').attr('data-endtime');
            var t = self.getTimeRemaining(endTime);
            var countDown = panel.find(selectors.ezdefiPayment).find('.count-down');

            if(t.total < 0) {
                clearInterval(timeLoop);
                countDown.text('0:0');
                self.timeout(panel);
            } else {
                countDown.text(t.text);
            }
        }, 1000);
    };

    wc_ezdefi_qrcode.prototype.getTimeRemaining = function(endTime) {
        var t = new Date(endTime).getTime() - new Date().getTime();
        var minutes = Math.floor((t / 60000));
        var seconds = (t % 60000 / 1000).toFixed(0);
        return {
            'total': t,
            'text': (seconds == 60 ? (minutes +1) + ":00" : minutes + ":" + (seconds < 10 ? "0" : "") + seconds)
        };
    };

    wc_ezdefi_qrcode.prototype.success = function() {
        location.reload(true)
    };

    wc_ezdefi_qrcode.prototype.timeout = function(panel) {
        panel.find('.qrcode').addClass('expired');
    };

    new wc_ezdefi_qrcode();
});