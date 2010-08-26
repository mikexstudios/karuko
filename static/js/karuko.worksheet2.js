var Worksheet = Class.$extend({
    settings: {
        //Use JSONP server to get around cross-domain requests.
        calc_server: 'http://mtest.appspot.com/shell.do?callback=?',
        //Session obj identifier for the GAE model. Hard-coded for now.
        session_key: 'agVtdGVzdHIPCxIHU2Vzc2lvbhjO2iQM'
    },

    //Class vars
    //==========
    last_element_id: 0, //a counter that keeps track of our last used el id
    //A counter for numbering the In [_] calculation cells. `In` numbering 
    //should start at 1. Thus, this counter is initialized to 0 and will
    //increment to 1 upon calling get_next_calculation_id(). Because cells
    //may not necessarily be calculations (they can be text), we can't just
    //use the cell's id to number the calculations.
    last_calculation_id: 0,
    //An array of Element ids in the order in which they exist on the page.
    element_list: [],


    __init__: function(selector /* $('#worksheet') */, options) {
        $.extend(this.settings, options);

        //Create DOM <-> Object bridge. This enables us to easily access the
        //DOM/jQuery obj from this class. Conversely, we can also access this
        //class from a DOM/jQ obj.
        this.$el = selector; //jQuery object that selects #worksheet
        this.$el.data('Worksheet', this);
        
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
     * Returns int of the next cell's id.
     */
    get_next_element_id: function() {
        this.last_element_id += 1;
        return this.last_element_id;
    },

    /**
     * Returns int of number of Elements in Worksheet's element_list.
     */
    get_num_elements: function() {
        return this.element_list.length;
    },

    /**
     * Given an Element id (int), returns the Element's position on the page starting
     * from 1 (being the first Element on the page). If Element with given id
     * does not exist, returns undefined.
     */
    get_position: function(id) {
        return this.element_list.indexOf(id);
    },

    /**
     * Creates and adds a new InputCell and InsertCell object to the Worksheet
     * (along with the DOM object). If position is given, then the new objects
     * will be inserted at after that position in the cell_list with -1 being the
     * first/top-most position. If no position is given, then the new objs
     * will be inserted at the end of the list.
     *
     * @return Cell The newly added Cell object.
     */
    add_cell: function(position) {
        //Create new Cell object with a new ID.
        var cell_id = this.get_next_element_id();
        var cell = new InputCell(this, cell_id);

        //Create new InsertCell obj with the same id as the Cell.
        var insertcell_id = this.get_next_element_id();
        var insertcell = new InsertCell(this, insertcell_id);

        //We have three cases:
        //1. No position is given. Then new elements will be inserted at end
        //   of worksheet.
        //2. Position of -1 is given. New elements will be inserted at top
        //   of worksheet.
        //3. Position is > -1. We insert the element at that position.

        //Case #1: No position is given. Insert at end.
        if (position == undefined) {
            //Add cell's DOM element to end of worksheet.
            this.$el.append(cell.$el);
              
            //Also insert an InsertCell after this Cell.
            this.$el.append(insertcell.$el);

            //Add Cell's id and InsertCell's id to end of element list.
            this.element_list.push(cell_id);
            this.element_list.push(insertcell_id);
            
            //We trigger the keypress event on the Cell's InputArea so that it
            //won't be automatically removed. We don't want the last Cell in the
            //Worksheet to be auto-removed if not modified to give user a hint
            //as to where to type next.
            cell.input_area.$el.keypress();
        }

        //Case #2: Position of -1 is given. Insert at top.
        else if (position <= -1) {

        }

        //Case #3: Insert element at that position
        else {

        }

        return cell;

        //If position is given, new objects will be inserted there. Otherwise,
        //will be inserted at the end of the Worksheet if position is undefined
        //OR if position specifies adding a cell to the end of the Worksheet.
        var position_of_last_element = this.get_num_elements() - 1;
        if (position != undefined && position < position_of_last_element) {
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

        } else {
        }

        return cell;
    }
});
