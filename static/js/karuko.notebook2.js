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

          
        //Add first cell to page.
        cell = this.add_cell();
        //TODO: Focus cell
        //cell.focus();
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
        var new_cell = $('#new_cell_template').clone();
        new_cell.attr('id', 'cell-'+cell_id);
        //TODO: Vary the class depending on the content.
        new_cell.addClass('calculation');
        this.$el.append(new_cell);

        return new_cell;
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
