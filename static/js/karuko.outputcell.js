/**
 * Extends Cell to handle output lines. OutputCell will, by default, display
 * the formatted output. Upon focus, the textarea is shown for editing.
 */
var OutputCell = Cell.$extend({
    __init__: function(worksheet /* Worksheet obj */, id /* int */) {
        this.$super(worksheet, id);
        
        //Denote this as an Output cell.
        this.$el.addClass('output');

        //Bridge from DOM to obj
        this.$el.data('OutputCell', this);
        this.$el.data('Element', this);

        //Also create a .formatted div where we will show our formatted output.
        this.$el.append('<span class="formatted"></span>');
        //Add helpful class variable
        this.$formatted = this.$el.find('.formatted');
    },

    /**
     * Sets the .formatted span's value.
     */
    set_formatted: function(val) {
        return this.$formatted.text(val);
    },


});
