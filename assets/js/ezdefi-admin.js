jQuery(function($) {
  "use strict";

  var selectors = {
    apiKeyInput: "#woocommerce_ezdefi_api_key",
    amountIdCheckbox:
      'input[name="woocommerce_ezdefi_payment_method[amount_id]"]',
    ezdefiWalletCheckbox:
      'input[name="woocommerce_ezdefi_payment_method[ezdefi_wallet]"]',
    symbolInput: ".currency-symbol",
    nameInput: ".currency-name",
    logoInput: ".currency-logo",
    descInput: ".currency-desc",
    walletInput: ".currency-wallet",
    decimalInput: ".currency-decimal",
    currencyTable: "#wc-ezdefi-currency-settings-table",
    currencySelect: ".select-select2",
    addBtn: ".addBtn",
    deleteBtn: ".deleteBtn",
    editBtn: ".editBtn",
    cancelBtn: ".cancelBtn",
    view: ".view",
    edit: ".edit",
    tip: ".help-tip"
  };

  var wc_ezdefi_admin = function() {
    this.$form = $("form");
    this.$table = $(selectors.currencyTable);

    var addCurrency = this.addCurrency.bind(this);
    var removeCurrency = this.removeCurrency.bind(this);
    var toggleEdit = this.toggleEdit.bind(this);
    var toggleAmountSetting = this.toggleAmountSetting.bind(this);
    var onChangeDecimal = this.onChangeDecimal.bind(this);
    var onBlurDecimal = this.onBlurDecimal.bind(this);
    var onChangeApiKey = this.onChangeApiKey.bind(this);

    this.init.call(this);

    $(document.body)
      .on("click", selectors.editBtn, toggleEdit)
      .on("click", selectors.cancelBtn, toggleEdit)
      .on("click", selectors.addBtn, addCurrency)
      .on("click", selectors.deleteBtn, removeCurrency)
      .on("change", selectors.amountIdCheckbox, toggleAmountSetting)
      .on("focus", selectors.decimalInput, onChangeDecimal)
      .on("blur", selectors.decimalInput, onBlurDecimal)
      .on("change", selectors.apiKeyInput, onChangeApiKey);
  };

  wc_ezdefi_admin.prototype.init = function() {
    var self = this;

    self.$form.find(selectors.apiKeyInput).attr("autocomplete", "off");

    self.customValidationRule();
    self.initValidation.call(this);
    self.initSort.call(this);
    self.initTiptip.call(this);
    self.toggleAmountSetting(this);

    this.$table.find("select").each(function() {
      self.initCurrencySelect($(this));
    });
  };

  wc_ezdefi_admin.prototype.customValidationRule = function() {
    jQuery.validator.addMethod(
      "greaterThanZero",
      function(value, element) {
        return parseFloat(value) > 0;
      },
      "Please enter a value greater than 0"
    );
    jQuery.extend(jQuery.validator.messages, {
      min: jQuery.validator.format("Min: {0}"),
      max: jQuery.validator.format("Max: {0}"),
      required: "Required"
    });
  };

  wc_ezdefi_admin.prototype.initValidation = function() {
    var self = this;

    this.$form.validate({
      ignore: [],
      errorElement: "span",
      errorClass: "error",
      errorPlacement: function(error, element) {
        if (element.hasClass("select-select2")) {
          error.insertAfter(
            element.closest(".edit").find(".select2-container")
          );
        } else {
          if (element.closest("td").find("span.error").length > 0) {
            element
              .closest("td")
              .find("span.error")
              .remove();
          }
          error.appendTo(element.closest("td"));
        }
      },
      highlight: function(element) {
        $(element)
          .closest("td")
          .addClass("form-invalid");
      },
      unhighlight: function(element) {
        $(element)
          .closest("td")
          .removeClass("form-invalid");
      },
      rules: {
        woocommerce_ezdefi_api_url: {
          required: true,
          url: true
        },
        woocommerce_ezdefi_api_key: {
          required: true
        },
        woocommerce_ezdefi_acceptable_variation: {
          required: {
            depends: function(element) {
              return self.$form.find(selectors.amountIdCheckbox).is(":checked");
            }
          },
          greaterThanZero: true,
          max: 100
        },
        "woocommerce_ezdefi_payment_method[amount_id]": {
          required: {
            depends: function(element) {
              return !self.$form
                .find(selectors.ezdefiWalletCheckbox)
                .is(":checked");
            }
          }
        },
        "woocommerce_ezdefi_payment_method[ezdefi_wallet]": {
          required: {
            depends: function(element) {
              return !self.$form
                .find(selectors.amountIdCheckbox)
                .is(":checked");
            }
          }
        }
      }
    });

    this.$table.find("tbody tr").each(function() {
      var row = $(this);
      self.addValidationRule(row);
    });
  };

  wc_ezdefi_admin.prototype.initSort = function() {
    var self = this;
    this.$table
      .find("tbody")
      .sortable({
        handle: ".sortable-handle span",
        stop: function() {
          $(this)
            .find("tr")
            .each(function(rowIndex) {
              var row = $(this);
              self.updateAttr(row, rowIndex);
            });
        }
      })
      .disableSelection();
  };

  wc_ezdefi_admin.prototype.initTiptip = function() {
    this.$table.find(selectors.tip).tipTip();
  };

  wc_ezdefi_admin.prototype.addValidationRule = function($row) {
    var self = this;
    $row.find("input, select").each(function() {
      var name = $(this).attr("name");

      if (name.indexOf("discount") > 0) {
        $('input[name="' + name + '"]').rules("add", {
          min: 0,
          max: 100
        });
      }

      if (name.indexOf("select") > 0) {
        var $select = $('select[name="' + name + '"]');
        $select.rules("add", {
          required: {
            depends: function(element) {
              return self.$form.find(".ezdefi_api_url input").val() !== "";
            }
          },
          messages: {
            required: "Please select currency"
          }
        });
        $select.on("select2:close", function() {
          $(this).valid();
        });
      }

      if (name.indexOf("wallet") > 0) {
        var $input = $('input[name="' + name + '"]');
        $input.rules("add", {
          required: true,
          messages: {
            required: "Please enter wallet address"
          }
        });
      }

      if (name.indexOf("lifetime") > 0) {
        var $input = $('input[name="' + name + '"]');
        $input.rules("add", {
          min: 0
        });
      }

      if (name.indexOf("block_confirm") > 0) {
        var $input = $('input[name="' + name + '"]');
        $input.rules("add", {
          min: 0
        });
      }

      if (name.indexOf("decimal") > 0 && name.indexOf("decimal_max") < 0) {
        var $input = $('input[name="' + name + '"]');
        var decimal_max = parseInt(
          $input
            .parent()
            .find(".currency-decimal-max")
            .val()
        );
        $input.rules("add", {
          required: true,
          min: 2,
          max: decimal_max
        });
      }
    });
  };

  wc_ezdefi_admin.prototype.toggleAmountSetting = function() {
    var checked = this.$form.find(selectors.amountIdCheckbox).is(":checked");
    var amount_settings = this.$form
      .find("#woocommerce_ezdefi_acceptable_variation")
      .closest("tr");
    if (checked) {
      amount_settings.each(function() {
        $(this).show();
      });
    } else {
      amount_settings.each(function() {
        $(this).hide();
      });
    }
  };

  wc_ezdefi_admin.prototype.initCurrencySelect = function(element) {
    var self = this;
    element.select2({
      width: "100%",
      ajax: {
        url: wc_ezdefi_data.ajax_url,
        type: "POST",
        data: function(params) {
          var query = {
            action: "wc_ezdefi_get_currency",
            api_url: self.$form.find("#woocommerce_ezdefi_api_url").val(),
            api_key: self.$form.find("#woocommerce_ezdefi_api_key").val(),
            keyword: params.term
          };

          return query;
        },
        processResults: function(data) {
          return {
            results: data.data
          };
        },
        cache: true,
        dataType: "json",
        delay: 250
      },
      placeholder: "Select currency",
      minimumInputLength: 1,
      templateResult: self.formatCurrencyOption,
      templateSelection: self.formatCurrencySelection
    });
    element.on("select2:select", self.onSelect2Select);
  };

  wc_ezdefi_admin.prototype.formatCurrencyOption = function(currency) {
    if (currency.loading) {
      return currency.text;
    }

    var excludes = [];

    $(selectors.currencyTable)
      .find("tbody tr")
      .each(function() {
        var symbol = $(this)
          .find(selectors.symbolInput)
          .val();
        if (symbol && symbol.length > 0) {
          excludes.push(symbol);
        }
      });

    if (excludes.includes(currency.symbol)) {
      return;
    }

    var $container = $(
      "<div class='select2-currency'>" +
        "<div class='select2-currency__icon'><img src='" +
        currency.logo +
        "' /></div>" +
        "<div class='select2-currency__name'>" +
        currency.name +
        "</div>" +
        "</div>"
    );

    return $container;
  };

  wc_ezdefi_admin.prototype.formatCurrencySelection = function(currency) {
    return currency.name || currency.text;
  };

  wc_ezdefi_admin.prototype.toggleEdit = function(e) {
    e.preventDefault();

    var self = this;
    var $row = $(e.target).closest("tr");

    if ($row.find(selectors.symbolInput).val() === "") {
      self.removeCurrency(e);
    }

    $row.toggleClass("editing");
  };

  wc_ezdefi_admin.prototype.addCurrency = function(e) {
    e.preventDefault();
    var $row = this.$table.find("tbody tr:last");
    var $clone = $row.clone();
    var count = this.$table.find("tbody tr").length;
    var selectName = $clone.find("select").attr("name");
    var $select = $(
      '<select name="' + selectName + '" class="select-select2"></select>'
    );

    $clone.attr("data-saved", "0");
    $clone.find("select, .select2-container").remove();
    $clone.find(".logo img").attr("src", "");
    $clone.find(".name .view span").empty();
    $clone.find(".name .edit").prepend($select);
    $clone.find("input").each(function() {
      var input = $(this);
      var td = input.closest("td");
      if (input.is('input[name*="discount"]')) {
        input.val(0);
      } else if (input.is('input[name*="lifetime"]')) {
        input.val(15);
      } else if (input.is('input[name*="block_confirm"]')) {
        input.val(1);
      } else {
        input.val("");
      }
      if (!td.hasClass("name")) {
        td.find(".view").empty();
      }
    });
    $clone.find("td").each(function() {
      $(this).removeClass("form-invalid");
      $(this)
        .find(".error")
        .remove();
    });
    this.updateAttr($clone, count);
    this.removeAttr($clone);
    $clone.insertAfter($row);
    this.initCurrencySelect($select);
    this.addValidationRule($clone);
    $clone.addClass("editing");
    return false;
  };

  wc_ezdefi_admin.prototype.removeCurrency = function(e) {
    e.preventDefault();

    var self = this;

    if (self.$table.find("tbody tr").length === 1) {
      alert("You must select at least 1 accepted currency");
      return false;
    }

    if (confirm("Do you want to delete this row")) {
      $(e.target)
        .closest("tr")
        .remove();
      self.$table.find("tr").each(function(rowIndex) {
        $(this)
          .find(".select2-container")
          .remove();
        var $select = $(this).find(".select-select2");
        self.initCurrencySelect($select);

        if ($(this).hasClass("editing")) {
          var name = $(this)
            .find(".currency-name")
            .val();
          $(this)
            .find(".select2-selection__rendered")
            .attr("title", name);
          $(this)
            .find(".select2-selection__rendered")
            .text(name);
        }

        var row = $(this);
        var number = rowIndex - 1;
        self.updateAttr(row, number);
      });
    }
    return false;
  };

  wc_ezdefi_admin.prototype.onSelect2Select = function(e) {
    var td = $(e.target).closest("td");
    var tr = $(e.target).closest("tr");
    var data = e.params.data;
    td.find(".currency-symbol").val(data.symbol);
    td.find(".currency-name").val(data.name);
    td.find(".currency-logo").val(data.logo);
    td.find(".currency-chain").val(data.chain.network_type);
    if (data.description) {
      td.find(".currency-desc").val(data.description);
    } else {
      td.find(".currency-desc").val("");
    }
    tr.find(".logo img").attr("src", data.logo);
    tr.find(".currency-decimal").val(data.suggestedDecimal);
    tr.find(".currency-decimal")
      .closest("td")
      .find(".view")
      .text(data.suggestedDecimal);
    tr.find(".currency-decimal").rules("remove", "max");
    tr.find(".currency-decimal-max").val(data.decimal);
    tr.find(".currency-decimal").rules("add", {
      max: data.decimal
    });
    tr.find(".currency-decimal").valid();
    td.find(".view span").text(data.name);
  };

  wc_ezdefi_admin.prototype.updateAttr = function(row, number) {
    row.find("input, select").each(function() {
      var name = $(this).attr("name");
      name = name.replace(/\[(\d+)\]/, "[" + parseInt(number) + "]");
      $(this)
        .attr("name", name)
        .attr("id", name);
    });
  };

  wc_ezdefi_admin.prototype.removeAttr = function(row) {
    row.find("input, select").each(function() {
      $(this)
        .removeAttr("aria-describedby")
        .removeAttr("aria-invalid");
    });
  };

  wc_ezdefi_admin.prototype.onChangeDecimal = function(e) {
    var input = $(e.target);
    if (
      input.val().length > 0 &&
      input.closest("tr").attr("data-saved") == "1"
    ) {
      var td = $(e.target).closest("td");
      if (td.find("span.error").length === 0) {
        td.find(".edit").append(
          '<span class="error decimal-warning">Changing decimal can cause to payment interruption</span>'
        );
      }
    }
  };

  wc_ezdefi_admin.prototype.onBlurDecimal = function(e) {
    var td = $(e.target).closest("td");
    td.find(".edit")
      .find(".decimal-warning")
      .remove();
  };

  wc_ezdefi_admin.prototype.onChangeApiKey = function(e) {
    var self = this;
    var $input = $(e.target);
    $input.rules("add", {
      remote: {
        url: wc_ezdefi_data.ajax_url,
        type: "POST",
        data: {
          action: "wc_ezdefi_check_api_key",
          api_url: function() {
            return self.$form.find("#woocommerce_ezdefi_api_url").val();
          },
          api_key: function() {
            return self.$form.find("#woocommerce_ezdefi_api_key").val();
          }
        },
        complete: function(data) {
          var response = data.responseText;
          var $inputWrapper = self.$form
            .find("#woocommerce_ezdefi_api_key")
            .closest("td");
          if (response === "true") {
            $inputWrapper.append('<span class="correct">Correct</span>');
            window.setTimeout(function() {
              $inputWrapper.find(".correct").remove();
            }, 1000);
          }
        }
      },
      messages: {
        remote: "API Key is not correct. Please check again"
      }
    });
  };

  new wc_ezdefi_admin();
});
