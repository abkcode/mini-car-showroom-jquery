var app = {};
app.baseUrl = 'http://localhost:8888';
app.manufacturers = {};
app.models = {};
app.dashboardData = {};
app.cars = {};

$(document).ready(function(){

	fetchInitData();

	$('.form-add-manufacturer').submit(function(e){
		e.preventDefault();
		var form = $(this);
		handleFormSubmit(form, '/manufacturers/add');
	});

	$('.form-add-model').submit(function(e){
		e.preventDefault();
		var form = $(this);
		handleFormSubmit(form, '/models/add');
	});

	$('.form-add-car').submit(function(e){
		e.preventDefault();
		var form = $(this);
		$('.inputImage').parent().find('img').addClass('d-none');
		handleFormSubmit(form, '/cars/add');
	});

	$('.form-control').not('.inputImage').on('keyup keypress blur change', function() {
		validateInput($(this));
	});

	$('.inputImage').change(function(){
		var input = $(this);
		input.removeClass('is-invalid');
		var icon = input.parent().find('label > small');
		icon.html('<i class="fas fa-sync-alt fa-spin"></i>');
		var errorDiv = input.parent().find('.invalid-feedback');
		errorDiv.html('');
		var formData = new FormData();
		formData.append('img', $(this)[0].files[0]);

		$.ajax({
			url : app.baseUrl + '/cars/upload_image',
			type : 'POST',
			data : formData,
			processData: false,
			contentType: false,
			success : function(data) {
				console.log(data);
				icon.html('');
				input.parent().find('img').removeClass('d-none').attr('src',app.baseUrl + data.img_name);
				input.parent().find('input[type=hidden]').val(data.img_name);
			},
			error : function(err) {
				input.addClass('is-invalid');
				icon.html('');
				errorDiv.html(err.responseJSON.errors[0]);
			}
		});
	});

	$('.form-control').on('keyup keypress blur change', function() {
		validateInput($(this));
	});

	$(document).on("click", ".btn-view-cars", function() {
		$('#modelCars').modal('show');
		fetchCars($(this).attr('data-id'));
	});

	$(document).on("click", ".btn-sold", function() {
		var carId = $(this).attr('data-id');
		var btn = $(this);
		btn.html('<i class="fas fa-sync-alt fa-spin"></i> Processing...').attr('disabled','disabled');
		$.ajax({
			url : app.baseUrl + '/cars/' + carId,
			type : 'DELETE',
			processData: false,
			contentType: false,
			success : function(data) {
				btn.closest('.car-con').remove();
				if($('.car-con').length == 0) {
					$('#modelCars').modal('hide');
					fetchInitData();
				}
			}
		});
	});

});

function fetchInitData() {
	$('.loader-dashboard').removeClass('d-none');
	$('.content-dashboard').addClass('d-none');
	$.when(

		$.get(app.baseUrl + '/manufacturers', function(manufacturers) {
			Object.keys(manufacturers).forEach(function(key) {
				app.manufacturers[manufacturers[key].id] = manufacturers[key];
			});
		}),

		$.get(app.baseUrl + "/models", function(models) {
			Object.keys(models).forEach(function(key) {
				app.models[models[key].id] = models[key];
			});
		}),

		$.get(app.baseUrl + "/cars/dashboard", function(models) {
			app.dashboardData = models;
		})

		).then(function() {
			var rows = '';
			Object.keys(app.dashboardData).forEach(function(key) {
				var model = app.dashboardData[key];
				rows += '<tr>';
				rows += '<td>' + model.manufacturer_name + '</td>';
				rows += '<td>' + model.model_name + '</td>';
				rows += '<td>' + model.count + '</td>';
				rows += '<td class="text-center"><button class="btn btn-primary btn-view-cars" data-id="' + model.model_id + '">View</td>';
				rows += '</tr>';
			});
			$('.table-models tbody').html(rows);
			var options = '<option value="">Select</option>';
			Object.keys(app.manufacturers).forEach(function(key) {
				var manufacturer = app.manufacturers[key];
				options += '<option value="' + manufacturer.id + '">' + manufacturer.name + '</option>';
			});
			$('select[name=manufacturer_id]').html(options);
			var options2 = '<option value="">Select</option>';
			Object.keys(app.models).forEach(function(key) {
				var model = app.models[key];
				options2 += '<option value="' + model.id + '">' + model.name + '</option>';
			});
			$('select[name=model_id]').html(options2);
			$('.loader-dashboard').addClass('d-none');
			$('.content-dashboard').removeClass('d-none');
		});
	}

	function fetchCars(model_id) {
		$('.loader-cars').removeClass('d-none');
		$('.content-cars').addClass('d-none');
		$.when(

			$.get(app.baseUrl + '/cars?model_id=' + model_id, function(cars) {
				app.cars = cars;
			}),

			).then(function() {
				var html = '';
				Object.keys(app.cars).forEach(function(key) {
					var car = app.cars[key];
					html += '<div class="m-4 car-con car-con'+car.id+'">';
					html += '<table class="table table-bordered">';
					html += '<tr><td style="width:200px;"><strong>Model</strong></td><td>'+app.models[car.model_id].name+'</td></tr>';
					html += '<tr><td><strong>Color</strong></td><td>'+car.color+'</td></tr>';
					html += '<tr><td><strong>Manufacturing Year</strong></td><td>'+car.manufacturing_year+'</td></tr>';
					html += '<tr><td><strong>Registration Number</strong></td><td>'+car.registration_year+'</td></tr>';
					html += '<tr><td><strong>Image 1</strong></td><td><img class="img img-model" src="'+app.baseUrl+'/uploads/img/'+car.img1+'"></td></tr>';
					html += '<tr><td><strong>Image 2</strong></td><td><img class="img img-model" src="'+app.baseUrl+'/uploads/img/'+car.img2+'"></td></tr>';
					html += '<tr><td><strong>Note</strong></td><td>'+car.note+'</td></tr>';
					html += '<tr><td colspan="2" class="text-center"><button type="button" class="btn btn-success btn-sold" data-id="'+car.id+'">Sold</button></td></tr>';
					html += '</table>';
					html += '</div>';
				});
				$('.loader-cars').addClass('d-none');
				$('.content-cars').html(html).removeClass('d-none');
			});
		}

		function validateInput(input) {
			var error = input[0].validationMessage;
			if(error.length == 0) {
				input.removeClass('is-invalid');
				input.parent().find('.invalid-feedback').html('');
			} else {
				input.addClass('is-invalid');
				input.parent().find('.invalid-feedback').html(error);
			}
		}

		function handleFormSubmit(form, endpoint) {
			form.find('.form-control').each(function(){
				validateInput($(this));
			});

			if (form[0].checkValidity() === false) {
				return false;
			}

			var formArr = form.serializeArray();
			var formData = {}
			for (var i = 0; i < formArr.length; i++) {
				formData[formArr[i].name] = formArr[i].value;
			}

			form.find('.alert-errors').addClass('d-none');
			form.find('button[type=submit]').html('<i class="fas fa-sync-alt fa-spin"></i> Saving...').attr('disabled','disabled');
			$.ajax({
				url : app.baseUrl + endpoint,
				type : 'POST',
				data : JSON.stringify(formData),
				processData: false,
				contentType: false,
				success : function(data) {
					form.trigger("reset");
					form.closest('.modal').modal('hide');
					form.find('button[type=submit]').html('Save').removeAttr('disabled');
					fetchInitData();
				},
				error : function(err) {
					var errors = err.responseJSON.errors;
					var html = '';
					for (var i = 0; i < errors.length; i++) {
						html += '<li>' + errors[i] + '</li>';

					}
					form.find('.alert-errors').removeClass('d-none').find('ul').html(html);
					form.find('button[type=submit]').html('Save').removeAttr('disabled');
				}
			});
		}