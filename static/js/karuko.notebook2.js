var InputArea = Class.$extend({
    __init__: function(cell /* Cell obj */) {
        this.cell = cell; //Cell obj this InputArea is associated with
        
        //Create textarea element and store it as a jQuery wrapped class var.
        //IDEA: Maybe move this textarea snippet out to a template instead of
        //      hard coding this in JS?
        this.cell.$input_entry.append('<textarea rows="1"></textarea>');
        //Create DOM <-> Object bridge. This enables us to easily access the
        //DOM/jQuery obj from this class. Conversely, we can also access this
        //class from a DOM/jQ obj.
        this.$el = this.cell.$input_entry.children('textarea');
        this.$el.data('InputArea', this);

        //Add events to this input area. We use proxy to pass `this` to the
        //callback functions.
        this.$el.bind('focusin.inputarea', $.proxy(this.on_focusin, this));
        this.$el.bind('focusout.inputarea', $.proxy(this.on_focusout, this));
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
        console.log('focusin');
        $this = this.$el; //for convenience
        
        //Make the textarea auto expand on newlines.
        //TODO: This plugin still suffers from the blinking text problem since
        //      there is slight lag when the function calculates whether or not
        //      to expand the textarea. We should replace this with a more 
        //      responsive solution.
        $this.autoGrow();
        
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
        console.log('focusout');
        $this = this.$el; //for convenience

        //Unbind the textarea auto-expander.
        $this.unbind('keyup.autogrow');

        //Unbind our keybindings.
        $this.unbind('keydown.inputarea');
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

            //Focus on prev cell.
            try {
                this.cell.prev().focus();
                //We want to catch undefined method error in case the previous
                //cell does not exist.
            } catch (error) {}
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

            //Focus on next cell.
            try {
                this.cell.next().focus();
                //We want to catch undefined method error in case the next
                //cell does not exist.
            } catch (error) {}
        }
    }
});

var Cell = Class.$extend({
    __init__: function(worksheet /* Worksheet obj */, id /* int */) {
        this.worksheet = worksheet; //Worksheet obj
        this.id = id;
        
        //Create cell element and store it as a class var so we can bridge 
        //this class and the DOM obj.
        this.$el = $('#new_cell_template').clone();
        this.$el.attr('id', 'cell-'+this.id);
        //TODO: Vary the class depending on the content.
        this.$el.addClass('calculation');

        //Bridge from DOM obj to this class.
        this.$el.data('Cell', this);
          
        //Set some more helpful class variables
        this.$input_line = this.$el.find('.line');
        this.$input_entry = this.$el.find('.entry');

        //Create InputArea in Cell's .entry table cell
        this.input_area = new InputArea(this);
    },

    /**
     * Returns prev cell object after this cell. If prev cell does not exist,
     * returns undefined.
     */
    prev: function() {
        return this.worksheet.prev_cell(this.id);
    },

    /**
     * Returns next cell object after this cell. If next cell does not exist,
     * returns undefined.
     */
    next: function() {
        return this.worksheet.next_cell(this.id);
    },

    /**
     * Triggers focus on the cell's input textarea.
     */
    focus: function() {
        this.$input_entry.children('textarea').focus(); 
    },

    /**
     * (For calculation cells) Sets and displays the In [_] numbering of the
     * cell.
     */
    set_in_number: function(x) {
        this.in_number = x;
        this.$input_line.text('In [' + x +']:');
    },

    /**
     * (For calculation cells) Sets and displays the Out[_] numbering of the
     * cell. If output sub-cell does not exist, then nothing will happen.
     */
    set_out_number: function(x) {
        this.out_number = x;
        if (this.$output_line != undefined) {
            this.$output_line.text('Out[' + x +']:');
        }
    },

    /**
     * Returns input textarea value.
     */
    get_input: function() {
        return this.input_area.get_value();
    },

    /**
     * Sets and displays `val` in output table cell. 
     *
     * If existing output cell does not exist, it will be automatically
     * created.
     */
    set_output: function(val) {
        //TODO: Maybe use tertiary compare here.
        if (this.get_output() == false) {
            //Output sub-cell does not exist. We need to create it.
            this.$output = $('#output_tr_template tr.output').clone();
            this.$el.append(this.$output);

            //Also set some helper selectors
            this.$output_line = this.$output.children('td.line');
            this.$output_entry = this.$output.children('td.entry');
        }

        this.$output.children('.entry').text(val);
    },

    /**
     * Returns output value. If not exist, then returns false.
     */
    get_output: function() {
        //TODO: Shorten all of this with tertiary compare?
        if (this.$output) {
            return this.$output.children('.entry').text();
        }
          
        //Otherwise, did not found .output sub-cell.
        return false;
    },

    /**
     * Sends cell input to calculation servers and sets up cell for result.
     *
     * Is also called from shift+return keydown binding (set in InputArea).
     */
    execute: function() {
        console.log('cell execute');

        //Assign In number to cell.
        var in_num = this.worksheet.get_next_calculation_id();
        this.set_in_number(in_num);

        //Display notification that calculation is running.
        
        //Setup next/new cell and put cursor there.
        cell = this.worksheet.add_cell();
        cell.focus();
        
        //Send calculation to server. The callback function is responsible for
        //creating the output cell.
        var payload = {
            statement: this.get_input(),
            session: this.worksheet.settings.session_key
        };
        //We use JSONP to get around cross-domain issues.
        $.getJSON(this.worksheet.settings.calc_server, payload,
                  $.proxy(this.on_result, this));

    },

    /**
     * Called when calculation is returned from server.
     */
    on_result: function(data) {
        //If there is no output, then don't show output cell
        if (data.out != '') {
            //console.log(data.out);

            //Insert output tr after input tr.
            this.set_output($.trim(data.out));
              
            //Assign Out[_] number to cell. It should be what the server
            //returns. However, for now, we will just set it to the In 
            //cell number.
            //NOTE: This must come after `this.set_output` since that method
            //      creates the output sub-cell if it doesn't already exist.
            this.set_out_number(this.in_number);
        }
    }
});

var Worksheet = Class.$extend({
    settings: {
        //Use JSONP server to get around cross-domain requests.
        calc_server: 'http://mtest.appspot.com/shell.do?callback=?',
        //Session obj identifier for the GAE model. Hard-coded for now.
        session_key: 'agVtdGVzdHIPCxIHU2Vzc2lvbhjO2iQM'
    },

    //Class vars
    //==========
    last_cell_id: 0, //keeps track of our last cell id
    //A counter for numbering the In [_] calculation cells. `In` numbering 
    //should start at 1. Thus, this counter is initialized to 0 and will
    //increment to 1 upon calling get_next_calculation_id(). Because cells
    //may not necessarily be calculations (they can be text), we can't just
    //use the cell's id to number the calculations.
    last_calculation_id: 0,
    //An array of cell ids in the order in which they exist on the page.
    cell_list: [],


    __init__: function(selector /* $('#worksheet') */, options) {
        //Create DOM <-> Object bridge. This enables us to easily access the
        //DOM/jQuery obj from this class. Conversely, we can also access this
        //class from a DOM/jQ obj.
        this.$el = selector; //jQuery object that selects #worksheet
        this.$el.data('Worksheet', this);

        $.extend(this.settings, options);
        
        //TODO: Replace individual focus events on textarea to live/dispatch
        //events on #worksheet.
          
        //Add first cell to page.
        cell = this.add_cell();
        cell.focus();
    },

    /**
     * Given a cell_id (int), returns Cell object associated with that id.
     * Returns undefined if cell does not exist.
     */
    get_cell: function(cell_id) {
        //We use jQ's selector to grab the next cell. Then we use the DOM to
        //Obj bridge to get the object.
        return $('#cell-' + cell_id).data('Cell');
    },

    /**
     * Returns prev cell object before the given cell_id. If prev cell does not
     * exist, returns undefined.
     */
    prev_cell: function(cell_id) {
        //Determine the index of the given cell_id
        var i = this.cell_list.indexOf(cell_id);
        //Get prev cell id
        var prev_cell_id = this.cell_list[i-1];

        return this.get_cell(prev_cell_id);
    },

    /**
     * Returns next cell object after the given cell_id. If next cell does not
     * exist, returns undefined.
     */
    next_cell: function(cell_id) {
        //Determine the index of the given cell_id
        var i = this.cell_list.indexOf(cell_id);
        //Get next cell id
        var next_cell_id = this.cell_list[i+1];

        return this.get_cell(next_cell_id);
    },

    /**
     * Returns int of the next cell's id.
     */
    get_next_cell_id: function() {
        this.last_cell_id += 1;
        return this.last_cell_id;
    },

    /**
     * Returns int of the next numbering for `In [_]` calculation cells.
     */
    get_next_calculation_id: function() {
        this.last_calculation_id += 1;
        return this.last_calculation_id;
    },
      
    //Defaults to adding new cell at end of cell list.
    add_cell: function(position) {
        //TODO: Implement `position`
        if (position) {
            return;
        }

        //Otherwise, add cell to end of worksheet
        var cell_id = this.get_next_cell_id();
        var cell = new Cell(this, cell_id);
        //Add cell's DOM element to end of worksheet.
        this.$el.append(cell.$el);

        //Add cell's id to cell list.
        this.cell_list.push(cell_id);

        return cell;
    }
});

function worksheet_vertical_fill() {
    //Take the window height and subtract the top position of the #worksheet
    //to find out how much more space we need to fill.
    var fill = $(window).height() - $('#worksheet').offset().top;
    //Correction factor (for margins and padding and other things).
    fill = fill - 40;
    //Because we are using tables, the table already enforces a 
    //minimum #worksheet height. So don't set a height unless it's positive.
    if (fill > 0) {
        $('#worksheet').css('height', fill);
    }
}

$(document).ready(function() {
    //If the worksheet length isn't long enough, extend it to fill the vertical
    //height of the screen.
    worksheet_vertical_fill();

    var worksheet = Worksheet($('#worksheet'), {});
});
