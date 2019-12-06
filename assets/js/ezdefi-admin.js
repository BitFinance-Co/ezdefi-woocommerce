jQuery(function($) {
    'use strict';

    var selectors = {
        amountIdCheckbox: 'input[name="woocommerce_ezdefi_payment_method[amount_id]"]',
        ezdefiWalletCheckbox: 'input[name="woocommerce_ezdefi_payment_method[ezdefi_wallet]"]',
        symbolInput: '.currency-symbol',
        nameInput: '.currency-name',
        logoInput: '.currency-logo',
        descInput: '.currency-desc',
        walletInput: '.currency-wallet',
        decimalInput: '.currency-decimal',
        currencyTable: '#wc-ezdefi-currency-settings-table',
        currencySelect: '.select-select2',
        addBtn: '.addBtn',
        deleteBtn: '.deleteBtn',
        editBtn: '.editBtn',
        cancelBtn: '.cancelBtn',
        view: '.view',
        edit: '.edit',
        tip: '.help-tip'
    };

    var wc_ezdefi_admin = function() {
        this.$form = $('form');
        this.$table = $(selectors.currencyTable);

        var addCurrency = this.addCurrency.bind(this);
        var removeCurrency = this.removeCurrency.bind(this);
        var toggleEdit = this.toggleEdit.bind(this);
        var checkWalletAddress = this.checkWalletAddress.bind(this);
        var toggleAmountSetting = this.toggleAmountSetting.bind(this);
        var onChangeDecimal = this.onChangeDecimal.bind(this);
        var onBlurDecimal = this.onBlurDecimal.bind(this);

        this.init.call(this);

        $(document.body)
            .on('click', selectors.editBtn, toggleEdit)
            .on('click', selectors.cancelBtn, toggleEdit)
            .on('click', selectors.addBtn, addCurrency)
            .on('click', selectors.deleteBtn, removeCurrency)
            .on('keyup', selectors.walletInput, checkWalletAddress)
            .on('change', selectors.amountIdCheckbox, toggleAmountSetting)
            .on('focus', selectors.decimalInput, onChangeDecimal)
            .on('blur', selectors.decimalInput, onBlurDecimal);
    };

    wc_ezdefi_admin.prototype.init = function() {
        var self = this;

        self.initValidation.call(this);
        self.initSort.call(this);
        self.initTiptip.call(this);
        self.toggleAmountSetting(this);

        this.$table.find('select').each(function() {
            self.initCurrencySelect($(this));
        });
    };

    wc_ezdefi_admin.prototype.initValidation = function() {
        var self = this;

        this.$form.validate({
            ignore: [],
            errorElement: 'span',
            errorClass: 'error',
            errorPlacement: function(error, element) {
                if(element.hasClass('select-select2')) {
                    error.insertAfter(element.closest('.edit').find('.select2-container'));
                } else {
                    if(element.closest('td').find('span.error').length === 0) {
                        error.appendTo(element.closest('td'));
                    }
                }
            },
            highlight: function(element) {
                $(element).closest('td').addClass('form-invalid');
            },
            unhighlight: function(element) {
                $(element).closest('td').removeClass('form-invalid');
            },
            rules: {
                'woocommerce_ezdefi_api_url': {
                    required: true,
                    url: true
                },
                'woocommerce_ezdefi_api_key': {
                    required: true
                },
                'woocommerce_ezdefi_acceptable_variation': {
                    required: {
                        depends: function(element) {
                            return self.$form.find(selectors.amountIdCheckbox).is(':checked');
                        }
                    },
                    min: 0
                },
                'woocommerce_ezdefi_payment_method[amount_id]': {
                    required: {
                        depends: function(element) {
                            return ! self.$form.find(selectors.ezdefiWalletCheckbox).is(':checked');
                        }
                    }
                },
                'woocommerce_ezdefi_payment_method[ezdefi_wallet]': {
                    required: {
                        depends: function(element) {
                            return ! self.$form.find(selectors.amountIdCheckbox).is(':checked');
                        }
                    }
                }
            }
        });

        this.$table.find('tbody tr').each(function() {
            var row = $(this);
            self.addValidationRule(row);
        });
    };

    wc_ezdefi_admin.prototype.initSort = function() {
        var self = this;
        this.$table.find('tbody').sortable({
            handle: '.sortable-handle span',
            stop: function() {
                $(this).find('tr').each(function (rowIndex) {
                    var row = $(this);
                    self.updateAttr(row, rowIndex)
                });
            }
        }).disableSelection();
    };

    wc_ezdefi_admin.prototype.initTiptip = function() {
        this.$table.find(selectors.tip).tipTip();
    };

    wc_ezdefi_admin.prototype.addValidationRule = function($row) {
        var self = this;
        $row.find('input, select').each(function() {
            var name = $(this).attr('name');

            if(name.indexOf('discount') > 0) {
                $('input[name="'+name+'"]').rules('add', {
                    max: 100
                });
            }

            if(name.indexOf('select') > 0) {
                var $select = $('select[name="'+name+'"]');
                $select.rules('add', {
                    required: {
                        depends: function(element) {
                            return self.$form.find('.ezdefi_api_url input').val() !== '';
                        },
                    },
                    messages: {
                        required: 'Please select currency'
                    }
                });
                $select.on('select2:close', function () {
                    $(this).valid();
                });
            }

            if(name.indexOf('wallet') > 0) {
                var $input = $('input[name="'+name+'"]');
                $input.rules('add', {
                    required: true,
                    messages: {
                        required: 'Please enter wallet address'
                    }
                });
            }

            if(name.indexOf('block_confirm') > 0) {
                var $input = $('input[name="'+name+'"]');
                $input.rules('add', {
                    min: 0
                });
            }

            if(name.indexOf('decimal') > 0) {
                var $input = $('input[name="'+name+'"]');
                $input.rules('add', {
                    required: true,
                    min: 2,
                    messages: {
                        required: 'Please enter number of decimal',
                        min: 'Please enter number equal or greater than 2'
                    }
                });
            }
        });
    };

    wc_ezdefi_admin.prototype.toggleAmountSetting = function() {
        var checked = this.$form.find(selectors.amountIdCheckbox).is(':checked');
        var amount_settings = this.$form.find('#woocommerce_ezdefi_acceptable_variation').closest('tr');
        if(checked) {
            amount_settings.each(function() {
                $(this).show();
            });
        } else {
            amount_settings.each(function() {
                $(this).hide();
            });
        }
    };

    wc_ezdefi_admin.prototype.checkWalletAddress = function(e) {
        var self = this;
        var api_url = self.$form.find('#woocommerce_ezdefi_api_url').val();
        var api_key = self.$form.find('#woocommerce_ezdefi_api_key').val();
        var $input = $(e.target);
        var $row = $(e.target).closest('tr');
        var currency_chain = $row.find('.currency-chain').val();
        var $checking = $(
            "<div class='checking'><span class='text'>Checking wallet address</span>" +
            "<div class='dots'>" +
            "<div class='dot'></div>" +
            "<div class='dot'></div>" +
            "<div class='dot'></div>" +
            "</div>" +
            "</div>"
        );
        $input.rules('add', {
            remote: {
                depends: function(element) {
                    return api_url !== '' && api_key !== '' && currency_chain !== '';
                },
                param: {
                    url: wc_ezdefi_data.ajax_url,
                    type: 'POST',
                    data: {
                        action: 'wc_ezdefi_check_wallet',
                        address: function () {
                            return $input.val();
                        },
                        api_url: function() {
                            return api_url;
                        },
                        api_key: function() {
                            return api_key;
                        },
                        currency_chain: function() {
                            return currency_chain;
                        }
                    },
                    beforeSend: function() {
                        $input.closest('td').find('.error').hide();
                        $input.closest('.edit').append($checking);
                    },
                    complete: function (data) {
                        var response = data.responseText;
                        var $inputWrapper = $input.closest('td');
                        if (response === 'true') {
                            $inputWrapper.find('.checking').empty().append('<span class="correct">Correct</span>');
                            window.setTimeout(function () {
                                $inputWrapper.find('.checking').remove();
                            }, 1000);
                        } else {
                            $inputWrapper.find('.checking').remove();
                        }
                    }
                }
            },
            messages: {
                remote: "This address is not active. Please check again in <a href='http://163.172.170.35/profile/info'>your profile</a>."
            }
        });
    };

    wc_ezdefi_admin.prototype.initCurrencySelect = function(element) {
        var self = this;
        element.select2({
            width: '100%',
            ajax: {
                url: wc_ezdefi_data.ajax_url,
                type: 'POST',
                data: function(params) {
                    var query = {
                        action: 'wc_ezdefi_get_currency',
                        api_url: self.$form.find('#woocommerce_ezdefi_api_url').val(),
                        keyword: params.term
                    };

                    return query;
                },
                processResults: function(data) {
                    return {
                        results: data.data
                    }
                },
                cache: true,
                dataType: 'json',
                delay: 250
            },
            placeholder: 'Select currency',
            minimumInputLength: 1,
            templateResult: self.formatCurrencyOption,
            templateSelection: self.formatCurrencySelection
        });
        element.on('select2:select', self.onSelect2Select);
    };

    wc_ezdefi_admin.prototype.formatCurrencyOption = function(currency) {
        if(currency.loading) {
            return currency.text;
        }

        var $container = $(
            "<div class='select2-currency'>" +
            "<div class='select2-currency__icon'><img src='" + currency.logo + "' /></div>" +
            "<div class='select2-currency__name'>" + currency.name + "</div>" +
            "</div>"
        );

        return $container;
    };

    wc_ezdefi_admin.prototype.formatCurrencySelection = function(currency) {
        return currency.name || currency.text ;
    };

    wc_ezdefi_admin.prototype.toggleEdit = function(e) {
        e.preventDefault();

        var self = this;
        var $row = $(e.target).closest('tr');

        if($row.find(selectors.symbolInput).val() === '') {
            self.removeCurrency(e);
        }

        $row.toggleClass('editing');
    };

    wc_ezdefi_admin.prototype.addCurrency = function(e) {
        e.preventDefault();

        var $row = this.$table.find('tbody tr:last');
        var $clone = $row.clone();
        var count = this.$table.find('tbody tr').length;
        var selectName = $clone.find('select').attr('name')
        var $select = $('<select name="'+selectName+'" class="select-select2"></select>');

        $clone.find('select, .select2-container').remove();
        $clone.find('.logo img').attr('src', '');
        $clone.find('.name .view span').remove();
        $clone.find('.name .edit').prepend($select);
        $clone.find('input').val('');
        $clone.find('td').each(function() {
            $(this).removeClass('form-invalid');
            $(this).find('.error').remove();
        });
        this.updateAttr($clone, count);
        this.removeAttr($clone);
        $clone.insertAfter($row);
        this.initCurrencySelect($select);
        this.addValidationRule($clone);
        $clone.addClass('editing');
        return false;
    };

    wc_ezdefi_admin.prototype.removeCurrency = function(e) {
        e.preventDefault();

        var self = this;

        if(confirm('Do you want to delete this row')) {
            $(e.target).closest('tr').remove();
            self.$table.find('tr').each(function (rowIndex) {
                $(this).find('.select2-container').remove();
                var $select = $(this).find('.select-select2');
                self.initCurrencySelect($select);

                if($(this).hasClass('editing')) {
                    var name = $(this).find('.currency-name').val();
                    $(this).find('.select2-selection__rendered').attr('title', name);
                    $(this).find('.select2-selection__rendered').text(name);
                }

                var row = $(this);
                var number = rowIndex - 1;
                self.updateAttr(row, number);
            });
        }
        return false;
    };

    wc_ezdefi_admin.prototype.onSelect2Select = function(e) {
        var td = $(e.target).closest('td');
        var tr = $(e.target).closest('tr');
        var data = e.params.data;
        td.find('.currency-symbol').val(data.symbol);
        td.find('.currency-name').val(data.name);
        td.find('.currency-logo').val(data.logo);
        td.find('.currency-chain').val(data.chain.network_type);
        if(data.description) {
            td.find('.currency-desc').val(data.description);
        } else {
            td.find('.currency-desc').val('');
        }
        tr.find('.logo img').attr('src', data.logo);
        td.find('.view span').text(data.name);
    };

    wc_ezdefi_admin.prototype.updateAttr = function(row, number) {
        row.find('input, select').each(function () {
            var name = $(this).attr('name');
            name = name.replace(/\[(\d+)\]/, '[' + parseInt(number) + ']');
            $(this).attr('name', name).attr('id', name);
        });
    };

    wc_ezdefi_admin.prototype.removeAttr = function(row) {
        row.find('input, select').each(function () {
            $(this).removeAttr('aria-describedby').removeAttr('aria-invalid');
        });
    };

    wc_ezdefi_admin.prototype.onChangeDecimal = function(e) {
        var input = $(e.target);
        if(input.val().length > 0) {
            var td = $(e.target).closest('td');
            td.find('.edit').append('<span class="error">Changing decimal can cause to payment interruption</span>');
        }
    };

    wc_ezdefi_admin.prototype.onBlurDecimal = function(e) {
        var td = $(e.target).closest('td');
        td.find('.edit').find('.error').remove();
    };

    new wc_ezdefi_admin();
});