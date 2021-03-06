require.config({
    paths: {
        jquery: '../bower_components/jquery/jquery',
        bootstrapAffix: '../bower_components/sass-bootstrap/js/affix',
        bootstrapAlert: '../bower_components/sass-bootstrap/js/alert',
        bootstrapButton: '../bower_components/sass-bootstrap/js/button',
        bootstrapCarousel: '../bower_components/sass-bootstrap/js/carousel',
        bootstrapCollapse: '../bower_components/sass-bootstrap/js/collapse',
        bootstrapDropdown: '../bower_components/sass-bootstrap/js/dropdown',
        bootstrapModal: '../bower_components/sass-bootstrap/js/modal',
        bootstrapPopover: '../bower_components/sass-bootstrap/js/popover',
        bootstrapScrollspy: '../bower_components/sass-bootstrap/js/scrollspy',
        bootstrapTab: '../bower_components/sass-bootstrap/js/tab',
        bootstrapTooltip: '../bower_components/sass-bootstrap/js/tooltip',
        bootstrapTransition: '../bower_components/sass-bootstrap/js/transition',
        bootstrap: '../bower_components/bootstrap/dist/js/bootstrap',
        requirejs: '../bower_components/requirejs/require',
        owlCarousel: '../bower_components/owlcarousel/owl-carousel/owl.carousel',
        'sass-bootstrap': '../bower_components/sass-bootstrap/dist/js/bootstrap'
    },
    shim: {
        owlCarousel: {
            deps: [
                'jquery'
            ]
        },
        bootstrap: {
            deps: [
                'jquery'
            ]
        },
        bootstrapAffix: {
            deps: [
                'jquery'
            ]
        },
        bootstrapAlert: {
            deps: [
                'jquery',
                'bootstrapTransition'
            ]
        },
        bootstrapButton: {
            deps: [
                'jquery'
            ]
        },
        bootstrapCarousel: {
            deps: [
                'jquery',
                'bootstrapTransition'
            ]
        },
        bootstrapCollapse: {
            deps: [
                'jquery',
                'bootstrapTransition'
            ]
        },
        bootstrapDropdown: {
            deps: [
                'jquery'
            ]
        },
        bootstrapModal: {
            deps: [
                'jquery',
                'bootstrapTransition'
            ]
        },
        bootstrapPopover: {
            deps: [
                'jquery',
                'bootstrapTooltip'
            ]
        },
        bootstrapScrollspy: {
            deps: [
                'jquery'
            ]
        },
        bootstrapTab: {
            deps: [
                'jquery',
                'bootstrapTransition'
            ]
        },
        bootstrapTooltip: {
            deps: [
                'jquery',
                'bootstrapTransition'
            ]
        },
        bootstrapTransition: {
            deps: [
                'jquery'
            ]
        }
    }
});

require(['jquery', 'bootstrap','app','gdrive', 'owlCarousel'], function ($, bootstrap, app, gdrive) {

    function onChartsLoaded() {
			$("#status").html("3pg model");
			
			var version = app.qs("version");
			var devmode = app.qs("devmode");
			
            // TODO
            //if( devmode ) app.devmode = true;
			
			app.loadModelCode(version, function(){
				$("#status").html("3pg data");
			    $("body").html("").load("app.html", function(){
					app.init(function(){
						gdrive.init(function(){
							var file = app.qs("file");
							if( file ) gdrive.load(file);
								
							// see if we are loading for google drive
							var state = app.qs("state");
							if( state ) {
								state = JSON.parse(state);
								gdrive.load(state.ids[0]);
							}
						});
					});
				});
		    });
    };

    if( chartsLoaded ) {
        onChartsLoaded();
    } else {
        chartsCallback = onChartsLoaded;
    }

		
	// override the log function
	window.log = function(msg) {
		if( app.debug ) console.log(msg);
	};

});
