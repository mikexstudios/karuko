/**
 * @requires Cell, InputArea
 */
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
          
        //Also insert a 'insert_new_cell' div after this cell.
        //TODO: Make insert_new_cell have its own class.
        var insert_new_cell = $('#insert_cell_template').clone();
        insert_new_cell.attr('id', 'insert_cell-' + cell_id);
        this.$el.append(insert_new_cell);

        //Add cell's id to cell list.
        this.cell_list.push(cell_id);

        return cell;
    }
});
