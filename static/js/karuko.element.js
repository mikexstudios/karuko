/**
 * Element is the base class for all objects placed on/in the Worksheet 
 * such as Cells and InsertCells.
 */
var Element = Class.$extend({
    __init__: function(worksheet /* Worksheet obj */, id /* int */) {
        this.worksheet = worksheet; //Worksheet obj
        this.id = id;

        //NOTE: We leave: a) creating the actual DOM object and bridging
        //steps to the child class.
    },

    /**
     * Removes this Element from DOM and `delete this` object, marking it as
     * freed for GC. 
     *
     * NOTE: Does not remove Element from Worksheet's element_list. That's the
     *       Worksheet's job.
     */
    destroy: function() {
        //Remove DOM object
        this.$el.remove();

        //Remove reference. (This might not actually do anything.)
        delete this;
    },

    /**
     * Removes this Element from the Worksheet and destroys it from the DOM.
     *
     * NOTE: The Worksheet class calls this object's `destroy` method.
     */
    remove: function() {
        this.worksheet.remove(this.id);
    },

    /**
     * Returns int of Element's position in the Worksheet. If this Element is not
     * part of the Worksheet, returns undefined.
     */
    get_position: function() {
        return this.worksheet.get_position(this.id);
    },

    /**
     * Returns prev Element object. That is, the Element object that is positioned
     * above this Element. If does not exist, returns undefined.
     */
    prev: function() {
        return this.worksheet.get_prev_el(this.id);
    },

    /**
     * Returns next Element object. That is, the Element object that is positioned
     * below this Element. If does not exist, returns undefined.
     */
    next: function() {
        return this.worksheet.get_next_el(this.id);
    }
});
