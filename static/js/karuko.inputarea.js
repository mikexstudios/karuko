var InputArea = Class.$extend({
    //Keeps track of if this InputArea has ever been typed in. Once a keypress is
    //made, this will be set to true. This variable is important in keeping track
    //if the Cell should be auto-removed. That is, new Cells that have never been
    //typed in yet should be removed when focus is lost.
    is_modified: false,

    __init__: function(cell /* Cell obj */) {
        this.cell = cell; //Cell obj this InputArea is associated with
        
        //Create textarea element and store it as a jQuery wrapped class var.
        //IDEA: Maybe move this textarea snippet out to a template instead of
        //      hard coding this in JS?
        this.cell.$el.append('<textarea rows="1" class="entry"></textarea>');
        //Create DOM <-> Object bridge. This enables us to easily access the
        //DOM/jQuery obj from this class. Conversely, we can also access this
        //class from a DOM/jQ obj.
        this.$el = this.cell.$el.children('textarea');
        this.$el.data('InputArea', this);

        //Add events to this input area. We use proxy to pass `this` to the
        //callback functions.
        this.$el.bind('focusin.inputarea', $.proxy(this.on_focusin, this));
        //NOTE: We are defering the execution of this callback very slightly.
        //The reason for this is to handle cases where this InputArea/Cell 
        //would be removed on focusout *before* an event that requires that this
        //InputArea/Cell still exist. 
        //
        //An example is if a non-modified Cell is defocused by clicking the
        //corresponding InsertCell DOM element, that Cell and the InsertCell
        //object will be deleted before the click event triggers! So the
        //current solution is to slightly delay the defocus callback event so
        //that the click event can be triggered first. See ticket #28 for more
        //info.
        //
        //Another example is if the up arrow is pressed on a non-modified Cell.
        //Without deferring, the Cell would be removed before the code to focus
        //on the prev element fires. So this defer trick works rather well!
        this.$el.bind('focusout.inputarea', $.defer(50, $.proxy(this.on_focusout, this)));

        //We add this keypress event here since we want it to be a one-time
        //event that is removed once it is called.
        this.$el.bind('keypress.inputarea', $.proxy(this.on_keypress, this));
    },

    /**
     * Un-hides the textarea if hidden.
     */
    show: function() {
        this.$el.show();
    },

    /**
     * Triggers focus on the textarea.
     */
    focus: function() {
        this.$el.focus();
    },

    /**
     * Sets value of the textarea.
     */
    set_value: function(val) {
        return this.$el.val(val);
    },

    /**
     * Returns value of the textarea.
     */
    get_value: function() {
        return this.$el.val();
    },

    /**
     * Called when textarea gets focus.
     */
    on_focusin: function(e) {
        //console.log('focusin');
        
        //Make the textarea auto expand on newlines.
        //TODO: This plugin still suffers from the blinking text problem since
        //      there is slight lag when the function calculates whether or not
        //      to expand the textarea. We should replace this with a more 
        //      responsive solution.
        this.$el.autoGrow();
        
        //Add keyboard events.
        this.$el.bind('keydown.inputarea', 'shift+return', 
                      $.proxy(this.on_execute, this));
        this.$el.bind('keydown.inputarea', 'up', $.proxy(this.on_up, this));
        this.$el.bind('keydown.inputarea', 'down', $.proxy(this.on_down, this));
        //this.$el.bind('keydown.inputarea', 'left', $.proxy(this.on_up, this));
        //this.$el.bind('keydown.inputarea', 'right', $.proxy(this.on_up, this));
    },

    /**
     * Called when textarea loses focus.
     */
    on_focusout: function(e) {
        //console.log('focusout');

        //Unbind the textarea auto-expander.
        this.$el.unbind('keyup.autogrow');

        //Unbind our keybindings.
        this.$el.unbind('keydown.inputarea');

        //New cells that have never been typed in should be automatically removed
        //from the worksheet when focus is removed. Note that we don't want the
        //first and only Cell in the Worksheet or the last Cell in the Worksheet
        //to be removed. We do that by manually triggering keypresses on them.
        //NOTE: We don't include code for where we will focus next. That is 
        //      handled in the on_up/on_down methods.
        if (this.is_modified == false) {
            this.cell.remove();
            //TODO: Note there is a bug in doing this. See #28!
            this.cell.insertcell.remove();
        }
    },

    /**
     * Called when shift+return keydown event is triggered.
     */
    on_execute: function(e) {
        //Don't let the enter keypress create a newline.
        e.preventDefault();

        //We change the context that `cell.execute` gets to `this.cell` since
        //that method was originally intended to run within the `Cell` object
        //context.
        $.proxy(this.cell.execute, this.cell)();
    },

    /**
     * Returns an object with two attributes: .x and .y where .x is the column
     * that the cursor is on and .y is the row the cursor is on.
     * NOTE: Both x and y start counting at zero.
     *
     * @param type Important when there is a selection in the textarea. Then
     *             there are two positions for the cursor: the start or end
     *             of the selection. Set type to 'start' (default) to get
     *             the coords of the start cursor. Set to 'end' for the end
     *             cursor.
     */
    get_cursor_coordinates: function(type) {
        var lines = this.get_value().split('\n');
        //This position is counted from the start of the textbox. We use this
        //and the split lines to determine x, y position.
        if (type != 'end') {
            var cursor_position = this.$el.caret().start; //uses jquery.caret plugin
        } else {
            var cursor_position = this.$el.caret().end; 
        }

        //We iterate through each line accumulating the number of characters
        //(including the newline) until we reach the reported cursor position.
        //We keep track of two variables: calculated position of the start of
        //the current line and the calculated position of the end of the current
        //line.
        var line_position = {start: 0, end: 0}; //initialize
        var coords = {x: 0, y: 0}; //initialize
        $.each(lines, function(row, line) {
            line_position.end += line.length;
            //Correction since each "newline" also takes a position. When we 
            //split by newline, the newline is removed from the split strings.
            line_position.end += 1;
            
            //Now determine if the cursor position is within the calculated
            //position for the current line. We subtract 1 since we start 
            //counting position from 0.
            if (cursor_position <= line_position.end - 1) {
                //Yes, the cursor position is in this line.
                coords.y = row;
                coords.x = cursor_position - line_position.start;
                  
                //Break from the each
                return false;
            }

            //Since we are moving to the next line, our end position of the 
            //previous line is now our start position.
            line_position.start = line_position.end;
        });
        
        return coords;
    },

    /**
     * Called when up keydown event is triggered. When the cursor on the first
     * line of the textarea and the up arrow is pressed, then the cursor should
     * skip to the above textarea (if one exists).
     */
    on_up: function(e) {
        //console.log('up');

        //Need to determine if the start of the cursor selection is on the
        //first line. Using start takes into account selections in textarea.
        row = this.get_cursor_coordinates('start').y;

        //Calculate if the cursor is on the first line.
        //NOTE: We start row counting from 0.
        if (row <= 0) {
            //Need to prevent default so that the caret position remains set.
            //Otherwise, the caret will jump to position 0 (beginning of line).
            e.preventDefault();

            //Focus on prev InsertCell.
            this.cell.prev().focus();
            //try {
            //    this.cell.prev().focus();
            //    //We want to catch undefined method error in case the previous
            //    //InsertCell does not exist.
            //} catch (error) {}
        }
    },

    /**
     * Called when down keydown event is triggered. When the cursor on the last
     * line of the textarea and the down arrow is pressed, then the cursor should
     * skip to the below textarea (if one exists).
     */
    on_down: function(e) {
        //console.log('down');

        //Using end takes into account selections in textarea.
        row = this.get_cursor_coordinates('end').y;

        //We subtract 1 from the textarea's rows since our row count starts at 0.
        if (row >= this.$el.get(0).rows - 1) {
            //Need to prevent default so that the caret position remains set.
            //Otherwise, the caret will jump to end of line.
            e.preventDefault();

            //Focus on next InsertCell.
            this.cell.next().focus();
            //try {
            //    this.cell.next_insertcell().focus();
            //    //We want to catch undefined method error in case the next
            //    //InsertCell does not exist.
            //} catch (error) {}
        }
    },

    /**
     * Called when keypress event is triggered. That is, if user's input is a
     * non-modifier key (that is, not a shift, alt, arrow, etc.  key).
     *
     * IMPORTANT: When user keypresses on InsertCell element which creates a
     * new Cell (and InputArea), that keypress doesn't register through the
     * InsertCell's textarea's keypress event binding. Thus, we had to manually
     * trigger a keypress on InsertCell when we did that. See insertcell.js'
     * on_keypress method.
     */
    on_keypress: function(e) {
        //console.log('keypress inputarea');

        //Set flag that this InputArea has been typed in.
        this.is_modified = true;
        
        //Unbind this keypress event.
        this.$el.unbind('keypress.inputarea');
    }
});
