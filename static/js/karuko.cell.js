/**
 * @require InputArea
 */
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
