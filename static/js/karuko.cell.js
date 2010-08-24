/**
 * A base class that defines a general Cell. A Cell is a Worksheet Element that
 * accepts or displays some sort of information. Subclassed for InputCell and
 * OutputCell. 
 *
 * IMPORTANT: Right now, we are assuming all Cells are calculation cells. We may
 * want to generalize this class even further.
 */
var Cell = Element.$extend({
    __init__: function(worksheet /* Worksheet obj */, id /* int */) {
        this.$super(worksheet, id);

        //Create cell element and store it as a class var so we can bridge 
        //this class and the DOM obj.
        this.$el = $('#new_cell_template').clone();
        this.$el.attr('id', 'cell-'+this.id);
        //TODO: Vary the class depending on the content.
        this.$el.addClass('calculation');

        //Bridge from DOM obj to this class.
        this.$el.data('Cell', this);
          
        //Set some more helpful class variables
        this.$line = this.$el.find('.line');
        this.$entry = this.$el.find('.entry');
    },

    /**
     * Triggers focus on the cell's input textarea if exists.
     */
    focus: function() {
        this.$entry.children('textarea').focus(); 
    },

    //Need to implement the following:

    /**
     * Sets the line numbering of the calculation. Either In [_] or Out[_].
     */
    set_number: function(x) {
    },

    /**
     * Sets the entry's value.
     */
    set_entry: function() {
    },

    /**
     * Returns the entry's value.
     */
    get_entry: function() {
    }

});
