var InputArea = Class.$extend({
    __init__: function(cell /* Cell obj */) {
        this.cell = cell; //Cell obj this InputArea is associated with
        
        //Create textarea element and store it as a jQuery wrapped class var.
        //IDEA: Maybe move this textarea snippet out to a template instead of
        //      hard coding this in JS?
        this.cell.$entry.append('<textarea rows="1"></textarea>');
        this.$el = this.cell.$entry.children('textarea');

        //Add events to this input area. We use proxy to pass `this` to the
        //callback functions.
        this.$el.bind('focusin.inputarea', $.proxy(this.on_focusin, this));
        this.$el.bind('focusout.inputarea', $.proxy(this.on_focusout, this));
    },

    /**
     * Called when textarea gets focus.
     */
    on_focusin: function() {
        console.log('focusin');
        $this = this.$el; //for convenience
        
        //Make the textarea auto expand on newlines.
        //TODO: This plugin still suffers from the blinking text problem since
        //      there is slight lag when the function calculates whether or not
        //      to expand the textarea. We should replace this with a more 
        //      responsive solution.
        $this.autoGrow();
    },

    /**
     * Called when textarea loses focus.
     */
    on_focusout: function() {
        console.log('focusout');
        $this = this.$el; //for convenience

        //Unbind the textarea auto-expander.
        $this.unbind('keyup.autogrow');
    }
});

var Cell = Class.$extend({
    __init__: function(worksheet /* $('#worksheet') */, id /* int */) {
        this.$worksheet = worksheet; //jQuery object that selects #worksheet
        this.id = id;
        
        //Create cell element and store it as a jQuery wrapped class var.
        this.$el = $('#new_cell_template').clone();
        this.$el.attr('id', 'cell-'+this.id);
        //TODO: Vary the class depending on the content.
        this.$el.addClass('calculation');
          
        //Set some more helpful class variables
        this.$entry = this.$el.find('.entry');

        //Create InputArea in Cell's .entry table cell
        this.input_area = new InputArea(this);
    },

    /**
     * Triggers focus on the cell's input textarea.
     */
    focus: function() {
        this.$entry.children('textarea').focus(); 
    },

    execute: function() {
        console.log('executed');
    },

    /**
     * Called when cell is focused.
     *
     * Sets up textarea autoexpander and keybindings.
     */
    on_focus: function() {
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
    last_cell_id: 0, //keeps track of our last cell id


    __init__: function(selector /* $('#worksheet') */, options) {
        this.$el = selector; //jQuery object that selects #worksheet
        $.extend(this.settings, options);
        
        //TODO: Replace individual focus events on textarea to live/dispatch
        //events on #worksheet.
          
        //Add first cell to page.
        cell = this.add_cell();
        cell.focus();
    },

    get_next_cell_id: function() {
        this.last_cell_id += 1;
        return this.last_cell_id;
    },
      
    //Defaults to adding new cell at end of cell list.
    add_cell: function(position) {
        //TODO: Implement `position`
        if (position) {
            return;
        }

        //Otherwise, add cell to end of worksheet
        var cell_id = this.get_next_cell_id();
        var cell = new Cell(this.el, cell_id);
        //Add cell's DOM element to end of worksheet.
        this.$el.append(cell.$el);

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
