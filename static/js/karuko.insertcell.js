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
        console.log('focusin');
        $this = this.$el; //for convenience

        //Display bar (similar to when we hover over it using mouse)
        //NOTE: We can't trigger a CSS hover using jQuery's mouseover or hover.
        //      Thus, we resort to setting a css class.
        $this.addClass('insert_cell_hover');

        //Bind keyboard keys for moving or creating new cell
    },

    /**
     * Called when this div gets focus.
     */
    on_focusout: function(e) {
        console.log('focusout');

        //Remove display bar.
        $this.removeClass('insert_cell_hover');
    },
    
});
