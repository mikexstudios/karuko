(function($){
    //Custom namespace
    $.karuko = {
        last_cell_id: 1, //used for numbering cells
        calc_server: 'http://mtest.appspot.com/shell.do?callback=?',
        //Session obj identifier for the GAE model. Hard-coded for now.
        session_key: 'agVtdGVzdHIPCxIHU2Vzc2lvbhjO2iQM'
    };
})(jQuery);

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

function focus_prev(curr) {
    //console.log('focus prev');
    //NOTE: Right now we are only handling textareas and not the new_cell
    //      in-betweens.
    //TODO: Crude traversing. Clean this up later.
    //The first prev takes us to the between div. The next prev takes us to the
    //previous table.
    var prev = $(curr).closest('table').prev().prev();
    prev = prev.find('.entry textarea');
    //Check to see if we found a textarea, otherwise bail.
    if (prev.length <= 0) return;
    //Now move cursor there.
    prev.focus();
}

function focus_next(curr) {
    //console.log('focus next');
    var next = $(curr).closest('table').next().next();
    next = next.find('.entry textarea');
    //Check to see if we found a textarea, otherwise bail.
    if (next.length <= 0) return;
    next.focus();
}

function get_largest_cell_id() {
    var cell_id = 1;
    var curr_id = 1;
    //Determine the largest cell id number.
    $('#worksheet .cell').each(function(i, v) {
        //Get id of cell, like 'cell-1'. Then extract the integer part.
        curr_id = parseInt(v.id.split('-')[1]);
        if (cell_id < curr_id) cell_id = curr_id;
    });

    return cell_id;
}

function get_next_cell_id() {
    $.karuko.last_cell_id += 1;
    return $.karuko.last_cell_id;
}

function execute_cell(event) {
    console.log('execute');
    //Don't let the enter create a newline.
    event.preventDefault();

    //No matter what, once a cell has been executed, assign a number to it.
    $(this).parent('.entry').prev('.line').text('In ['+($.karuko.last_cell_id)+']:');
      
    //Set up next input cell and put cursor there.
    var new_cell_id = get_next_cell_id();
    $(this).closest('table').after(
        '<div class="new_cell_bar"></div> \
        <table id="cell-'+new_cell_id+'" class="calculation cell"></table>'
    );
    //Create the table using our template. This is easier than
    //statically coding this in JS.
    $('#cell-'+new_cell_id).html($('#new_cell_template').html());
    $('#cell-'+new_cell_id+' .entry textarea').focus();
    //NOTE: Need to also add events on this newly created textarea.

    //Send calculation to server.
    var payload = {
        //statement: escape($.trim($(this).val())), 
        statement: $.trim($(this).val()), 
        session: $.karuko.session_key
    };

    $this = $(this); //Alias so we can refer to current cell inside getJSON callback.
    $.getJSON($.karuko.calc_server, payload, function(data) {
        //If there is no output, then don't show output cell
        if (data.out != '') {
            //Insert output tr after input tr.
            var input_tr = $this.closest('tr.input');
            input_tr.after(
                $('#output_tr_template tbody').html()
            );
            //Insert our data into output tr
            var output_tr = input_tr.next();
            //TODO: Better way of numbering lines.
            output_tr.children('.line').text('Out['+($.karuko.last_cell_id-1)+']:');
            output_tr.children('.entry').text(data.out);

            //console.log(data.out);
        }
    });
    //Display notification to user that calculation is running.

    //Set up callback so that the output can be displayed. Note that
    //we don't display the output cell until the output has been 
    //received.

    //NOTE: The callback should also set the In numbering.

}

$(document).ready(function() {
    //Initialize our counter for cells by finding the largest cell number in the
    //existing worksheet.
    $.karuko.last_cell_id = get_largest_cell_id();

    //If the worksheet length isn't long enough, extend it to fill the vertical
    //height of the screen.
    worksheet_vertical_fill();

    //Whenever a textarea is focused, set up events for it.
    $('#worksheet .entry textarea').live('focusin', function(e) {
        //console.log('focused');

        //Make the textarea auto expand on newlines.
        $(this).autoGrow();

        //Since jquery hotkeys can't be used with `live`, we need to manually
        //bind each key here.
        $(this).bind('keydown.karuko', 'shift+return', execute_cell);

        $(this).bind('keydown.karuko', 'up', function(e) {
            //Need to determine if the start of the cursor selection is on the
            //first line.
            var lines = $(this).val().split('\n');
            var position = $(this).caret().start;
            //Calculate if the cursor is on the first line.
            if (position <= lines[0].length) {
                focus_prev(this);
                
                //Need to prevent default so that the caret position remains set.
                //Otherwise, the caret will jump to position 0.
                e.preventDefault();
            }
        });
        $(this).bind('keydown.karuko', 'down', function(e) {
            var lines = $(this).val().split('\n');
            var position = $(this).caret().end;
            //Calculate if the cursor is on the last line by summing the number
            //of characters before the last line and comparing to cursor
            //position.
            var last_line_offset = 0;
            //Only sum for lines before the last line.
            $.each(lines.slice(0, -1), function(i, v) {
                last_line_offset += v.length;
                //Correction since each "newline" also takes a position.
                last_line_offset += 1;
            });
            if (position >= last_line_offset) {
                focus_next(this);
                
                //Need to prevent default so that the caret position remains set.
                //Otherwise, the caret will jump to position 0.
                e.preventDefault();
            }
        });

    });
    //Unbind events when textarea is unfocused.
    $('#worksheet .entry textarea').live('focusout', function(e) {
        //console.log('blurred');

        //Unbind the textarea auto expand.
        $(this).unbind('keyup.autogrow');

        $(this).unbind('keydown.karuko');
    });


    //Set focus on first first cell. (We get the next() cell after the 
    //first cell since the autoresizer creates another textarea.
    $('#worksheet .entry textarea:first').focus();
});
