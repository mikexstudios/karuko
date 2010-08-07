(function($) {

//Public Method
$.fn.autoGrow = function() {
    //Private variables
    var colsDefault = 0;
    
    //Helper functions
    function grow(txtArea)
    {
        var linesCount = 0;
        var lines = txtArea.value.split('\n');
    
        for (var i=lines.length-1; i>=0; --i)
        {
            linesCount += Math.floor((lines[i].length / colsDefault) + 1);
        }
    
        //This controls the height of the textarea.
        txtArea.rows = linesCount;
    }

    //Only work on textareas
	this.filter('textarea').each(function() {
        //Set default values
    	colsDefault = this.cols;
        
        //Bind events
    	$(this).bind('keyup.autogrow', function() {
    		grow(this);
    	});
	});

    return this;
};

})(jQuery);
