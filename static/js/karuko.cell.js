/**
 * A base class that defines a general Cell. A Cell is a Worksheet Element that
 * accepts or displays some sort of information. Subclassed for InputCell and
 * OutputCell. 
 *
 * IMPORTANT: Right now, we are assuming all Cells are calculation cells. We may
 * want to generalize this class even further.
 */
var Cell = Element.$extend({
    //Class vars
    //==========
    //For convenience when working with the InsertCell paired/associated with 
    //this Cell, we set this variable to the InsertCell obj reference when 
    //adding a new Cell in Worksheet.
    insertcell: null,
      
    __init__: function(worksheet /* Worksheet obj */, id /* int */) {
        this.$super(worksheet, id);

        //Create cell element and store it as a class var so we can bridge 
        //this class and the DOM obj.
        this.$el = $('#cell_template').clone();
        this.$el.attr('id', 'el-'+this.id);
        //TODO: Vary the class depending on the content.
        this.$el.addClass('calculation');

        //NOTE: We bridge from DOM obj in the subclass.

        //Create InputArea as Cell's .entry. Both InputCell and
        //OutputCell will have an InputArea. The difference is that
        //OutputCell's InputArea will be hidden until focused.
        this.input_area = new InputArea(this);
          
        //Set some more helpful class variables
        this.$line = this.$el.find('.line');
        this.$entry = this.$el.find('.entry'); //the textarea

    },

    /**
     * Triggers focus on the cell's input textarea if exists.
     */
    focus: function() {
        this.input_area.focus(); 
    },

    /**
     * Sets the line numbering of the calculation. Either In [_] or Out[_].
     *
     * @param x int The number to display in the brackets.
     * @param type string Either 'In' or 'Out'. Defaults to 'In'.
     */
    set_number: function(x, type) {
        this.number = x;

        if (type != 'Out') {
            this.$line.text('In [' + x +']:');
        } else {
            this.$line.text('Out[' + x +']:');
        }
    },

    /**
     * Sets the entry's value.
     *
     * NOTE: Entry always refers to the textarea.
     */
    set_entry: function(val) {
        return this.input_area.set_value(val);
    },

    /**
     * Returns the entry's value.
     *
     * NOTE: Entry always refers to the textarea.
     */
    get_entry: function() {
        return this.input_area.get_value();
    },

    /**
     * Sends cell input to calculation servers and sets up cell for result.
     *
     * Is also called from shift+return keydown binding (set in InputArea).
     */
    execute: function() {
        //console.log('cell execute');

        //Assign In number to cell.
        var in_num = this.worksheet.get_next_calculation_id();
        this.set_number(in_num, 'In');

        //Display notification that calculation is running by setting the class
        //of the Cell to be '.processing' since that will show the spinner.
        //Once the results come back, '.processing' will be removed.
        this.input_area.$el.addClass('processing');
        
        //Create a new Cell after this and put our cursor there. Because of the
        //way `add_cell` works, if the given position is at the end of the page, 
        //then the newly created Cell won't be automatically deleted if empty.
        var cell = this.worksheet.add_cell(this.get_position() + 2);
        cell.focus();
        
        //Send calculation to server. The callback function is responsible for
        //creating the output cell.
        var payload = {
            statement: this.get_entry(),
            session: this.worksheet.settings.session_key
        };
        //We use JSONP to get around cross-domain issues.
        $.getJSON(this.worksheet.settings.calc_server, payload,
                  $.proxy(this.on_result, this));

    },

    /**
     * Called when calculation is returned from server. A new OutputCell after
     * this Cell is created and populated with the calculation results.
     */
    on_result: function(data) {
        //Once the resuts come back, no need to display spinner anymore. This
        //is regardless if there is data or not.
        this.input_area.$el.removeClass('processing');

        //If there is no output, then don't create output cell
        if (data.out != '') {
            //console.log(data.out);
            var cell = this.worksheet.add_cell(this.get_position() + 2, OutputCell);

            //Insert output tr after input tr.
            //TODO: Make formatted show LaTeX.
            cell.set_entry($.trim(data.out));
            cell.set_formatted($.trim(data.out));
              
            //Assign Out[_] number to cell. It should be what the server
            //returns. However, for now, we will just set it to the In cell
            //number.
            cell.set_number(this.number, 'Out');
        }
    }

});
