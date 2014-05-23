google.load("visualization", "1", {packages:["corechart"]});

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

// looks up the trial name using the id given in URL parameters, and sets title of the page to be that name
function setName() {
	
	// query the database to find out name of trial corresponding to given trial id
	var trialNameQuery = new Built.Query('trials');
	trialNameQuery.where('uid', urlParams['id']);
	
	trialNameQuery.exec({
		onSuccess: function(data) {
			
			// if query return no rows, issue an alert that the passed in trial id is incorrect
			if (jQuery.isEmptyObject(data)) { alert("Invalid clinical trial id! Double check your URL.");}

			// otherwise, set the title of the page to the name of the trial we're looking at
			$("#overview").html(data[0].get('name') + ' <small>Overview</small>');
		},
		onError: function(err) {
			console.log('error executing trial name query!');
		}
	});
}

function drawAll() {
	
	var patientCount = {}; // assoc array which keeps track of # patients per clinic in form:
							// {clinic name: {Active:#, Pending:#, Status:#}}
	var cid = {}; //assoc array which keeps track of clinic ids in form {clinic name: uid}
	var myQuery = new Built.Query('patients');
	
	// find the trial based on its trial id, which should be in the url
	myQuery.where('trial', urlParams["id"]);
	myQuery.include('clinic');
	myQuery.exec({

		onSuccess: function(patients) {
			
			// count the number of patients per clinic manually and puts it into patientCount
			for (var i = 0; i < patients.length; i++) {
				for (var key in patients[i].get('clinic')) {
					console.log(key);
	      		}
				var cName = patients[i].get('clinic')[0]['name'];
				cid[cName] = patients[i].get('clinic')[0]['uid']; // store uid	
				if (patientCount[cName]) { //increment count of patients per clinic for this clinic
					patientCount[cName][patients[i].get('status')] = patientCount[cName][patients[i].get('status')]+1;
				} else {
					patientCount[cName] = {Active:0, Pending:0, Done:0};
					patientCount[cName][patients[i].get('status')] = patientCount[cName][patients[i].get('status')]+1;
				}
			}
			
			// convert patientCount (associative array) to an following google specs so google can use it to draw the bar graph
			var patientTotalArray = [["Site", "Number of Patients"]];
			var max = 0;
			for (key in patientCount) {				
				var total = patientCount[key]["Active"]+patientCount[key]["Pending"]+patientCount[key]["Done"];
				if (total > max) { max = total; }
				patientTotalArray.push([key, total]);
			}
			drawBarGraph(patientTotalArray, max);

			// draw the pie chart for each clinic &calculate the breakdown
			for (key in patientCount) {
				
				generatePieDivs(key, patientCount, cid); //generate necessary html divs+text
				
				//create the array for google visualizations
				var patientArray = [["State", "Total"]];
				patientArray.push(["Pending", patientCount[key]["Pending"]]);
				patientArray.push(["Active", patientCount[key]["Active"]]);
				patientArray.push(["Done", patientCount[key]["Done"]]);
				
				//draw the actual pie chart
			    var data = google.visualization.arrayToDataTable(patientArray);

			    var options = {
			        title: 'Protocol States'
			    };

			    var chart = new google.visualization.PieChart(document.getElementById(key));
			        chart.draw(data, options);
			    
			}
		    
		},
		onError: function(err) {
			console.log('error');
		}
	});
}

// takes in an array of the form [["column title", "column title"], [" value", "column value"], ["v"]]
function drawBarGraph(arr, max) {
	var data = google.visualization.arrayToDataTable(arr);

    var options = {
      title: 'Clinic Breakdown',
      hAxis: {title: 'Sites', titleTextStyle: {color: 'red'}},
      vAxis: {viewWindowMode: 'explicit', viewWindow: {max:max+1,min:0}}
    };

    var chart = new google.visualization.ColumnChart(document.getElementById('chart_div'));
    chart.draw(data, options);
}

// creates the necessary divs with which to display our pie charts
function generatePieDivs(key, patientCount, cid) {
	console.log('test:' + cid[key]);
	var col = document.createElement('div');
	col.className = 'col-md-4 portfolio-item';

	var pie_div = document.createElement('div');
	pie_div.id = key;
	pie_div.style.width = '100%';
	
	col.appendChild(pie_div);
	document.getElementById('piecharts').appendChild(col);
	
	// make a request to the server to determine the # of errors at this clinic for this trial
	var numErrorsQuery = new Built.Query('errors');

	var select_clinic = new Built.Query('clinics');
	select_clinic.where('uid', cid[key]);
	var select_trial = new Built.Query('trials');
	select_trial.where('uid', urlParams['id']);
	numErrorsQuery.select('clinic', select_clinic, 'uid');
	numErrorsQuery.select('trial', select_trial, 'uid');
	numErrorsQuery.exec({
		onSuccess: function(data) {

			console.log('key: ' + cid[key]);
			var numErrors = data.length;
			var text = document.createElement('div');	
			var html = 	'<h3><a href="errors.html?uid=' + cid[key] + '">' + key + '</a>';
			if (numErrors > 0) {
				html = html + '  <span class="label label-danger">';
			} else {
				html = html + '  <span class="label label-success">';
			}
			var t = patientCount[key]["Active"]+patientCount[key]["Pending"]+patientCount[key]["Done"];
			html = html + numErrors + '</h3>' + '<h4>Protocol Total: ' + t +
					'</h4><h5><ul><li>Pending: ' + patientCount[key]['Pending'] +
					'</li><li>Active: ' + patientCount[key]['Active'] + '</li><li>Done: ' + patientCount[key]['Done'] + '</li>';
			text.innerHTML = html;

			//add the divs into the document
			col.appendChild(text);
		},
		onError: function(err) {
			console.log('error');
		}
	});
	
}

$(document).ready(function() {
	console.log(urlParams["id"]);
	Built.initialize('blt5bd54a945725b8c8', 'blt378f40a796ac492f');
	setName();
	drawAll();
});