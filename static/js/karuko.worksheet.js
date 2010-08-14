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

        //Add first InsertCell to page with ID of 0. We need to do this since
        //all new cells create an InsertCell *after* itself, but we have a 
        //single case here where we want to put an InsertCell in the Worksheet
        //when there are no Cells created yet.
        var insert_cell = new InsertCell(this, 0);
        this.$el.append(insert_cell.$el);
          
        //Add first Cell to page.
        cell = this.add_cell();
        cell.focus();
    },

    /**
     * Given a cell_id (int), returns the Cell's position on the page starting
     * from 1 (being the first cell on the page). If Cell with given cell_id
     * does not exist, returns undefined.
     */
    get_cell_position: function(cell_id) {
        //Special case: A cell_id of 0 is *always* at position 0 (top of page).
        //We don't actually have a cell of id = 0, but we have an InsertCell
        //that has an id of 0.
        //if (cell_id <= 0) {
        //    return 0;
        //}
        return this.cell_list.indexOf(cell_id);
    },

    /**
     * Given a cell_id (int), returns Cell object associated with that id.
     * Returns undefined if cell does not exist.
     */
    get_cell: function(cell_id) {
        //We use jQ's selector to grab the cell. Then we use the DOM to
        //Obj bridge to get the object.
        return $('#cell-' + cell_id).data('Cell');
    },

    /**
     * Given a position in the Worksheet cell_list, returns Cell object at that
     * position.  Returns undefined if cell does not exist at that position.
     */
    get_cell_at_position: function(position) {
        //Get Cell's ID at given position
        var cell_id = this.cell_list[position];
        return this.get_cell(cell_id);
    },

    /**
     * Returns prev cell object before the given cell_id. If prev cell does not
     * exist, returns undefined.
     */
    prev_cell: function(cell_id) {
        //Determine the index of the given cell_id
        var i = this.get_cell_position(cell_id);
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
        var i = this.get_cell_position(cell_id);
        //Get next cell id
        var next_cell_id = this.cell_list[i+1];

        return this.get_cell(next_cell_id);
    },

    /**
     * Returns prev InsertCell object before the given cell_id. If does not
     * exist, returns undefined.
     */
    prev_insertcell: function(cell_id) {
        //Moving to the previous InsertCell means that we are moving to the
        //InsertCell associated with the previous cell id. Therefore, we 
        //need to determine the previous cell's ID first.
          
        //Determine the index of the given cell_id
        var i = this.get_cell_position(cell_id);
        //If the index is 0. That is, the given cell_id refers to the top-most
        //cell of the worksheet, then our previous cell_id is 0. This is a special
        //case that we need to account for since we don't actually have a cell
        //with cell_id = 0 BUT we have an insert_cell-0 at the top of the
        //worksheet.
        if (i > 0) {
            //Get prev cell id
            var prev_cell_id = this.cell_list[i-1];
        } else {
            var prev_cell_id = 0;
        }

        return this.get_insertcell(prev_cell_id);
    },

    /**
     * Returns next InsertCell object after the given cell_id. If does not
     * exist, returns undefined.
     */
    next_insertcell: function(cell_id) {
        //The next InsertCell from the given cell_id has the same cell_id.
        return this.get_insertcell(cell_id);
    },

    /**
     * Returns the InsertCell object associated with the given cell_id. If does
     * not exist, returns undefined.
     */
    get_insertcell: function(cell_id) {
        //We use jQ's selector to grab the InsertCell DOM. Then we use the DOM
        //to Obj bridge to get the object.
        return $('#insert_cell-' + cell_id).data('InsertCell');
    },

    /**
     * Given a position in the Worksheet cell_list, returns InsertCell object
     * at that position. Returns undefined if InsertCell does not exist at that
     * position.
     */
    get_insertcell_at_position: function(position) {
        //Get Cell's ID at given position
        var cell_id = this.cell_list[position];
        //Return the InsertCell associated with the Cell's ID
        return this.get_insertcell(cell_id);
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
      
    /**
     * Creates and adds a new Cell and InsertCell object to the Worksheet
     * (along with the DOM object). If position is given, then the new objects
     * will be inserted at after that position in the cell_list with -1 being the
     * first/top-most position. If no position is given, then the new objs
     * will be inserted at the end of the list.
     *
     * @return Cell The newly added Cell object.
     */
    add_cell: function(position) {
        //Create new Cell object with a new ID.
        var cell_id = this.get_next_cell_id();
        var cell = new Cell(this, cell_id);

        //Create new InsertCell obj with the same id as the Cell.
        var insert_cell = new InsertCell(this, cell_id);

        //If position is given, new objects will be inserted there. Otherwise,
        //will be inserted at the end of the Worksheet.
        if (position) {
            //If position is -1, then we insert at the top of the worksheet.
            //Otherwise, insert the objs *after* the existing cell at the given
            //position. For instance, position = 0 means inserting the new
            //cell after the first Cell in the worksheet (in position = 1).
            if (position <= -1) {
                //The InsertCell with id of 0 serves as our top anchor point to
                //insert after. Note that to have the InsertCell appear *after*
                //the Cell, we insert it before the Cell so that it gets pushed
                //down when we insert the Cell.
                $('#insert_cell-0').after(insert_cell.$el);
                $('#insert_cell-0').after(cell.$el);

            } else {
                //Otherwise, we insert *after* the existing Cell's InsertCell
                //with the given position. First, we need to get the existing
                //InsertCell at that position.
                var existing_insertcell = this.get_insertcell_at_position(position);
                //Now insert our new objects after this existing Cell. Note
                //that to have the InsertCell appear *after* the Cell, we
                //insert it before the Cell so that it gets pushed down when we
                //insert the Cell.
                existing_insertcell.$el.after(insert_cell.$el);
                existing_insertcell.$el.after(cell.$el);
            }
              
            //Add cell's id to cell list. Note that to make position work with
            //splice indexes, we need to add 1 since we map position = -1 to
            //splice index 0, position = 0 to splice index 1, etc.
            this.cell_list.splice(position + 1, 0, cell_id);
            console.log(this.cell_list);

        } else {
            //Add cell's DOM element to end of worksheet.
            this.$el.append(cell.$el);
              
            //Also insert an InsertCell after this Cell.
            //NOTE: The InsertCell should have the same id as the cell it comes
            //      after. This is necessary for traversing.
            this.$el.append(insert_cell.$el);

            //Add cell's id to end of cell list.
            this.cell_list.push(cell_id);
        }

        return cell;
    },

    /**
     * Removes Cell (given its id) from Worksheet (both this object and DOM).
     */
    remove_cell: function(cell_id) {
        var cell = this.get_cell(cell_id);
        if (cell) {
            //Remove DOM object from #worksheet
            //cell.remove();
            cell.$el.remove();

            //Remove Cell from cell_list. First, find out what index it is.
            var i = this.get_cell_position(cell_id);
            this.cell_list.splice(i, i+1); //Slice it out of the array

            //Also remove the corresponding InsertCell after this Cell
            var insertcell = this.get_insertcell(cell_id);
            insertcell.$el.remove();
        }
    }
});
