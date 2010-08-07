(function($) {

//Public Method
$.fn.autoGrow = function() {
    //Private variables
    var colsDefault = 0;
    var rowsDefault = 0;
    //var rowsCounter = 0;
    
    //Helper functions
    function grow(txtArea)
    {
        var linesCount = 0;
        var lines = txtArea.value.split('\n');
    
        for (var i=lines.length-1; i>=0; --i)
        {
            linesCount += Math.floor((lines[i].length / colsDefault) + 1);
        }
    
        if (linesCount >= rowsDefault)
            //HACK: Comment out +1 since we want the textarea to only be one row.
            txtArea.rows = linesCount;// + 1;
    	else
            txtArea.rows = rowsDefault;
    	//rowsCounter.innerHTML = linesCount + " | " + txtArea.rows;
    }

    //Only work on textareas
	this.filter('textarea').each(function() {
        //Set default values
    	colsDefault = this.cols;
    	rowsDefault = this.rows;
        
        //Bind events
    	$(this).bind('keyup.autogrow', function() {
    		grow(this);
    	});
	});

    return this;
};

})(jQuery);
