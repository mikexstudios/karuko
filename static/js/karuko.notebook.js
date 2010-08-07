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

function execute_cell(event) {
    console.log('execute');
    //Don't let the enter create a newline.
    event.preventDefault();

    //Send calculation to server.
    $(this).val('sent!');
    //Display notification to user that calculation is running.

    //Set up callback so that the output can be displayed. Note that
    //we don't display the output cell until the output has been 
    //received.

    //NOTE: The callback should also set the In numbering.

    //Set up next input cell and put cursor there.
    $(this).closest('table').after(
        '<div class="new_cell_bar"></div> \
        <table id="cell-1" class="calculation cell"></table>'
    );
    //Create the table using our template. This is easier than
    //statically coding this in JS.
    $('#cell-1').html($('#new_cell_template').html());
    $('#cell-1 .entry textarea').focus();

    //NOTE: Need to also add events on this newly created textarea.
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

        //Make the textarea auto expand on newlines.
        $(this).autoGrow();

        //Since jquery hotkeys can't be used with `live`, we need to manually
        //bind each key here.
        $(this).bind('keydown.karuko', 'shift+return', execute_cell);
        $(this).bind('keydown.karuko', 'up', function(e) {
            focus_prev(this);
            
            //Need to return false so that the caret position remains set.
            //Otherwise, the caret will jump to position 0.
            return false;
        });
        $(this).bind('keydown.karuko', 'down', function(e) {
            focus_next(this);
            
            //Need to return false so that the caret position remains set.
            //Otherwise, the caret will jump to position 0.
            return false;
        });
    });
    //Unbind events when textarea is unfocused.
    $('#worksheet .entry textarea').live('blur', function(e) {
        //Unbind the textarea auto expand.
        $(this).unbind('keyup.autogrow');

        $(this).unbind('keydown.karuko');
    });


    //Set focus on first first cell. (We get the next() cell after the 
    //first cell since the autoresizer creates another textarea.
    //Disabled focusing for now since this triggers live events twice...
    //$('#worksheet .entry textarea:first').focus();
});
