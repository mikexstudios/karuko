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

        //Events
        //TODO: Make this a delegate/live event.
        this.$el.bind('focusout.outputcell', $.proxy(this.on_focusout, this));
    },

    /**
     * Sets the .formatted span's value.
     */
    set_formatted: function(val) {
        return this.$formatted.text(val);
    },

    /**
     * Triggers focus on the OutputCell's textarea. Since the textarea is normally
     * hidden, we need to show it first. And also hide the .formatted span.
     */
    focus: function() {
        this.$formatted.hide();
        this.input_area.show();

        this.$super();
    },

    /**
     * Called when cell loses focus. We want to hide the textarea and re-show
     * .formatted span.
     */
    on_focusout: function(e) {
        //console.log('focusout');

        this.$formatted.show();
        this.input_area.hide();
    }

});
