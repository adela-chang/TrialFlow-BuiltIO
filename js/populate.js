google.load('visualization', '1', { 'packages': ['geochart'] });

function addCount(arr, key) {
	if (arr[key]) {
		arr[key] = arr[key]+1;
	} else {
		arr[key] = 1;
	}
}

$(document).ready(function() {

	// initialize built
	Built.initialize('blt5bd54a945725b8c8', 'blt378f40a796ac492f');
	
	// count # patients per trial and store the number
	var numPatients = {};
	var getNumPatients = new Built.Query('patients');
	getNumPatients.include('trial');
	getNumPatients.exec({
		onSuccess: function(data) {
			for (var i = 0; i < data.length; i++) {
				addCount(numPatients, data[i].get('trial')[0]['uid']);
			}
			
			// count # errors per trial and store the number
			var numErrors = {};
			var getNumErrors = new Built.Query('errors');
			getNumErrors.include('trial');
			getNumErrors.exec({
				onSuccess: function(data) {
					for (var i = 0; i < data.length; i++) {
						addCount(numErrors, data[i].get('trial')[0]['uid']);
					}
					
					var numTrials = 0;

					// now report statistics on all of the trials in the database
					var getTrials = new Built.Query('trials');
					var div = document.getElementById('trials');

					getTrials.exec({

						// trials is an array of Built.Object
						onSuccess: function(trials) {

							numTrials = trials.length;

							//for every trial, print the name and info for that trial in formatted form
							for (var i = 0; i < numTrials; i++) {

								var col = document.createElement('div');
								col.className = 'col-md-4 portfolio-item';

								//the div which google api will refer to to generate a map
								var chart_div = document.createElement('div');
								chart_div.id = 'chart_div' + i;
								chart_div.style.width = '80%';

								//div containing text to be shown. must be a separate div so we can format the map above the text 
								var text = document.createElement('div');
								var labeltext;
								if (numErrors[trials[i].get('uid')] === undefined) {
									labeltext = '<span class="label label-success">0</span>';
								} else {
									labeltext = '<span class="label label-danger">' + numErrors[trials[i].get('uid')] + '</span>';
								}				
								text.innerHTML = '<h3><a href="breakdown.html?id=' + trials[i].get('uid') + '">' + trials[i].get('name') + '   </a>' + labeltext + '</h3>' +
												'<h4>' + trials[i].get('description') + '</h4>' + '<p>Total patients: ' + numPatients[trials[i].get('uid')] + '</p>';

								//append divs in this order to ensure map appears above text
								col.appendChild(chart_div);
								col.appendChild(text);

								//finally, append the entire thing to our original webpage
								div.appendChild(col);				

							}

							//draws the maps
							populateMaps(numTrials);
						},
						onError: function(err) {}
					});
					
				
					
				},
					onError: function(err) {}
				});
			
			
		},
			onError: function(err) {}
		});

	
	function populateMaps(numTrials) {
		for (var i = 0; i < numTrials; i++) {
			$('#chart_div'+i).ready(function() {
				
				//using fixed data for now, but this should be extracted from the database based on clinic locations (?)
				var data = google.visualization.arrayToDataTable([
					["Country", "Total Patients"],
					["France", 1],
					["France", 1],
					["United States", 1]
				]);
				var options = {};
				var chart = new google.visualization.GeoChart(document.getElementById('chart_div' + i));
				chart.draw(data, options);			
			});
		}
		
	}
});
