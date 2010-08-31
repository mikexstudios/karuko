var InsertCell = Element.$extend({
    __init__: function(worksheet /* Worksheet obj */, id /* int */) {
        this.$super(worksheet, id);
        
        //Create insert cell element and store it as a class var so we can
        //bridge this class and the DOM obj.
        this.$el = $('#insertcell_template').clone();
        this.$el.attr('id', 'el-' + id);
        this.$el.data('InsertCell', this); //DOM <-> obj bridge
        this.$el.data('Element', this); //DOM <-> obj bridge
          
        //Add events to this div. We use `proxy` to pass `this` to the callback
        //functions.
        this.$el.bind('focusin.insertcell', $.proxy(this.on_focusin, this));
        this.$el.bind('focusout.insertcell', $.proxy(this.on_focusout, this));

        //We also bind a mousedown click event to this InsertCell. This will
        //presist and will not be unbound. The reason why this is a mousedown
        //instead of a 'click' event is that because of an edge case where if
        //a non-modified Cell is defocused by clicking the corresponding
        //InsertCell DOM element, that Cell and the InsertCell object will be
        //deleted before the click event triggers! So the current solution is
        //to slightly delay the defocus callback event so that the click event
        //can be triggered first. So we use 'mousedown' to immediately parse
        //the click rather than wait for the 'mouseup' that needs to occur in
        //the regular 'click' event. See ticket #28 for more info.
        this.$el.bind('mousedown.insertcell', $.proxy(this.on_mousedown, this));
    },

    /**
     * Triggers focus on the InsertCell's div.
     */
    focus: function() {
        this.$el.focus(); 
    },

    /**
     * Called when this div gets focus.
     */
    on_focusin: function(e) {
        //console.log('focusin');

        //Display bar (similar to when we hover over it using mouse)
        //NOTE: We can't trigger a CSS hover using jQuery's mouseover or hover.
        //      Thus, we resort to setting a css class.
        this.$el.addClass('insertcell_hover');

        //Bind keyboard keys for moving
        this.$el.bind('keydown.insertcell', 'up', $.proxy(this.on_up, this));
        this.$el.bind('keydown.insertcell', 'down', $.proxy(this.on_down, this));

        //Keybinding for creating new cell (any visible character will trigger
        //this event). We use the namespace so that we can unbind just this
        //event after it has been used.
        //IMPORTANT: We bind to 'keypress' instead of 'keydown' since the former:
        //           1. Ignores modifier keys (such as arrows, shift, etc.)
        //           2. Places charCode instead of keyCode in event.which. This
        //              means that we can convert charCode into its corresponding
        //              character accurately. (If we ever need to do so.)
        this.$el.bind('keypress.insertcell', $.proxy(this.on_keypress, this));
    },

    /**
     * Called when this div gets focus.
     */
    on_focusout: function(e) {
        //console.log('focusout');
        
        //Unbind keypress events
        this.$el.unbind('keydown.insertcell');
        this.$el.unbind('keypress.insertcell');

        //Remove display bar.
        this.$el.removeClass('insertcell_hover');
    },

    /**
     * Called when this div gets clicked. This means that the user intends to
     * insert a new Cell here.
     */
    on_mousedown: function(e) {
        //If we don't prevent the mousedown, the newly created cell can't be
        //focused.
        e.preventDefault();

        //TODO: This is a duplicate of code in the on_keypress method. Find
        //a way to reconcile these.

        //Insert new cell after this InsertCell and put cursor there.
        var cell = this.worksheet.add_cell(this.get_position() + 1);
        cell.focus();
    },

    /**
     * Called when keypress event is triggered. That is, if user's input is a
     * non-modifier key (that is, not a shift, alt, arrow, etc.  key).
     */
    on_keypress: function(e) {
        //POSSIBLE BUG: On Mac, Control+character key combination will
        //trigger keypress.
        //console.log('keypress');

        //Insert new cell after this InsertCell and put cursor there.
        var cell = this.worksheet.add_cell(this.get_position() + 1);
        cell.focus();

        //Edge case: When we create a new Cell and focus on it, the good thing
        //is that the user's keypress key will automatically be put into this
        //new Cell's InputArea. However, this keypress doesn't trigger the
        //InputArea's keypress event. This is weird but can probably be
        //explained by the fact that our keypress was never on the newly added
        //Cell.  Therefore, we manually trigger that the InputArea is modified
        //here.
        cell.input_area.$el.keypress();
    },

    /**
     * Called when up keydown event is triggered. Skips to previous element.
     */
    on_up: function(e) {
        //console.log('up');

        this.prev().focus();
        //try {
        //    this.worksheet.get_cell(this.id).focus();
        //    //We want to catch undefined method error in case the previous
        //    //cell does not exist.
        //} catch (error) {}
    },

    /**
     * Called when down keydown event is triggered. Skips to next cell.
     */
    on_down: function(e) {
        //console.log('down');

        this.next().focus();
        //try {
        //    this.worksheet.next_cell(this.id).focus();
        //    //We want to catch undefined method error in case the previous
        //    //cell does not exist.
        //} catch (error) {}
    }
    
});
