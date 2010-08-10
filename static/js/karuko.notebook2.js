var Worksheet = Class.$extend({
    settings: {
        //Use JSONP server to get around cross-domain requests.
        calc_server: 'http://mtest.appspot.com/shell.do?callback=?',
        //Session obj identifier for the GAE model. Hard-coded for now.
        session_key: 'agVtdGVzdHIPCxIHU2Vzc2lvbhjO2iQM'
    },

    __init__: function(selector /* $('#worksheet') */, options) {
        this.$el = selector; //jQuery object that selects #worksheet
        $.extend(this.settings, options);
    }
});


$(document).ready(function() {
    var worksheet = Worksheet($('#worksheet'), {});
});
