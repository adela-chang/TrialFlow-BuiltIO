google.load('visualization', '1', { 'packages': ['table'] });

//Extracts the URL parameters of form "?key=value"
var urlParams;
(window.onpopstate = function () {
    var match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
        query  = window.location.search.substring(1);

    urlParams = {};
    while (match = search.exec(query))
       urlParams[decode(match[1])] = decode(match[2]);
})();

$(document).ready(function() {

	// initialize built
	Built.initialize('blt5bd54a945725b8c8', 'blt378f40a796ac492f');

  	var select_query = new Built.Query('clinics');
  	select_query.where('uid', urlParams['uid']);

	var myQuery = new Built.Query('errors');
	myQuery.select('clinic', select_query, 'uid');
	myQuery.include('patient');
	myQuery.exec({

		// data is an array of Built.Object
		onSuccess: function(errors) {
			var array = [];
			for (var i = 0; i < errors.length; i++) {
				console.log(errors[i].get('clinic'));
				/*console.log(errors[i].get('date'));
				console.log(errors[i].get('type'));
				console.log(errors[i].get('description'));
				console.log(errors[i].get('patient')[0]['uid']);
				console.log(errors[i].get('clinic')[0]['name']);*/
				var row = [
					errors[i].get('date'),
					errors[i].get('type'),
					errors[i].get('description'),
					errors[i].get('patient')[0]['uid'],
					'Not Implemented Yet'
					//errors[i].get('clinic')[0]['name']
					];
				array[i] = row;
			}
			
			var data = new google.visualization.DataTable();
	        data.addColumn('string', 'Date');
	        data.addColumn('string', 'Error Type');
	        data.addColumn('string', 'Error Description');
	        data.addColumn('string', 'Patient ID');
	        data.addColumn('string', 'Nurse ID');
	        data.addRows(array);
	        var table = new google.visualization.Table(document.getElementById('table_div'));
	        table.draw(data, {sort: 'enable', sortColumn:0, sortAscending:false});
	        
		},
		onError: function(err) {}
	});
	
});
