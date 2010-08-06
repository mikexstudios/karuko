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

    //Whenever a textarea is focused, set up events for it.
    //BUG: For some reason, all new textareas when first focused, are focused
    //     twice. When `live` is changed to `blur`, this problem doesn't exist.
    $('#worksheet .entry textarea').live('focus', function(e) {
        console.log('focused');

        $(this).autoGrow();
        //$(this).autoResize({
        //    animate: false, 
        //    extraSpace: 0,
        //    limit: 9999 //dummy large value
        //});
    });
    //Unbind events when textarea is unfocused.
    $('#worksheet .entry textarea').live('blur', function(e) {
        console.log('blurred');
    });

    //NOTE: This only applies to existing textareas.
    //$('#worksheet .entry textarea').autoResize({
    //    animate: false, 
    //    extraSpace: 0,
    //    limit: 9999 //dummy large value
    //});

    //Handle keypress events inside of cell. This should be heavily
    //optimized, but can do that later.
    $('#worksheet .entry textarea').live('keydown', function(e) {
        //Only handle up and down arrows.
        if (e.keyCode == 38 || e.keyCode == 40) { //up or down
            //Split textarea value into individual lines
            var lines = $(this).val().split('\n');

            //Get cursor position. We differentiate between selecting
            //start and end in the selection in case user selects a
            //range.
            if (e.keyCode == 38) { //up
                var position = $(this).caret().start;
                //Calculate if the cursor is on the first line.
                if (position <= lines[0].length) {
                    //TODO: Crude traversing. Clean this up later.
                    //The first prev takes us to the between div. The
                    //next prev takes us to the previous table.
                    var prev = $(this).closest('table').prev().prev();
                    //We have :last since the autoresizer jQuery plugin
                    //creates two textareas. We will make this more elegant
                    //later.
                    prev = prev.find('textarea:last');
                    prev.caret(position, position);
                    //Need to return false so that the caret position 
                    //remains set. Otherwise, the caret will jump to 
                    //position 0.
                    return false;
                }
            } else { //down
                var position = $(this).caret().end;
                //Calculate if the cursor is on the last line by summing
                //the number of characters before the last line and 
                //comparing to cursor position.
                var last_line_offset = 0;
                //Only sum for lines before the last line.
                $.each(lines.slice(0, -1), function(i, v) {
                    last_line_offset += v.length;
                    //Correction since each "newline" also takes a position.
                    last_line_offset += 1;
                });
                if (position >= last_line_offset) {
                    var next = $(this).closest('table').next().next();
                    next = next.find('textarea:last');
                    var caret_position = position - last_line_offset;
                    next.caret(caret_position, caret_position);
                    return false;
                }
            }
        }
    });

    //Execute cell when user presses shift+return. Right now, has to be bound
    //to each textarea. Look into making this use `live`.
    $('#worksheet .entry textarea').bind('keydown', 'shift+return', function(e) {
        //Don't let the enter create a newline.
        e.preventDefault();
        //Send calculation to server.
        $(this).val('sent!');
        //Display notification to user that calculation is running.

        //Set up callback so that the output can be displayed. Note that
        //we don't display the output cell until the output has been 
        //received.

        //NOTE: The callback should also set the In numbering.

        //Set up next input cell and put cursor there.
        $(this).closest('table').after(
            '<table id="cell-1" class="calculation cell"></table>'
        );
        //Create the table using our template. This is easier than
        //statically coding this in JS.
        $('#cell-1').html($('#new_cell_template').html());
        $('#cell-1 .entry textarea').focus();

        //NOTE: Need to also add events on this newly created textarea.
    });


    //Set focus on first first cell. (We get the next() cell after the 
    //first cell since the autoresizer creates another textarea.
    //$('#worksheet .entry textarea:first').next().focus();
    //$('#worksheet .entry textarea:first').next().focus();
    $('#worksheet .entry textarea:first').focus();
});
