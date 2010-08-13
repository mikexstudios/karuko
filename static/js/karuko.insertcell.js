var InsertCell = Class.$extend({
    /**
     * NOTE: The id of this InsertCell should be the same as the Cell id
     *       this InsertCell comes after. By following this formalism, 
     *       we can traverse between Cells and InsertCells easily.
     */
    __init__: function(worksheet /* Worksheet obj */, id /* int */) {
        this.worksheet = worksheet; //Worksheet obj
        this.id = id;
        
        //Create insert cell element and store it as a class var so we can
        //bridge this class and the DOM obj.
        this.$el = $('#insert_cell_template').clone();
        this.$el.attr('id', 'insert_cell-' + id);
        //Bridge from DOM obj to this class.
        this.$el.data('InsertCell', this);
          
        //Add events to this div. We use `proxy` to pass `this` to the callback
        //functions.
        this.$el.bind('focusin.insertcell', $.proxy(this.on_focusin, this));
        this.$el.bind('focusout.insertcell', $.proxy(this.on_focusout, this));
    },

    /**
     * Triggers focus on the InsertCell's div.
     */
    focus: function() {
        this.$el.focus(); 
    },

    /**
     * Returns prev cell object before this insert cell div. If prev cell does
     * not exist, returns undefined.
     */
    prev: function() {
        return this.worksheet.prev_cell(this.id);
    },

    /**
     * Returns next cell object after this insert cell div. If next cell does
     * not exist, returns undefined.
     */
    next: function() {
        return this.worksheet.next_cell(this.id);
    },

    /**
     * Called when this div gets focus.
     */
    on_focusin: function(e) {
        //console.log('focusin');

        //Display bar (similar to when we hover over it using mouse)
        //NOTE: We can't trigger a CSS hover using jQuery's mouseover or hover.
        //      Thus, we resort to setting a css class.
        this.$el.addClass('insert_cell_hover');

        //Bind keyboard keys for moving
        this.$el.bind('keydown.insertcell', 'up', $.proxy(this.on_up, this));
        this.$el.bind('keydown.insertcell', 'down', $.proxy(this.on_down, this));

        //Keybinding for creating new cell (any visible character will trigger
        //this event).
    },

    /**
     * Called when this div gets focus.
     */
    on_focusout: function(e) {
        //console.log('focusout');

        //Remove display bar.
        this.$el.removeClass('insert_cell_hover');
    },

    /**
     * Called when up keydown event is triggered. Skips to previous cell.
     */
    on_up: function(e) {
        //console.log('up');
        //The previous cell is the cell with this InsertCell's same id. So
        //we don't use the worksheet.prev_cell method (which will skip us 
        //two cells back).
        try {
            this.worksheet.get_cell(this.id).focus();
            //We want to catch undefined method error in case the previous
            //cell does not exist.
        } catch (error) {}
    },

    /**
     * Called when down keydown event is triggered. Skips to next cell.
     */
    on_down: function(e) {
        //console.log('down');
        try {
            this.worksheet.next_cell(this.id).focus();
            //We want to catch undefined method error in case the previous
            //cell does not exist.
        } catch (error) {}
    }
    
});
