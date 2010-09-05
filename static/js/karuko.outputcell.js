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
        this.$el.bind('mousedown.insertcell', $.proxy(this.on_mousedown, this));
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
    },

    /**
     * Called when cell gets clicked. We show the input area.
     */
    on_mousedown: function(e) {
        //If we don't prevent the mousedown, the textarea can't be focused.
        e.preventDefault();

        this.$formatted.hide();
        this.input_area.show();

        this.input_area.focus();
    },

    /**
     * In addition to the .execute method of the parent Cell class, also
     * converts the current cell into an InputCell. Triggered by shift+return
     * keydown binding (set in InputArea). 
     */
    execute: function() {
        //We create a new InputCell right after this OutputCell and populate it
        //with the exact same contents. Then we delete this OutputCell.
        var this_position = this.worksheet.get_position_for_id(this.id);
        cell = this.worksheet.add_cell(this_position + 1); //Add after the InsertCell
        //Set contents of new cell with contents of this cell.
        cell.set_entry(this.get_entry());

        //Remove this cell
        this.worksheet.delete_cell(this_position);

        //Execute the new cell
        cell.execute();

        //NOTE: We don't call $super since everything is now done by the new cell.
        delete this;
    }

});
