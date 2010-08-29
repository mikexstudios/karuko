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
        this.element_list.push(0); //0 is the InsertCell's ID.
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
    get_position_for_id: function(id) {
        return this.element_list.indexOf(id);
    },

    /**
     * Given a position returns the Element at that position. If does not
     * exist, returns undefined.
     */
    get_element_at_position: function(position) {
        //Get Element's ID at given position
        var id = this.element_list[position];
        //Return the Element associated with the Cell's ID.
        return this.get_element(id);
    },

    /**
     * Returns the Element object associated with the given id. If does not
     * exist, returns undefined.
     *
     * Note, the returned object *can* be the subclassed Element object. That
     * is, it can be a Cell or InsertCell object.
     */
    get_element: function(id) {
        //We use jQ's selector to grab the Element DOM. Then we use the DOM to
        //Obj bridge to get the object.
        return $('#el-' + id).data('Element');
    },

    /**
     * Removes Element (given its id) from Worksheet's element_list. Also
     * removes the Element DOM from the page.
     */
    remove: function(id) {
        var element = this.get_element(id);
        if (element) {
            //Remove from element_list
            var i = this.get_position_for_id(id);
            this.element_list.splice(i, 1); //Remove that element from array

            //Remove DOM object from #worksheet
            element.destroy();
        }
    },

    /**
     * Creates and adds a new InputCell and InsertCell object to the Worksheet
     * (along with the DOM object). If position is given, then the new objects
     * will be inserted at after that position in the element_list with 0 being
     * the first/top-most position. If no position is given, then the new objs
     * will be inserted at the end of the list.
     *
     * @param position int The index in element_list at which the new Cell
     *                     should be inserted.
     * @param CellClass object The class that the new Cell should be created 
     *                         from. Defaults to InputCell.
     * @return Cell The newly added Cell object.
     */
    add_cell: function(position, CellClass) {
        //Position should never be <= 0 since that would mean inserting a new Cell
        //and InsertCell element at the top of the Worksheet above the first
        //InsertCell (with ID = 0). We do not allow this since that InsertCell
        //(with ID = 0) should *always* be at the top of the Worksheet.
        if (position <= 0) return;

        //Create new Cell object with a new ID.
        var cell_id = this.get_next_element_id();
        if (CellClass != undefined) {
            var cell = new CellClass(this, cell_id);
        } else {
            var cell = new InputCell(this, cell_id);
        }

        //Create new InsertCell obj with the same id as the Cell.
        var insertcell_id = this.get_next_element_id();
        var insertcell = new InsertCell(this, insertcell_id);

        //For later convenience, we tell the Cell what InsertCell obj is
        //associated with it.
        cell.insertcell = insertcell;

        //If position is specified, we insert cell and insertcell there. That is
        //suppose we have a list of element ids: [0, 1, 2, 3, 4], then we insert
        //5 at position/index 2. The list now would be: [0, 1, 5, 2, 3, 4].
        //NOTE: If the given position is at the end of the worksheet, then we
        //want to guide the execution into the `else` branch since in there, we
        //also invoke the keypress to keep that Cell from automatically removed.
        var position_of_last_element = this.get_num_elements() - 1;
        if (position != undefined && position < position_of_last_element) {
            //Add the element ids to the list. 
            this.element_list.splice(position, 0, cell_id);
            this.element_list.splice(position + 1, 0, insertcell_id);

            //We insert the DOM Cell and InsertCell elements *after* the 
            //DOM element in the `position - 1` position. 
            //NOTE: This fails when position = 0 because there is no DOM
            //element before that. However, we never add cells with 
            //position <= 0.
            var existing = this.get_element_at_position(position - 1);
            //NOTE: To have the InsertCell appear *after* the Cell, we insert
            //it before we insert the Cell so that it gets pushed down when we
            //insert the Cell.
            existing.$el.after(insertcell.$el);
            existing.$el.after(cell.$el);
        }
        //Otherwise, we insert at the end of the worksheet.
        else {
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
            //TODO: Review if this is a good idea.
            cell.input_area.$el.keypress();
        }

        return cell;
    },

    /**
     * Returns int of the next numbering for `In [_]` calculation cells.
     */
    get_next_calculation_id: function() {
        this.last_calculation_id += 1;
        return this.last_calculation_id;
    },


    /**
     * Returns prev element before the given element id. If does not exist,
     * returns undefined.
     */
    get_prev_element: function(id) {
        //Determine the index of the given id
        var i = this.get_position_for_id(id);
        //Now, get prev element id
        var prev_id = this.element_list[i-1];

        return this.get_element(prev_id);
    },
});
