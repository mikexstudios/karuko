/**
 * Extends Cell to handle input lines. InputCell will always have a textarea
 * for input. It also listens for execution and handles processing of the
 * calculation result.
 */
var InputCell = Cell.$extend({
    __init__: function(worksheet /* Worksheet obj */, id /* int */) {
        this.$super(worksheet, id);
        
        //Denote this as an Input cell.
        this.$el.addClass('input');

        //Bridge from DOM to obj
        this.$el.data('InputCell', this);
        this.$el.data('Element', this);
    }

});
